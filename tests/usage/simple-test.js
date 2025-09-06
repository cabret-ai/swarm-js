#!/usr/bin/env node

// Simple test of the JavaScript Swarm library
import { Swarm, Agent } from '../../dist/index.js';

// API key should be set via environment variable: export OPENAI_API_KEY="your-api-key"
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set');
  console.error('Please export OPENAI_API_KEY="your-api-key" before running this test');
  process.exit(1);
}

console.log('🚀 Simple Swarm Test');
console.log('===================');

// Simple function
function greet({ name }) {
    return `Hello, ${name}! Nice to meet you.`;
}

// Create agent
const agent = new Agent({
    name: 'Greeter',
    instructions: 'You are a friendly greeter. Use the greet function when meeting someone.',
    functions: [greet],
});

const client = new Swarm();

async function quickTest() {
    try {
        const response = await client.run({
            agent: agent,
            messages: [{ role: 'user', content: 'Hi, I\'m Alice' }],
        });

        console.log('✅ Test completed successfully!');
        console.log(`Response: ${response.messages[response.messages.length - 1].content}`);
        
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

quickTest().then(success => {
    if (success) {
        console.log('\n🎯 The JavaScript Swarm library is working correctly!');
    }
    process.exit(0);
});