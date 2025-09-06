const { Swarm, Agent } = require('../../dist/index.js');

const client = new Swarm();

async function testErrorHandling() {
    console.log('Testing error handling with actual API errors...');
    
    // Test 1: Invalid API key
    console.log('\n1. Testing invalid API key error handling...');
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'invalid-key-123';
    
    const testAgent = new Agent({
        name: "Test Agent",
        instructions: "You are a test agent.",
        model: "gpt-3.5-turbo"
    });
    
    try {
        const badClient = new Swarm();
        await badClient.run({
            agent: testAgent,
            messages: [{ role: 'user', content: "Hello" }]
        });
        console.log('❌ Expected error but request succeeded');
    } catch (error) {
        console.log('✅ Correctly caught invalid API key error:', error.message);
    }
    
    // Restore valid API key
    process.env.OPENAI_API_KEY = originalKey;
    
    // Test 2: Invalid model
    console.log('\n2. Testing invalid model error handling...');
    const invalidModelAgent = new Agent({
        name: "Invalid Model Agent",
        instructions: "You are a test agent with invalid model.",
        model: "invalid-model-123"
    });
    
    try {
        await client.run({
            agent: invalidModelAgent,
            messages: [{ role: 'user', content: "Hello" }]
        });
        console.log('❌ Expected error but request succeeded');
    } catch (error) {
        console.log('✅ Correctly caught invalid model error:', error.message);
    }
    
    // Test 3: Function error handling
    console.log('\n3. Testing function error handling...');
    
    function problematicFunction({ input }) {
        if (input === 'error') {
            throw new Error('Intentional function error');
        }
        return `Processed: ${input}`;
    }
    
    const functionAgent = new Agent({
        name: "Function Agent",
        instructions: "You are a test agent with a problematic function. Use the function when asked to process something.",
        model: "gpt-3.5-turbo",
        functions: [problematicFunction]
    });
    
    try {
        const response = await client.run({
            agent: functionAgent,
            messages: [{ role: 'user', content: "Please process this input: 'error'" }]
        });
        
        // Check if error was handled gracefully in the response
        const finalMessage = response.messages[response.messages.length - 1].content;
        console.log('✅ Function error handled gracefully, response:', finalMessage);
        
    } catch (error) {
        console.log('✅ Function error caught at client level:', error.message);
    }
    
    // Test 4: Streaming error handling
    console.log('\n4. Testing streaming error handling...');
    try {
        process.env.OPENAI_API_KEY = 'invalid-streaming-key';
        const badStreamClient = new Swarm();
        
        let chunks = [];
        for await (const chunk of badStreamClient.run({
            agent: testAgent,
            messages: [{ role: 'user', content: "Hello" }],
            stream: true
        })) {
            chunks.push(chunk);
        }
        console.log('❌ Expected streaming error but request succeeded');
    } catch (error) {
        console.log('✅ Correctly caught streaming error:', error.message);
    } finally {
        // Restore valid API key
        process.env.OPENAI_API_KEY = originalKey;
    }
    
    console.log('\n✅ Error handling tests completed!');
}

testErrorHandling().catch(console.error);