const { Swarm } = require('../../dist/index.js');
const { triageAgent, salesAgent, refundsAgent } = require('../../examples/triage_agent/agents.js');
const { evaluateWithLLMBool } = require('../../examples/triage_agent/evalsUtil.js');

// Create Swarm client
const client = new Swarm();

const CONVERSATIONAL_EVAL_SYSTEM_PROMPT = `
You will be provided with a conversation between a user and an agent, as well as a main goal for the conversation.
Your goal is to evaluate, based on the conversation, if the agent achieves the main goal or not.

To assess whether the agent manages to achieve the main goal, consider the instructions present in the main goal, as well as the way the user responds:
is the answer satisfactory for the user or not, could the agent have done better considering the main goal?
It is possible that the user is not satisfied with the answer, but the agent still achieves the main goal because it is following the instructions provided as part of the main goal.
`;

/**
 * Evaluate if a conversation was successful
 * @param {Array} messages - The conversation messages
 * @returns {Promise<boolean>} True if conversation was successful
 */
async function conversationWasSuccessful(messages) {
    const conversation = `CONVERSATION: ${JSON.stringify(messages)}`;
    const result = await evaluateWithLLMBool(
        CONVERSATIONAL_EVAL_SYSTEM_PROMPT,
        conversation
    );
    return result.value;
}

/**
 * Run an agent with a query and get tool calls (without executing them)
 * @param {Agent} agent - The agent to run
 * @param {string} query - The user query
 * @returns {Promise<Array>} Tool calls from the response
 */
async function runAndGetToolCalls(agent, query) {
    const message = { role: "user", content: query };
    const response = await client.run({
        agent: agent,
        messages: [message],
        execute_tools: false // Equivalent to execute_tools=False in Python
    });
    
    const lastMessage = response.messages[response.messages.length - 1];
    return lastMessage.tool_calls || [];
}

// Test cases for triage agent function calls
describe('Triage Agent Function Calls', () => {
    const testCases = [
        { query: "I want to make a refund!", functionName: "transferToRefunds" },
        { query: "I want to talk to sales.", functionName: "transferToSales" }
    ];

    testCases.forEach(({ query, functionName }) => {
        test(`triage agent calls correct function for: "${query}"`, async () => {
            // Skip if no valid API key available
            if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-test-')) {
                console.warn('Skipping test - no valid OpenAI API key provided');
                return;
            }

            const toolCalls = await runAndGetToolCalls(triageAgent, query);
            
            expect(toolCalls).toHaveLength(1);
            expect(toolCalls[0].function.name).toBe(functionName);
        });
    });
});

// Test cases for conversation success evaluation
describe('Conversation Success Evaluation', () => {
    const successfulConversations = [
        [
            { role: "user", content: "Who is the lead singer of U2" },
            { role: "assistant", content: "Bono is the lead singer of U2." }
        ],
        [
            { role: "user", content: "Hello!" },
            { role: "assistant", content: "Hi there! How can I assist you today?" },
            { role: "user", content: "I want to make a refund." },
            { role: "tool", tool_name: "transferToRefunds" },
            { role: "user", content: "Thank you!" },
            { role: "assistant", content: "You're welcome! Have a great day!" }
        ]
    ];

    successfulConversations.forEach((messages, index) => {
        test(`conversation ${index + 1} is evaluated as successful`, async () => {
            // Skip if no valid API key available
            if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-test-')) {
                console.warn('Skipping test - no valid OpenAI API key provided');
                return;
            }

            const result = await conversationWasSuccessful(messages);
            expect(result).toBe(true);
        });
    });
});

module.exports = {
    conversationWasSuccessful,
    runAndGetToolCalls,
    CONVERSATIONAL_EVAL_SYSTEM_PROMPT
};