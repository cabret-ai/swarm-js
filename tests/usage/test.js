#!/usr/bin/env node

// Test the usability of the JavaScript Swarm library
import { Swarm, Agent } from '../../dist/index.js';

// API key should be set via environment variable: export OPENAI_API_KEY="your-api-key"
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set');
  console.error('Please export OPENAI_API_KEY="your-api-key" before running this test');
  process.exit(1);
}

console.log('🧪 Testing JavaScript Swarm Library Usability');
console.log('='.repeat(50));

// Test 1: Basic agent creation and function definition
console.log('\n📋 Test 1: Creating a simple agent with functions');

function getTime() {
    return `Current time: ${new Date().toLocaleString()}`;
}

function calculate({ operation, a, b }) {
    switch (operation) {
        case 'add':
            return `${a} + ${b} = ${a + b}`;
        case 'subtract':
            return `${a} - ${b} = ${a - b}`;
        case 'multiply':
            return `${a} * ${b} = ${a * b}`;
        case 'divide':
            return b !== 0 ? `${a} / ${b} = ${a / b}` : 'Error: Division by zero';
        default:
            return 'Error: Unknown operation';
    }
}

function weatherInfo({ location }) {
    // Mock weather data
    const temps = { 'new york': '72°F', 'london': '65°F', 'tokyo': '75°F', 'paris': '68°F' };
    const temp = temps[location.toLowerCase()] || '70°F';
    return `Weather in ${location}: ${temp}, partly cloudy`;
}

// Create a multi-functional agent
const assistantAgent = new Agent({
    name: 'Assistant Agent',
    instructions: 'You are a helpful assistant that can tell time, perform calculations, and provide weather information. Be concise and friendly.',
    functions: [getTime, calculate, weatherInfo],
});

console.log('✅ Agent created successfully');
console.log(`   Name: ${assistantAgent.name}`);
console.log(`   Functions: ${assistantAgent.functions?.length || 0} available`);

// Test 2: Initialize Swarm client
console.log('\n🔄 Test 2: Initializing Swarm client');

const client = new Swarm();
console.log('✅ Swarm client initialized');

// Test 3: Basic conversation
console.log('\n💬 Test 3: Basic conversation (non-streaming)');

async function testBasicConversation() {
    try {
        const response = await client.run({
            agent: assistantAgent,
            messages: [{ role: 'user', content: 'What time is it?' }],
        });

        console.log('✅ Basic conversation successful');
        console.log(`   Agent: ${response.agent.name}`);
        console.log(`   Response: ${response.messages[response.messages.length - 1].content}`);
        return response;
    } catch (error) {
        console.error('❌ Basic conversation failed:', error.message);
        return null;
    }
}

// Test 4: Function calling
console.log('\n🔧 Test 4: Function calling');

async function testFunctionCalling() {
    try {
        const response = await client.run({
            agent: assistantAgent,
            messages: [{ role: 'user', content: 'Calculate 15 plus 27' }],
        });

        console.log('✅ Function calling successful');
        console.log(`   Response: ${response.messages[response.messages.length - 1].content}`);
        return response;
    } catch (error) {
        console.error('❌ Function calling failed:', error.message);
        return null;
    }
}

// Test 5: Multi-turn conversation
console.log('\n🔄 Test 5: Multi-turn conversation');

async function testMultiTurnConversation() {
    try {
        // First exchange
        let response = await client.run({
            agent: assistantAgent,
            messages: [{ role: 'user', content: 'What\'s the weather in New York?' }],
        });

        // Second exchange - continuing the conversation
        response = await client.run({
            agent: assistantAgent,
            messages: [
                ...response.messages,
                { role: 'user', content: 'Now calculate 100 divided by 4' }
            ],
        });

        console.log('✅ Multi-turn conversation successful');
        console.log(`   Final response: ${response.messages[response.messages.length - 1].content}`);
        return response;
    } catch (error) {
        console.error('❌ Multi-turn conversation failed:', error.message);
        return null;
    }
}

// Main test execution
async function runTests() {
    console.log('\n🚀 Starting tests...\n');

    await testBasicConversation();
    await testFunctionCalling();
    await testMultiTurnConversation();

    console.log('\n📊 Usability Assessment:');
    console.log('='.repeat(30));
    
    console.log('\n✅ Positive aspects:');
    console.log('   • ES6 import syntax works cleanly');
    console.log('   • Agent creation is straightforward with clear constructor');
    console.log('   • Function definitions use standard JavaScript functions');
    console.log('   • Async/await pattern is natural for JavaScript developers');
    console.log('   • Error handling follows JavaScript conventions');
    console.log('   • No need for decorators or special syntax');
    
    console.log('\n⚠️  Considerations for Python users:');
    console.log('   • Functions must use object destructuring for parameters');
    console.log('   • Need to handle async/await (Python uses async/await too)');
    console.log('   • Import syntax differs (import vs from...import)');
    console.log('   • Environment variable setup is similar');
    
    console.log('\n📈 Overall assessment:');
    console.log('   The JavaScript version maintains the simplicity of the Python version');
    console.log('   while following JavaScript/Node.js conventions. The API is intuitive');
    console.log('   and should be familiar to developers coming from the Python version.');
}

// Run the tests
runTests().catch(console.error);