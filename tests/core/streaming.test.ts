import { Swarm } from '../../src/swarm';
import { Agent, StreamChunk } from '../../src/types';

// Mock OpenAI client
jest.mock('openai');

describe('Streaming Functionality', () => {
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

  test('runAndStream generates expected chunk sequence', async () => {
    const agent = new Agent({
      name: 'TestAgent',
      instructions: 'You are a helpful assistant.',
      functions: [],
      model: 'gpt-4o'
    });

    // Mock streaming response
    const mockStream = {
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { role: 'assistant', content: 'Hello' } }] };
        yield { choices: [{ delta: { content: ' there!' } }] };
        yield { choices: [{ delta: {} }] };
      }
    };

    mockClient.chat.completions.create.mockReturnValueOnce(mockStream);

    const chunks: StreamChunk[] = [];
    for await (const chunk of swarm.runAndStream({
      agent,
      messages: [{ role: 'user', content: 'Hi' }]
    })) {
      chunks.push(chunk);
    }

    // Should have: start delimiter, content chunks, end delimiter, final response
    // There are 2 content chunks: "Hello" and " there!", so expect 5 total
    expect(chunks).toHaveLength(5);
    expect(chunks[0]).toEqual({ delim: 'start' });
    expect(chunks[1]).toMatchObject({ role: 'assistant', content: 'Hello', sender: 'TestAgent' });
    expect(chunks[2]).toMatchObject({ content: ' there!' });
    expect(chunks[3]).toEqual({ delim: 'end' });
    expect(chunks[4].response).toBeDefined();
  });

  test('runAndStream handles function calls correctly', async () => {
    const testFunction = jest.fn(() => 'Function result');
    Object.defineProperty(testFunction, 'name', { value: 'testFunction', configurable: true });
    
    const agent = new Agent({
      name: 'FunctionAgent',
      instructions: 'Agent with functions',
      functions: [testFunction],
      model: 'gpt-4'
    });

    // Mock streaming response with tool call
    const mockStream = {
      async *[Symbol.asyncIterator]() {
        yield { 
          choices: [{ 
            delta: { 
              role: 'assistant',
              tool_calls: [{
                index: 0,
                id: 'call_123',
                function: {
                  name: 'testFunction',
                  arguments: '{}'
                }
              }]
            } 
          }] 
        };
        yield { choices: [{ delta: {} }] };
      }
    };

    // Mock both streaming responses
    const mockStream2 = {
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { role: 'assistant', content: 'Tool executed' } }] };
        yield { choices: [{ delta: {} }] };
      }
    };
    
    mockClient.chat.completions.create
      .mockReturnValueOnce(mockStream)
      .mockReturnValueOnce(mockStream2);

    const chunks: StreamChunk[] = [];
    for await (const chunk of swarm.runAndStream({
      agent,
      messages: [{ role: 'user', content: 'Run function' }]
    })) {
      chunks.push(chunk);
    }

    expect(testFunction).toHaveBeenCalled();
    const responseChunk = chunks.find(chunk => chunk.response);
    expect(responseChunk).toBeDefined();
    // Should have 3 messages: assistant with tool call, tool response, final assistant message
    expect(responseChunk?.response?.messages).toHaveLength(3);
  });

  test('stream parameter in run() method uses streaming', async () => {
    const agent = new Agent({
      name: 'StreamAgent',
      instructions: 'Streaming test',
      functions: [],
      model: 'gpt-4'
    });

    // Mock streaming response
    const mockStream = {
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { role: 'assistant', content: 'Streamed response' } }] };
        yield { choices: [{ delta: {} }] };
      }
    };

    mockClient.chat.completions.create.mockReturnValueOnce(mockStream);

    // When stream=true, run returns an AsyncGenerator, not a SwarmResponse
    const streamGenerator = swarm.run({
      agent,
      messages: [{ role: 'user', content: 'Stream this' }],
      stream: true
    });

    // Collect all chunks
    const chunks: any[] = [];
    for await (const chunk of streamGenerator) {
      chunks.push(chunk);
    }

    // Find the final response chunk
    const responseChunk = chunks.find(chunk => chunk.response);
    expect(responseChunk).toBeDefined();
    expect(responseChunk.response.messages).toHaveLength(1);
    expect(responseChunk.response.messages[0].content).toBe('Streamed response');
    expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ stream: true })
    );
  });

  test('non-streaming mode still works correctly', async () => {
    const agent = new Agent({
      name: 'NonStreamAgent',
      instructions: 'Non-streaming test',
      functions: [],
      model: 'gpt-4'
    });

    mockClient.chat.completions.create.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'Non-streamed response',
          role: 'assistant'
        }
      }]
    });

    const response = await swarm.run({
      agent,
      messages: [{ role: 'user', content: 'Dont stream' }],
      stream: false
    });

    expect(response.messages[0].content).toBe('Non-streamed response');
    expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ stream: false })
    );
  });
});