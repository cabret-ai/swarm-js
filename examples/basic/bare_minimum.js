const { Swarm, Agent } = require('../../dist/index.js');

const client = new Swarm();

const agent = new Agent({
    name: 'Agent',
    instructions: 'You are a helpful agent.',
});

const messages = [{ role: 'user', content: 'Hi!' }];

async function main() {
    const response = await client.run({ agent, messages });
    console.log(response.messages[response.messages.length - 1].content);
}

main().catch(console.error);