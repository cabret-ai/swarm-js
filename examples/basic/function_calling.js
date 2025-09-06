const { Swarm, Agent } = require('../../dist/index.js');

const client = new Swarm();

function getWeather({ location }) {
    return "{'temp':67, 'unit':'F'}";
}

const agent = new Agent({
    name: 'Agent',
    instructions: 'You are a helpful agent.',
    functions: [getWeather],
});

const messages = [{ role: 'user', content: "What's the weather in NYC?" }];

async function main() {
    const response = await client.run({ agent, messages });
    console.log(response.messages[response.messages.length - 1].content);
}

main().catch(console.error);