const { Swarm, Agent } = require('../../dist/index.js');

const client = new Swarm();

function instructions(contextVariables) {
    const name = contextVariables.name || 'User';
    return `You are a helpful agent. Greet the user by name (${name}).`;
}

function printAccountDetails({ context_variables }) {
    const userId = context_variables.user_id || null;
    const name = context_variables.name || null;
    console.log(`Account Details: ${name} ${userId}`);
    return 'Success';
}

const agent = new Agent({
    name: 'Agent',
    instructions: instructions,
    functions: [printAccountDetails],
});

const contextVariables = { name: 'James', user_id: 123 };

async function main() {
    let response = await client.run({
        messages: [{ role: 'user', content: 'Hi!' }],
        agent,
        context_variables: contextVariables,
    });
    console.log(response.messages[response.messages.length - 1].content);

    response = await client.run({
        messages: [{ role: 'user', content: 'Print my account details!' }],
        agent,
        context_variables: contextVariables,
    });
    console.log(response.messages[response.messages.length - 1].content);
}

main().catch(console.error);