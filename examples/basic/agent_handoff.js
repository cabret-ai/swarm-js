const { Swarm, Agent } = require('../../dist/index.js');

const client = new Swarm();

const englishAgent = new Agent({
    name: 'English Agent',
    instructions: 'You only speak English.',
});

const spanishAgent = new Agent({
    name: 'Spanish Agent', 
    instructions: 'You only speak Spanish.',
});

function transferToSpanishAgent() {
    /* Transfer spanish speaking users immediately. */
    return spanishAgent;
}

englishAgent.functions.push(transferToSpanishAgent);

const messages = [{ role: 'user', content: 'Hola. ¿Como estás?' }];

async function main() {
    const response = await client.run({ agent: englishAgent, messages });
    console.log(response.messages[response.messages.length - 1].content);
}

main().catch(console.error);