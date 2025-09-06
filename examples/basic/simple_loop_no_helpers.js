const { Swarm, Agent } = require('../../dist/index.js');
const readline = require('readline');

const client = new Swarm();

const myAgent = new Agent({
    name: 'Agent',
    instructions: 'You are a helpful agent.',
});

function prettyPrintMessages(messages) {
    for (const message of messages) {
        if (message.content === null || message.content === undefined) {
            continue;
        }
        console.log(`${message.sender || message.role}: ${message.content}`);
    }
}

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    let messages = [];
    let agent = myAgent;

    const askQuestion = () => {
        rl.question('> ', async (userInput) => {
            if (userInput.trim().toLowerCase() === 'quit' || userInput.trim().toLowerCase() === 'exit') {
                console.log('Goodbye!');
                rl.close();
                return;
            }

            try {
                messages.push({ role: 'user', content: userInput });

                const response = await client.run({ agent, messages });
                messages = response.messages;
                agent = response.agent;
                
                prettyPrintMessages(messages);
            } catch (error) {
                console.error('Error:', error.message);
            }

            // Continue the loop
            askQuestion();
        });
    };

    // Start the interactive loop
    console.log('Simple Loop Demo (type "quit" or "exit" to stop)');
    askQuestion();
}

// Handle process interruption gracefully
rl.on('SIGINT', () => {
    console.log('\nGoodbye!');
    process.exit(0);
});

main().catch(console.error);