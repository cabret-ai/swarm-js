// Streaming tests for Swarm JavaScript implementation
// Based on Python streaming functionality

import { Swarm, Agent, Result } from '../src';
import { MockOpenAIClient, createMockResponse, createMockStreamResponse } from './mockClient';

const DEFAULT_RESPONSE_CONTENT = 'sample response content';

describe('Swarm Streaming', () => {
  let mockOpenAIClient: MockOpenAIClient;

  beforeEach(() => {
    mockOpenAIClient = new MockOpenAIClient();
  });

  test('basic streaming response', async () => {
    const agent = new Agent();
    const client = new Swarm(mockOpenAIClient as any);
    const messages = [{ role: 'user' as const, content: 'Hello, how are you?' }];

    // Mock streaming response
    mockOpenAIClient.setStreamResponse([
      { choices: [{ delta: { role: 'assistant', content: 'Hello' } }] },
      { choices: [{ delta: { content: ' there!' } }] },
      { choices: [{ delta: {} }] }, // End of stream
    ]);
    
    const responseGenerator = client.run({ 
      agent, 
      messages, 
      stream: true 
    }) as AsyncGenerator<any, void, unknown>;

    const chunks = [];
    for await (const chunk of responseGenerator) {
      chunks.push(chunk);
    }

    // Should have start delimiter, content chunks, end delimiter, and final response
    expect(chunks.some(chunk => chunk.delim === 'start')).toBe(true);
    expect(chunks.some(chunk => chunk.delim === 'end')).toBe(true);
    expect(chunks.some(chunk => chunk.response)).toBe(true);
    
    // Final response should be complete
    const finalResponse = chunks.find(chunk => chunk.response)?.response;
    expect(finalResponse).toBeDefined();
    expect(finalResponse.messages).toBeDefined();
    expect(finalResponse.agent).toBeDefined();
    expect(finalResponse.context_variables).toBeDefined();
  });

  test('streaming with tool calls', async () => {
    const testFunction = jest.fn(({ location }: { location: string }) => {
      return `Weather in ${location} is sunny`;
    });
    Object.defineProperty(testFunction, 'name', { value: 'testFunction', configurable: true });

    const agent = new Agent({ 
      name: 'Test Agent', 
      functions: [testFunction] 
    });
    
    const client = new Swarm(mockOpenAIClient as any);
    const messages = [{ role: 'user' as const, content: 'What\'s the weather in NYC?' }];

    // Mock sequential stream responses - first with tool call, then with content
    mockOpenAIClient.setSequentialStreamResponses([
      [
        { choices: [{ delta: { role: 'assistant', content: '' } }] },
        { choices: [{ delta: { tool_calls: [{ 
          index: 0, 
          id: 'call_123', 
          type: 'function',
          function: { name: 'testFunction', arguments: '{"location":"NYC"}' }
        }] } }] },
        { choices: [{ delta: {} }] },
      ],
      [
        { choices: [{ delta: { role: 'assistant', content: 'The weather' } }] },
        { choices: [{ delta: { content: ' looks great!' } }] },
        { choices: [{ delta: {} }] },
      ]
    ]);

    const responseGenerator = client.run({ 
      agent, 
      messages, 
      stream: true 
    }) as AsyncGenerator<any, void, unknown>;

    const chunks = [];
    for await (const chunk of responseGenerator) {
      chunks.push(chunk);
    }

    expect(testFunction).toHaveBeenCalledWith({ location: 'NYC' });
    
    const finalResponse = chunks.find(chunk => chunk.response)?.response;
    expect(finalResponse.messages.length).toBeGreaterThan(0);
  });

  test('streaming with agent handoff', async () => {
    const agent2 = new Agent({ name: 'Agent 2' });
    
    const transferFunction = jest.fn(() => {
      return agent2;
    });
    Object.defineProperty(transferFunction, 'name', { value: 'transferFunction', configurable: true });

    const agent1 = new Agent({ 
      name: 'Agent 1', 
      functions: [transferFunction] 
    });
    
    const client = new Swarm(mockOpenAIClient as any);
    const messages = [{ role: 'user' as const, content: 'Transfer me to agent 2' }];

    // Mock streaming response with handoff
    mockOpenAIClient.setSequentialStreamResponses([
      [
        { choices: [{ delta: { role: 'assistant', content: '' } }] },
        { choices: [{ delta: { tool_calls: [{ 
          index: 0, 
          id: 'call_456', 
          type: 'function',
          function: { name: 'transferFunction', arguments: '{}' }
        }] } }] },
        { choices: [{ delta: {} }] },
      ],
      [
        { choices: [{ delta: { role: 'assistant', content: 'Transferred' } }] },
        { choices: [{ delta: { content: ' successfully!' } }] },
        { choices: [{ delta: {} }] },
      ]
    ]);

    const responseGenerator = client.run({ 
      agent: agent1, 
      messages, 
      stream: true 
    }) as AsyncGenerator<any, void, unknown>;

    const chunks = [];
    for await (const chunk of responseGenerator) {
      chunks.push(chunk);
    }

    expect(transferFunction).toHaveBeenCalled();
    
    const finalResponse = chunks.find(chunk => chunk.response)?.response;
    expect(finalResponse.agent).toBe(agent2);
  });

  test('streaming with execute_tools false', async () => {
    const testFunction = jest.fn(({ location }: { location: string }) => {
      return `Weather in ${location} is sunny`;
    });
    Object.defineProperty(testFunction, 'name', { value: 'testFunction', configurable: true });

    const agent = new Agent({ 
      name: 'Test Agent', 
      functions: [testFunction] 
    });
    
    const client = new Swarm(mockOpenAIClient as any);
    const messages = [{ role: 'user' as const, content: 'What\'s the weather?' }];

    // Mock streaming response with tool call
    mockOpenAIClient.setStreamResponse([
      { choices: [{ delta: { role: 'assistant', content: '' } }] },
      { choices: [{ delta: { tool_calls: [{ 
        index: 0, 
        id: 'call_789', 
        type: 'function',
        function: { name: 'testFunction', arguments: '{"location":"SF"}' }
      }] } }] },
      { choices: [{ delta: {} }] },
    ]);

    const responseGenerator = client.run({ 
      agent, 
      messages, 
      stream: true,
      execute_tools: false
    }) as AsyncGenerator<any, void, unknown>;

    const chunks = [];
    for await (const chunk of responseGenerator) {
      chunks.push(chunk);
    }

    // Function should not be called
    expect(testFunction).not.toHaveBeenCalled();
    
    // But tool calls should be present in the response
    const finalResponse = chunks.find(chunk => chunk.response)?.response;
    const lastMessage = finalResponse.messages[finalResponse.messages.length - 1];
    expect(lastMessage.tool_calls).toBeTruthy();
    // The function name will be concatenated due to streaming: 'test' + 'Function' = 'testFunction'
    expect(lastMessage.tool_calls[0].function.name).toBe('testFunction');
  });

  test('streaming chunk format matches Python implementation', async () => {
    const agent = new Agent({ name: 'Test Agent' });
    const client = new Swarm(mockOpenAIClient as any);
    const messages = [{ role: 'user' as const, content: 'Hello' }];

    mockOpenAIClient.setStreamResponse([
      { choices: [{ delta: { role: 'assistant', content: 'Hello' } }] },
      { choices: [{ delta: { content: ' world!' } }] },
      { choices: [{ delta: {} }] },
    ]);

    const responseGenerator = client.run({ 
      agent, 
      messages, 
      stream: true 
    }) as AsyncGenerator<any, void, unknown>;

    const chunks = [];
    for await (const chunk of responseGenerator) {
      chunks.push(chunk);
    }

    // Check that delimiters are present
    expect(chunks[0]).toEqual({ delim: 'start' });
    
    // Check that content chunks have expected format
    const contentChunks = chunks.filter(chunk => 
      chunk.content !== undefined && !chunk.delim && !chunk.response
    );
    
    expect(contentChunks.length).toBeGreaterThan(0);
    for (const chunk of contentChunks) {
      expect(chunk.sender).toBe('Test Agent');
    }

    // Check final response structure
    const finalChunk = chunks[chunks.length - 1];
    expect(finalChunk.response).toBeDefined();
    expect(finalChunk.response.messages).toBeInstanceOf(Array);
    expect(finalChunk.response.agent).toBeDefined();
    expect(finalChunk.response.context_variables).toBeDefined();
  });
});