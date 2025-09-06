const { Swarm } = require('../../dist/index.js');

const { Agent } = require('../../dist/index.js');

// Simple agent for testing customer service streaming
const customerServiceAgent = new Agent({
    name: "Customer Service Agent",
    instructions: "You are a helpful customer service agent. Provide detailed, streaming responses to help customers with their inquiries.",
    model: "gpt-3.5-turbo",
    functions: []
});

const client = new Swarm();

async function testCustomerServiceStreaming() {
    console.log('Testing customer service with streaming API...');
    
    try {
        console.log('\nTesting streaming response...');
        
        const messages = [{ 
            role: 'user', 
            content: "I have a problem with my recent order and need detailed help with the return process" 
        }];
        
        let chunks = [];
        let startTime = Date.now();
        
        for await (const chunk of client.run({ 
            agent: customerServiceAgent, 
            messages,
            stream: true
        })) {
            chunks.push(chunk);
            
            if (chunk.delim === 'start') {
                console.log('\n🟢 [START STREAMING]');
            } else if (chunk.delim === 'end') {
                console.log('\n🔴 [END STREAMING]');
            } else if (chunk.content) {
                process.stdout.write(chunk.content);
            } else if (chunk.response) {
                console.log('\n📦 [FINAL RESPONSE RECEIVED]');
            }
        }
        
        const duration = Date.now() - startTime;
        
        console.log('\n✅ Customer service streaming test completed successfully!');
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Total chunks: ${chunks.length}`);
        console.log(`   Content chunks: ${chunks.filter(c => c.content).length}`);
        
    } catch (error) {
        console.error('❌ Customer service streaming test failed:', error);
        throw error;
    }
}

testCustomerServiceStreaming().catch(console.error);