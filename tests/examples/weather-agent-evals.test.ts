// Weather Agent Evaluations - TypeScript port of Python evals.py
// Tests weather agent functionality matching Python implementation

import { Swarm, Agent, SwarmResponse } from '../../src';
import { MockOpenAIClient, createMockResponse } from '../mockClient';

// Mock weather agent functions (matching Python implementation)
function getWeather({ location, time = 'now' }: { location: string; time?: string }) {
  /* Get the current weather in a given location. Location MUST be a city. */
  return JSON.stringify({ location, temperature: '65', time });
}

function sendEmail({ recipient, subject, body }: { recipient: string; subject: string; body: string }) {
  console.log('Sending email...');
  console.log(`To: ${recipient}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  return 'Sent!';
}

const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: 'You are a helpful agent.',
  functions: [getWeather, sendEmail],
});

describe('Weather Agent Evaluations', () => {
  let client: Swarm;
  let mockOpenAIClient: MockOpenAIClient;

  // Helper function matching Python implementation
  async function runAndGetToolCalls(agent: Agent, query: string): Promise<any[] | null> {
    const message = { role: 'user' as const, content: query };
    const response = await client.run({
      agent,
      messages: [message],
      execute_tools: false,
    }) as SwarmResponse;
    return response.messages[response.messages.length - 1].tool_calls || null;
  }

  beforeEach(() => {
    mockOpenAIClient = new MockOpenAIClient();
    client = new Swarm(mockOpenAIClient as any);
  });

  describe('Weather queries that should call getWeather', () => {
    const weatherQueries = [
      "What's the weather in NYC?",
      "Tell me the weather in London.",
      "Do I need an umbrella today? I'm in chicago.",
    ];

    weatherQueries.forEach(query => {
      test(`calls weather when asked: "${query}"`, async () => {
        // Mock response with weather tool call
        mockOpenAIClient.setResponse(
          createMockResponse(
            { role: 'assistant', content: '' },
            [{ name: 'getWeather', args: { location: 'test_location' } }]
          )
        );

        const toolCalls = await runAndGetToolCalls(weatherAgent, query);

        expect(toolCalls).toHaveLength(1);
        expect(toolCalls![0].function.name).toBe('getWeather');
      });
    });
  });

  describe('Non-weather queries that should NOT call getWeather', () => {
    const nonWeatherQueries = [
      "Who's the president of the United States?",
      "What is the time right now?",
      "Hi!",
    ];

    nonWeatherQueries.forEach(query => {
      test(`does not call weather when not asked: "${query}"`, async () => {
        // Mock response with no tool calls
        mockOpenAIClient.setResponse(
          createMockResponse(
            { role: 'assistant', content: 'I can help with that, but I need weather-related queries to use my weather function.' }
          )
        );

        const toolCalls = await runAndGetToolCalls(weatherAgent, query);

        expect(toolCalls).toBeFalsy();
      });
    });
  });

  describe('Weather agent function execution', () => {
    test('getWeather function returns correct format', () => {
      const result = getWeather({ location: 'New York' });
      const parsed = JSON.parse(result);
      
      expect(parsed.location).toBe('New York');
      expect(parsed.temperature).toBe('65');
      expect(parsed.time).toBe('now');
    });

    test('getWeather function with custom time', () => {
      const result = getWeather({ location: 'London', time: '2pm' });
      const parsed = JSON.parse(result);
      
      expect(parsed.location).toBe('London');
      expect(parsed.temperature).toBe('65');
      expect(parsed.time).toBe('2pm');
    });

    test('sendEmail function executes correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const result = sendEmail({
        recipient: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body'
      });
      
      expect(result).toBe('Sent!');
      expect(consoleSpy).toHaveBeenCalledWith('Sending email...');
      expect(consoleSpy).toHaveBeenCalledWith('To: test@example.com');
      expect(consoleSpy).toHaveBeenCalledWith('Subject: Test Subject');
      expect(consoleSpy).toHaveBeenCalledWith('Body: Test Body');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Weather agent full interaction', () => {
    test('weather query executes function and returns response', async () => {
      const getWeatherSpy = jest.fn(getWeather);
      Object.defineProperty(getWeatherSpy, 'name', { value: 'getWeatherSpy', configurable: true });
      
      const testAgent = new Agent({
        name: 'Weather Agent',
        instructions: 'You are a helpful agent.',
        functions: [getWeatherSpy, sendEmail],
      });

      // Mock tool call response, then final response
      mockOpenAIClient.setSequentialResponses([
        createMockResponse(
          { role: 'assistant', content: '' },
          [{ name: 'getWeatherSpy', args: { location: 'San Francisco' } }]
        ),
        createMockResponse(
          { role: 'assistant', content: 'The weather in San Francisco is 65 degrees and sunny!' }
        ),
      ]);

      const response = await client.run({
        agent: testAgent,
        messages: [{ role: 'user', content: "What's the weather in San Francisco?" }],
      });

      expect(getWeatherSpy).toHaveBeenCalledWith({ location: 'San Francisco' });
      expect(response.messages).toHaveLength(3); // User message, tool call, tool response, assistant response
      expect(response.messages[response.messages.length - 1].content)
        .toContain('San Francisco');
    });

    test('non-weather query does not execute weather function', async () => {
      const getWeatherSpy = jest.fn(getWeather);
      const testAgent = new Agent({
        name: 'Weather Agent',
        instructions: 'You are a helpful agent.',
        functions: [getWeatherSpy, sendEmail],
      });

      mockOpenAIClient.setResponse(
        createMockResponse(
          { role: 'assistant', content: 'Hello! I am a helpful agent. How can I assist you today?' }
        )
      );

      const response = await client.run({
        agent: testAgent,
        messages: [{ role: 'user', content: 'Hello!' }],
      });

      expect(getWeatherSpy).not.toHaveBeenCalled();
      expect(response.messages).toHaveLength(1); // Only assistant response
      expect(response.messages[0].content).toContain('Hello');
    });
  });
});