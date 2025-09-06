#!/usr/bin/env node

// Test to verify streaming behavior with tool calls
import { Swarm, Agent } from './dist/index.js';

// API key should be set via environment variable: export OPENAI_API_KEY="your-api-key"
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set');
  console.error('Please export OPENAI_API_KEY="your-api-key" before running this test');
  process.exit(1);
}

// Simple test function
function getWeather({ location }) {
  return `Current weather in ${location}: 72°F, Sunny`;
}

async function testStreamingWithToolCalls() {
  console.log('Testing streaming with tool calls...\n');
  
  const weatherAgent = new Agent({
    name: 'WeatherBot',
    instructions: 'You are a weather assistant. Use the getWeather function to provide weather information.',
    functions: [getWeather],
    model: 'gpt-3.5-turbo'
  });

  const client = new Swarm();
  
  const stream = client.run({
    agent: weatherAgent,
    messages: [{ role: 'user', content: 'What is the weather in Paris?' }],
    stream: true
  });

  console.log('Streaming chunks:');
  console.log('-'.repeat(50));
  
  let chunkCount = 0;
  let foundToolCallResult = false;
  
  for await (const chunk of stream) {
    chunkCount++;
    console.log(`Chunk ${chunkCount}:`, JSON.stringify(chunk));
    
    // Check if tool call result appears in any chunk
    if (chunk.content && chunk.content.includes('Current weather in Paris')) {
      foundToolCallResult = true;
    }
    
    if (chunk.response) {
      console.log('\nFinal response messages:');
      chunk.response.messages.forEach((msg, idx) => {
        console.log(`  Message ${idx + 1}: ${msg.role} - ${msg.content || msg.name || 'tool call'}`);
      });
    }
  }
  
  console.log('\n' + '-'.repeat(50));
  console.log(`Total chunks: ${chunkCount}`);
  console.log(`Tool call result found in stream: ${foundToolCallResult}`);
  
  // Also test non-streaming for comparison
  console.log('\n\nTesting non-streaming with tool calls...');
  const nonStreamResponse = await client.run({
    agent: weatherAgent,
    messages: [{ role: 'user', content: 'What is the weather in London?' }],
    stream: false
  });
  
  console.log('Non-streaming response messages:');
  nonStreamResponse.messages.forEach((msg, idx) => {
    console.log(`  Message ${idx + 1}: ${msg.role} - ${msg.content || msg.name || 'tool call'}`);
  });
}

testStreamingWithToolCalls().catch(console.error);