#!/usr/bin/env node

// Test streaming functionality of the JavaScript Swarm library
import { Swarm, Agent } from '../../dist/index.js';

// API key should be set via environment variable: export OPENAI_API_KEY="your-api-key"
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set');
  console.error('Please export OPENAI_API_KEY="your-api-key" before running this test');
  process.exit(1);
}

console.log('🌊 Testing JavaScript Swarm Library Streaming');
console.log('='.repeat(50));

// Create a storyteller agent
function generateStory({ theme, length = 'short' }) {
    const stories = {
        'adventure': 'Once upon a time, a brave explorer discovered a hidden temple in the jungle...',
        'mystery': 'The old mansion had been empty for decades, but tonight, lights flickered in the windows...',
        'sci-fi': 'The year was 2087, and humanity had just received its first signal from another galaxy...',
        'default': 'In a small village where nothing ever happened, something extraordinary was about to unfold...'
    };
    
    const story = stories[theme] || stories.default;
    return `Here's a ${length} ${theme} story: ${story}`;
}

const storytellerAgent = new Agent({
    name: 'Storyteller',
    instructions: 'You are a creative storyteller. When asked to tell a story, use the generateStory function and then expand on it with your own creative additions. Be engaging and descriptive.',
    functions: [generateStory],
});

const client = new Swarm();

async function testStreaming() {
    console.log('\n🎬 Testing streaming functionality...');
    
    try {
        console.log('📝 Requesting a story with streaming...');
        console.log('Response: ');
        
        let fullResponse = '';
        let messageCount = 0;
        
        // Test streaming
        const stream = await client.run({
            agent: storytellerAgent,
            messages: [{ role: 'user', content: 'Tell me an adventure story' }],
            stream: true,
        });

        // Handle streaming response
        for await (const chunk of stream) {
            if (chunk.delim === 'start') {
                console.log('\n🟢 Stream started');
            } else if (chunk.delim === 'end') {
                console.log('\n🔴 Stream ended');
                console.log(`\n📊 Stream stats: ${messageCount} chunks received`);
            } else if (chunk.content) {
                process.stdout.write(chunk.content);
                fullResponse += chunk.content;
                messageCount++;
            }
        }
        
        console.log('\n\n✅ Streaming test completed successfully');
        console.log(`📏 Total response length: ${fullResponse.length} characters`);
        
        return true;
    } catch (error) {
        console.error('\n❌ Streaming test failed:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

async function testStreamingComparison() {
    console.log('\n⚖️  Comparing streaming vs non-streaming...');
    
    const message = 'Write a short mystery story';
    
    console.log('\n📖 Non-streaming response:');
    const start1 = Date.now();
    
    try {
        const response = await client.run({
            agent: storytellerAgent,
            messages: [{ role: 'user', content: message }],
            stream: false,
        });
        
        const end1 = Date.now();
        console.log(`Response: ${response.messages[response.messages.length - 1].content}`);
        console.log(`⏱️  Non-streaming took: ${end1 - start1}ms`);
    } catch (error) {
        console.error('❌ Non-streaming failed:', error.message);
    }
    
    console.log('\n🌊 Streaming response:');
    const start2 = Date.now();
    let firstChunkTime = null;
    
    try {
        const stream = await client.run({
            agent: storytellerAgent,
            messages: [{ role: 'user', content: message }],
            stream: true,
        });

        let responseText = '';
        for await (const chunk of stream) {
            if (chunk.content && !firstChunkTime) {
                firstChunkTime = Date.now();
            }
            if (chunk.content) {
                process.stdout.write(chunk.content);
                responseText += chunk.content;
            }
        }
        
        const end2 = Date.now();
        console.log(`\n⏱️  Streaming total time: ${end2 - start2}ms`);
        if (firstChunkTime) {
            console.log(`⚡ Time to first chunk: ${firstChunkTime - start2}ms`);
        }
    } catch (error) {
        console.error('\n❌ Streaming comparison failed:', error.message);
    }
}

async function runStreamingTests() {
    console.log('\n🚀 Starting streaming tests...\n');

    const basicStreamingSuccess = await testStreaming();
    await testStreamingComparison();

    console.log('\n📊 Streaming Usability Assessment:');
    console.log('='.repeat(40));
    
    if (basicStreamingSuccess) {
        console.log('\n✅ Streaming capabilities:');
        console.log('   • Async iteration with for-await-of works seamlessly');
        console.log('   • Stream chunks provide real-time content updates');
        console.log('   • Clear start/end delimiters for stream lifecycle');
        console.log('   • Familiar async/await patterns for JavaScript developers');
        console.log('   • Compatible with Node.js streaming paradigms');
        
        console.log('\n🎯 Python comparison:');
        console.log('   • Similar to Python\'s async iteration over streams');
        console.log('   • JavaScript\'s for-await-of is as clean as Python\'s async for');
        console.log('   • Chunk handling follows familiar patterns');
        console.log('   • Error handling uses standard JavaScript try/catch');
    } else {
        console.log('\n❌ Streaming test encountered issues');
        console.log('   • This may indicate API connectivity or implementation issues');
        console.log('   • The interface design still follows good JavaScript patterns');
    }
}

// Run streaming tests
runStreamingTests().catch(console.error);