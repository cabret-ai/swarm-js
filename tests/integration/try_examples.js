const { Swarm, Agent } = require('../../dist/index.js');

const client = new Swarm();

// Example 1: Creative writing agent
const writerAgent = new Agent({
    name: 'Creative Writer',
    instructions: 'You are a creative writer who writes in different styles. Be concise but creative.',
});

// Example 2: Code helper with functions
function explainCode(code) {
    const codeStr = typeof code === 'string' ? code : JSON.stringify(code);
    return `Code analysis: This appears to be ${codeStr.includes('function') ? 'JavaScript' : 'generic'} code. ${codeStr.length} characters long.`;
}

function suggestImprovement(code) {
    const codeStr = typeof code === 'string' ? code : JSON.stringify(code);
    return `Suggested improvements: Add comments, use meaningful variable names, consider error handling. (Analyzed ${codeStr.length} characters)`;
}

const codeAgent = new Agent({
    name: 'Code Assistant', 
    instructions: 'You help developers understand and improve code. Use the provided functions.',
    functions: [explainCode, suggestImprovement],
});

// Example 3: Multi-agent conversation system
const techAgent = new Agent({
    name: 'Tech Expert',
    instructions: 'You are a technical expert who gives precise, technical answers.',
});

function transferToTech() {
    return techAgent;
}

const routerAgent = new Agent({
    name: 'Router',
    instructions: 'Route technical questions to the tech expert using transferToTech. For other topics, answer directly.',
    functions: [transferToTech],
});

async function tryExample(exampleNum) {
    console.log(`\n🧪 Example ${exampleNum}:`);
    
    try {
        switch (exampleNum) {
            case 1:
                console.log('📝 Creative Writing Agent');
                const response1 = await client.run({
                    agent: writerAgent,
                    messages: [{ role: 'user', content: 'Write a haiku about artificial intelligence.' }]
                });
                console.log('✅', response1.messages[response1.messages.length - 1].content);
                break;

            case 2:
                console.log('💻 Code Helper Agent');
                const response2 = await client.run({
                    agent: codeAgent,
                    messages: [{ role: 'user', content: 'Analyze this code: function hello(name) { console.log("Hi " + name); }' }]
                });
                console.log('✅', response2.messages[response2.messages.length - 1].content);
                break;

            case 3:
                console.log('🔄 Multi-Agent Router');
                const response3 = await client.run({
                    agent: routerAgent,
                    messages: [{ role: 'user', content: 'Explain how neural networks work.' }]
                });
                console.log('✅ Final Agent:', response3.agent.name);
                console.log('✅', response3.messages[response3.messages.length - 1].content);
                break;

            case 4:
                console.log('🌟 Creative Conversation');
                const response4 = await client.run({
                    agent: writerAgent,
                    messages: [
                        { role: 'user', content: 'Tell me a short story about a robot learning to paint.' }
                    ]
                });
                console.log('✅', response4.messages[response4.messages.length - 1].content);
                break;

            default:
                console.log('❓ Unknown example number');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Main execution
async function main() {
    const exampleNum = process.argv[2] || '1';
    
    if (exampleNum === 'all') {
        console.log('🚀 Running all examples...');
        for (let i = 1; i <= 4; i++) {
            await tryExample(i);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
        }
    } else {
        await tryExample(parseInt(exampleNum));
    }
}

console.log('🤖 Swarm-JS Interactive Examples');
console.log('Usage: node try_examples.js [1-4 or "all"]');
console.log('1: Creative writing  2: Code analysis  3: Multi-agent  4: Story generation');

main().catch(console.error);