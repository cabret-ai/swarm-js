const { Swarm } = require('../../dist/index.js');
const { triageAgent } = require('./configs/agents.js');
const readline = require('readline');

// Create Swarm client
const client = new Swarm();

// Create readline interface for interactive input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'User: '
});

// Context variables for the airline customer service
const contextVariables = {
    customer_context: `Here is what you know about the customer's details:
1. CUSTOMER_ID: customer_12345
2. NAME: John Doe
3. PHONE_NUMBER: (123) 456-7890
4. EMAIL: johndoe@example.com
5. STATUS: Premium
6. ACCOUNT_STATUS: Active
7. BALANCE: $0.00
8. LOCATION: 1234 Main St, San Francisco, CA 94123, USA`,
    flight_context: `The customer has an upcoming flight from LGA (Laguardia) in NYC to LAX in Los Angeles.
The flight # is 1919. The flight departure date is 3pm ET, 5/21/2024.`
};

console.log('✈️ Fly Airlines Customer Service Demo');
console.log('Welcome! I can help you with flight changes, cancellations, and lost baggage. Type "quit" to exit.\n');
console.log('📋 Customer Context: John Doe (Premium), Flight 1919 LGA→LAX on 5/21/2024 3pm ET\n');

// Store conversation history
let messages = [];
let currentAgent = triageAgent;

async function runDemo() {
    rl.prompt();

    rl.on('line', async (input) => {
        const userInput = input.trim();

        if (userInput.toLowerCase() === 'quit') {
            console.log('👋 Thank you for choosing Fly Airlines! Have a great day!');
            rl.close();
            return;
        }

        if (userInput === '') {
            rl.prompt();
            return;
        }

        try {
            messages.push({ role: 'user', content: userInput });

            console.log(`\n🤖 ${currentAgent.name} is processing your request...\n`);
            const response = await client.run({
                agent: currentAgent,
                messages: messages,
                contextVariables: contextVariables,
                stream: false,
                debug: true
            });

            // Update messages with the full conversation
            messages = response.messages;

            if (response.agent && response.agent !== currentAgent) {
                currentAgent = response.agent;
                console.log(`🔄 Transferred to ${currentAgent.name}\n`);
            }

            // Display the assistant's response
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.content) {
                console.log(`${currentAgent.name}: ${lastMessage.content}\n`);
            }

        } catch (error) {
            console.error('❌ Error:', error.message);
            if (error.message.includes('API key')) {
                console.log('💡 Make sure OPENAI_API_KEY environment variable is set');
            }
        }

        rl.prompt();
    });
}

// Handle process interruption gracefully
rl.on('SIGINT', () => {
    console.log('\n👋 Thank you for choosing Fly Airlines!');
    process.exit(0);
});

// Start the demo
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = {
    triageAgent,
    contextVariables
};