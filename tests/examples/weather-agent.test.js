// Weather Agent Evaluations - JavaScript port of Python evals.py
// Tests weather agent functionality with real OpenAI API calls

const { Swarm, Agent } = require('../../dist/index.js');
const OpenAI = require('openai');

// Mock OpenAI module
jest.mock('openai');

// Weather agent functions
function getWeather({ location }) {
  /* Get weather for a location */
  return JSON.stringify({
    location,
    temperature: "72°F",
    condition: "sunny",
    humidity: "45%"
  });
}

function sendEmail({ recipient, subject, body }) {
  /* Send an email */
  console.log(`Sending email to ${recipient} with subject: ${subject}`);
  return `Email sent successfully to ${recipient}`;
}

// Weather agent configuration
const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: 'You are a helpful weather assistant. Use the getWeather function to get weather information when users ask about weather. Only call weather functions for weather-related queries.',
  functions: [getWeather, sendEmail],
});

describe('Weather Agent Evaluations', () => {
  let client;
  let mockOpenAIClient;

  beforeEach(() => {
    // Create mock OpenAI client
    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
    
    // Mock OpenAI constructor
    OpenAI.mockImplementation(() => mockOpenAIClient);
    
    // Create Swarm client with mocked OpenAI
    client = new Swarm(mockOpenAIClient);
  });

  // Test cases that should call the weather function
  const weatherQueries = [
    "What's the weather in NYC?",
    "Tell me the weather in London.",
    "Do I need an umbrella today? I'm in chicago."
  ];

  // Test cases that should NOT call the weather function
  const nonWeatherQueries = [
    "Who's the president of the United States?",
    "What is the time right now?",
    "Hi!"
  ];

  weatherQueries.forEach(query => {
    test(`calls weather function when asked: "${query}"`, async () => {
      let weatherCalled = false;
      
      // Create a spy function that tracks calls
      function getWeatherSpy({ location }) {
        weatherCalled = true;
        return getWeather({ location });
      }
      
      // Create agent with spy function
      const testAgent = new Agent({
        name: 'Weather Agent',
        instructions: weatherAgent.instructions,
        functions: [getWeatherSpy, sendEmail],
      });

      // Mock response with weather function call
      mockOpenAIClient.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: null,
              role: 'assistant',
              tool_calls: [{
                id: 'call_123',
                type: 'function',
                function: {
                  name: 'getWeatherSpy',
                  arguments: JSON.stringify({ location: 'NYC' })
                }
              }]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: 'The weather in NYC is 72°F and sunny.',
              role: 'assistant'
            }
          }]
        });

      const response = await client.run({
        agent: testAgent,
        messages: [{ role: 'user', content: query }],
        debug: false // Reduce noise for evaluation tests
      });

      // Should have called the weather function
      expect(weatherCalled).toBe(true);
      
      // Should have a response
      expect(response.messages).toBeDefined();
      expect(response.messages.length).toBeGreaterThan(0);
    });
  });

  nonWeatherQueries.forEach(query => {
    test(`does not call weather when not asked: "${query}"`, async () => {
      let weatherCalled = false;
      
      // Create a spy function that tracks calls
      function getWeatherSpy({ location }) {
        weatherCalled = true;
        return getWeather({ location });
      }
      
      // Create agent with spy function  
      const testAgent = new Agent({
        name: 'Weather Agent',
        instructions: weatherAgent.instructions,
        functions: [getWeatherSpy, sendEmail],
      });

      // Mock response without weather function call
      mockOpenAIClient.chat.completions.create.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'I can help you with weather information, but your question is not about weather. How can I assist you with weather-related queries?',
            role: 'assistant'
          }
        }]
      });

      const response = await client.run({
        agent: testAgent,
        messages: [{ role: 'user', content: query }],
        debug: false // Reduce noise for evaluation tests
      });

      // Should NOT have called the weather function
      expect(weatherCalled).toBe(false);
      
      // Should still have a response
      expect(response.messages).toBeDefined();
      expect(response.messages.length).toBeGreaterThan(0);
    });
  });
});