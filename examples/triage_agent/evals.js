/**
 * Triage Agent Evaluations
 * Tests triage agent functionality matching Python implementation
 */

const { Swarm } = require('../../dist/index.js');
const { triageAgent, salesAgent, refundsAgent } = require('./agents.js');
const { evaluateWithLLMBool } = require('./evalsUtil.js');

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
 * @returns {Promise<boolean>} True if successful
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
 * Run agent query and get tool calls without executing them
 * @param {Agent} agent - The agent to run
 * @param {string} query - The query to process
 * @returns {Array|null} Tool calls array or null
 */
async function runAndGetToolCalls(agent, query) {
  const message = { role: 'user', content: query };
  const response = await client.run({
    agent,
    messages: [message],
    execute_tools: false,
  });
  return response.messages[response.messages.length - 1].tool_calls || null;
}

/**
 * Test cases for triage routing
 */
const triageTestCases = [
  { query: "I want to make a refund!", expectedFunction: "transferToRefunds" },
  { query: "I want to talk to sales.", expectedFunction: "transferToSales" },
];

/**
 * Test cases for successful conversations
 */
const conversationTestCases = [
  // Simple successful conversation
  [
    { role: "user", content: "Who is the lead singer of U2" },
    { role: "assistant", content: "Bono is the lead singer of U2." },
  ],
  // Conversation with transfer
  [
    { role: "user", content: "Hello!" },
    { role: "assistant", content: "Hi there! How can I assist you today?" },
    { role: "user", content: "I want to make a refund." },
    { role: "tool", tool_name: "transferToRefunds" },
    { role: "user", content: "Thank you!" },
    { role: "assistant", content: "You're welcome! Have a great day!" },
  ],
];

/**
 * Run all evaluation tests
 */
async function runEvaluations() {
  console.log('🧪 Running Triage Agent Evaluations\n');
  
  let passed = 0;
  let failed = 0;

  // Test triage routing
  console.log('Testing triage agent routing:');
  for (const test of triageTestCases) {
    try {
      const toolCalls = await runAndGetToolCalls(triageAgent, test.query);
      const success = toolCalls && 
                     toolCalls.length === 1 && 
                     toolCalls[0].function.name === test.expectedFunction;
      
      if (success) {
        console.log(`  ✅ "${test.query}" → ${test.expectedFunction}`);
        passed++;
      } else {
        console.log(`  ❌ "${test.query}" - Expected ${test.expectedFunction}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ "${test.query}" - Error: ${error.message}`);
      failed++;
    }
  }

  // Test conversation evaluation (requires API key)
  if (process.env.OPENAI_API_KEY) {
    console.log('\nTesting conversation evaluation:');
    for (let i = 0; i < conversationTestCases.length; i++) {
      const conversation = conversationTestCases[i];
      try {
        const success = await conversationWasSuccessful(conversation);
        
        if (success) {
          console.log(`  ✅ Conversation ${i + 1} evaluated as successful`);
          passed++;
        } else {
          console.log(`  ❌ Conversation ${i + 1} evaluated as unsuccessful`);
          failed++;
        }
      } catch (error) {
        console.log(`  ❌ Conversation ${i + 1} - Error: ${error.message}`);
        failed++;
      }
    }
  } else {
    console.log('\n⚠️  Skipping conversation evaluation tests (no API key)');
  }

  // Summary
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  conversationWasSuccessful,
  runAndGetToolCalls,
  triageTestCases,
  conversationTestCases,
  runEvaluations
};

// Run evaluations if executed directly
if (require.main === module) {
  runEvaluations().catch(console.error);
}