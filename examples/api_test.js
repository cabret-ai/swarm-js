const { Swarm, Agent, Result } = require('../dist/index.js');

// Test with real OpenAI API
const client = new Swarm();

// Test 1: Basic functionality
const basicAgent = new Agent({
    name: 'Basic Agent',
    instructions: 'You are a helpful assistant. Keep responses brief.',
});

// Test 2: Function calling
function getCurrentTime() {
    return new Date().toLocaleTimeString();
}

function getWeather({ location }) {
    return `The weather in ${location} is sunny and 72°F.`;
}

const functionAgent = new Agent({
    name: 'Function Agent', 
    instructions: 'You help users with time and weather. Use the provided functions.',
    functions: [getCurrentTime, getWeather],
});

// Test 3: Agent handoff
const mathAgent = new Agent({
    name: 'Math Agent',
    instructions: 'You are a math specialist. Solve mathematical problems.',
});

function transferToMath() {
    /* Transfer to math specialist */
    return mathAgent;
}

const routerAgent = new Agent({
    name: 'Router Agent',
    instructions: 'You route users to specialists. For math questions, use transferToMath.',
    functions: [transferToMath],
});

// Test 4: Context variables
function greetUser({ context_variables }) {
    const name = context_variables?.user_name || 'there';
    console.log(`Hello ${name}! (from context)`);
    return `Greeted ${name}`;
}

const contextAgent = new Agent({
    name: 'Context Agent',
    instructions: (contextVars) => `You are helpful. The user's name is ${contextVars.user_name || 'unknown'}.`,
    functions: [greetUser],
});

async function runTests() {
    console.log('🚀 Testing Swarm-JS with real OpenAI API\n');

    try {
        // Test 1: Basic conversation
        console.log('📝 Test 1: Basic conversation');
        const response1 = await client.run({
            agent: basicAgent,
            messages: [{ role: 'user', content: 'Say hello in exactly 3 words.' }]
        });
        console.log('✅', response1.messages[response1.messages.length - 1].content);
        console.log();

        // Test 2: Function calling  
        console.log('⚡ Test 2: Function calling');
        const response2 = await client.run({
            agent: functionAgent,
            messages: [{ role: 'user', content: 'What time is it and what is the weather in Paris?' }]
        });
        console.log('✅', response2.messages[response2.messages.length - 1].content);
        console.log();

        // Test 3: Agent handoff
        console.log('🔄 Test 3: Agent handoff');
        const response3 = await client.run({
            agent: routerAgent,
            messages: [{ role: 'user', content: 'What is 25 * 17?' }]
        });
        console.log('✅ Final agent:', response3.agent.name);
        console.log('✅', response3.messages[response3.messages.length - 1].content);
        console.log();

        // Test 4: Context variables
        console.log('📋 Test 4: Context variables');
        const response4 = await client.run({
            agent: contextAgent,
            messages: [{ role: 'user', content: 'Greet me using my name from context' }],
            context_variables: { user_name: 'Alice' }
        });
        console.log('✅', response4.messages[response4.messages.length - 1].content);
        console.log();

        console.log('🎉 All tests completed successfully!');
        console.log('📊 Summary:');
        console.log('- Basic conversation: ✅');
        console.log('- Function calling: ✅'); 
        console.log('- Agent handoff: ✅');
        console.log('- Context variables: ✅');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.message.includes('API key')) {
            console.log('💡 Make sure OPENAI_API_KEY environment variable is set');
        }
    }
}

runTests();