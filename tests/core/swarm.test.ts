import { Swarm } from '../../src/swarm';
import { Agent } from '../../src/types';

// Mock OpenAI client
jest.mock('openai');

describe('Swarm Core Functionality', () => {
  let swarm: Swarm;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
    swarm = new Swarm(mockClient);
  });

  test('handles simple user message', async () => {
    const agent = new Agent({
      name: 'TestAgent',
      instructions: 'You are a helpful assistant.',
      functions: [],
      model: 'gpt-4'
    });

    mockClient.chat.completions.create.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'Hello! How can I help you?',
          role: 'assistant'
        }
      }]
    });

    const response = await swarm.run({
      agent,
      messages: [{ role: 'user', content: 'Hello' }]
    });

    expect(response.messages).toHaveLength(1);
    expect(response.messages[0].content).toBe('Hello! How can I help you?');
    expect(response.agent).toBe(agent);
  });

  test('executes agent functions with parameters', async () => {
    const testFunction = jest.fn((params: { value: string }) => `Received: ${params.value}`);
    // Set the name property for the function so it can be found in the function map
    Object.defineProperty(testFunction, 'name', { value: 'testFunction', configurable: true });
    
    const agent = new Agent({
      name: 'FunctionAgent',
      instructions: 'Test agent with functions',
      functions: [testFunction],
      model: 'gpt-4'
    });

    mockClient.chat.completions.create.mockResolvedValueOnce({
      choices: [{
        message: {
          content: null,
          role: 'assistant',
          tool_calls: [{
            id: 'call_123',
            type: 'function',
            function: {
              name: 'testFunction',
              arguments: JSON.stringify({ value: 'test input' })
            }
          }]
        }
      }]
    });

    mockClient.chat.completions.create.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'Function executed successfully',
          role: 'assistant'
        }
      }]
    });

    const response = await swarm.run({
      agent,
      messages: [{ role: 'user', content: 'Run the test function' }]
    });

    expect(testFunction).toHaveBeenCalledWith({ value: 'test input' });
    expect(response.messages.length).toBeGreaterThan(0);
  });

  test('respects executeTools=false parameter', async () => {
    const testFunction = jest.fn();
    Object.defineProperty(testFunction, 'name', { value: 'testFunction', configurable: true });
    
    const agent = new Agent({
      name: 'NoExecAgent',
      instructions: 'Test agent',
      functions: [testFunction],
      model: 'gpt-4'
    });

    mockClient.chat.completions.create.mockResolvedValueOnce({
      choices: [{
        message: {
          content: null,
          role: 'assistant',
          tool_calls: [{
            id: 'call_456',
            type: 'function',
            function: {
              name: 'testFunction',
              arguments: '{}'
            }
          }]
        }
      }]
    });

    const response = await swarm.run({
      agent,
      messages: [{ role: 'user', content: 'Try to run function' }],
      execute_tools: false
    });

    expect(testFunction).not.toHaveBeenCalled();
    expect(response.messages[0].tool_calls).toBeDefined();
  });

  test('handles agent handoffs correctly', async () => {
    const agent2 = new Agent({
      name: 'Agent2',
      instructions: 'Second agent',
      functions: [],
      model: 'gpt-4'
    });

    const transferFunction = () => agent2;
    Object.defineProperty(transferFunction, 'name', { value: 'transferFunction', configurable: true });
    
    const agent1 = new Agent({
      name: 'Agent1',
      instructions: 'First agent',
      functions: [transferFunction],
      model: 'gpt-4'
    });

    mockClient.chat.completions.create.mockResolvedValueOnce({
      choices: [{
        message: {
          content: null,
          role: 'assistant',
          tool_calls: [{
            id: 'call_789',
            type: 'function',
            function: {
              name: 'transferFunction',
              arguments: '{}'
            }
          }]
        }
      }]
    });

    mockClient.chat.completions.create.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'Hello from Agent2',
          role: 'assistant'
        }
      }]
    });

    const response = await swarm.run({
      agent: agent1,
      messages: [{ role: 'user', content: 'Transfer to agent2' }]
    });

    expect(response.agent).toBe(agent2);
    expect(response.messages.some(m => m.sender === 'Agent2')).toBe(true);
  });
});