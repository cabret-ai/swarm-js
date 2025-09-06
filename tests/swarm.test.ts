// Tests for Swarm class
// Based on Python tests/test_core.py

import { Swarm, Agent, Result } from '../src';
import { MockOpenAIClient, createMockResponse } from './mockClient';

const DEFAULT_RESPONSE_CONTENT = 'sample response content';

describe('Swarm', () => {
  let mockOpenAIClient: MockOpenAIClient;

  beforeEach(() => {
    mockOpenAIClient = new MockOpenAIClient();
    mockOpenAIClient.setResponse(
      createMockResponse({ role: 'assistant', content: DEFAULT_RESPONSE_CONTENT })
    );
  });

  test('run with simple message', async () => {
    const agent = new Agent();
    const client = new Swarm(mockOpenAIClient as any);
    const messages = [{ role: 'user' as const, content: 'Hello, how are you?' }];
    
    const response = await client.run({ agent, messages });

    expect(response.messages[response.messages.length - 1].role).toBe('assistant');
    expect(response.messages[response.messages.length - 1].content).toBe(DEFAULT_RESPONSE_CONTENT);
  });

  test('tool call', async () => {
    const expectedLocation = 'San Francisco';
    const getWeatherMock = jest.fn();

    function getWeather({ location }: { location: string }) {
      getWeatherMock({ location });
      return "It's sunny today.";
    }

    const agent = new Agent({ name: 'Test Agent', functions: [getWeather] });
    const messages = [
      { role: 'user' as const, content: "What's the weather like in San Francisco?" }
    ];

    mockOpenAIClient.setSequentialResponses([
      createMockResponse(
        { role: 'assistant', content: '' },
        [{ name: 'getWeather', args: { location: expectedLocation } }]
      ),
      createMockResponse(
        { role: 'assistant', content: DEFAULT_RESPONSE_CONTENT }
      ),
    ]);

    const client = new Swarm(mockOpenAIClient as any);
    const response = await client.run({ agent, messages });

    expect(getWeatherMock).toHaveBeenCalledWith({ location: expectedLocation });
    expect(response.messages[response.messages.length - 1].role).toBe('assistant');
    expect(response.messages[response.messages.length - 1].content).toBe(DEFAULT_RESPONSE_CONTENT);
  });

  test('execute tools false', async () => {
    const expectedLocation = 'San Francisco';
    const getWeatherMock = jest.fn();

    function getWeather({ location }: { location: string }) {
      getWeatherMock({ location });
      return "It's sunny today.";
    }

    const agent = new Agent({ name: 'Test Agent', functions: [getWeather] });
    const messages = [
      { role: 'user' as const, content: "What's the weather like in San Francisco?" }
    ];

    mockOpenAIClient.setSequentialResponses([
      createMockResponse(
        { role: 'assistant', content: '' },
        [{ name: 'getWeather', args: { location: expectedLocation } }]
      ),
      createMockResponse(
        { role: 'assistant', content: DEFAULT_RESPONSE_CONTENT }
      ),
    ]);

    const client = new Swarm(mockOpenAIClient as any);
    const response = await client.run({ agent, messages, execute_tools: false });

    expect(getWeatherMock).not.toHaveBeenCalled();

    const toolCalls = response.messages[response.messages.length - 1].tool_calls;
    expect(toolCalls).toBeTruthy();
    expect(toolCalls).toHaveLength(1);
    expect(toolCalls![0].function.name).toBe('getWeather');
    expect(JSON.parse(toolCalls![0].function.arguments)).toEqual({ location: expectedLocation });
  });

  test('handoff', async () => {
    const agent2 = new Agent({ name: 'Test Agent 2' });

    function transferToAgent2() {
      return agent2;
    }

    const agent1 = new Agent({ name: 'Test Agent 1', functions: [transferToAgent2] });

    mockOpenAIClient.setSequentialResponses([
      createMockResponse(
        { role: 'assistant', content: '' },
        [{ name: 'transferToAgent2', args: {} }]
      ),
      createMockResponse(
        { role: 'assistant', content: DEFAULT_RESPONSE_CONTENT }
      ),
    ]);

    const client = new Swarm(mockOpenAIClient as any);
    const messages = [{ role: 'user' as const, content: 'I want to talk to agent 2' }];
    const response = await client.run({ agent: agent1, messages });

    expect(response.agent).toBe(agent2);
    expect(response.messages[response.messages.length - 1].role).toBe('assistant');
    expect(response.messages[response.messages.length - 1].content).toBe(DEFAULT_RESPONSE_CONTENT);
  });

  test('agent initialization with defaults', () => {
    const agent = new Agent();
    expect(agent.name).toBe('Agent');
    expect(agent.model).toBe('gpt-4o');
    expect(agent.instructions).toBe('You are a helpful agent.');
    expect(agent.functions).toEqual([]);
    expect(agent.tool_choice).toBe(null);
    expect(agent.parallel_tool_calls).toBe(true);
  });

  test('agent initialization with custom values', () => {
    const customInstructions = 'You are a specialized agent.';
    const customFunctions = [jest.fn()];
    
    const agent = new Agent({
      name: 'Custom Agent',
      model: 'gpt-3.5-turbo',
      instructions: customInstructions,
      functions: customFunctions,
      tool_choice: 'auto',
      parallel_tool_calls: false,
    });

    expect(agent.name).toBe('Custom Agent');
    expect(agent.model).toBe('gpt-3.5-turbo');
    expect(agent.instructions).toBe(customInstructions);
    expect(agent.functions).toBe(customFunctions);
    expect(agent.tool_choice).toBe('auto');
    expect(agent.parallel_tool_calls).toBe(false);
  });

  test('result class functionality', () => {
    const result = new Result({
      value: 'test value',
      agent: new Agent({ name: 'Test Agent' }),
      context_variables: { key: 'value' },
    });

    expect(result.value).toBe('test value');
    expect(result.agent?.name).toBe('Test Agent');
    expect(result.context_variables).toEqual({ key: 'value' });
  });

  test('context variables in function', async () => {
    const contextVarsMock = jest.fn();

    function testFunction({ name, context_variables }: { name: string; context_variables?: any }) {
      contextVarsMock(context_variables);
      return `Hello ${name}`;
    }

    const agent = new Agent({ functions: [testFunction] });
    const messages = [{ role: 'user' as const, content: 'Test message' }];

    mockOpenAIClient.setSequentialResponses([
      createMockResponse(
        { role: 'assistant', content: '' },
        [{ name: 'testFunction', args: { name: 'John' } }]
      ),
      createMockResponse(
        { role: 'assistant', content: DEFAULT_RESPONSE_CONTENT }
      ),
    ]);

    const client = new Swarm(mockOpenAIClient as any);
    const response = await client.run({ 
      agent, 
      messages, 
      context_variables: { user_id: '123' } 
    });

    expect(contextVarsMock).toHaveBeenCalledWith({ user_id: '123' });
  });
});