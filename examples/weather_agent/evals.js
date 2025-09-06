/**
 * Weather Agent Evaluations
 * Tests weather agent functionality matching Python implementation
 */

const { Swarm } = require('../../dist/index.js');
const { weatherAgent } = require('./agents.js');

const client = new Swarm();

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
 * Test cases for weather queries that should call getWeather
 */
const weatherQueries = [
  "What's the weather in NYC?",
  "Tell me the weather in London.",
  "Do I need an umbrella today? I'm in chicago.",
];

/**
 * Test cases for queries that should NOT call getWeather
 */
const nonWeatherQueries = [
  "Who's the president of the United States?",
  "What is the time right now?",
  "Hi!",
];

/**
 * Run all evaluation tests
 */
async function runEvaluations() {
  console.log('🧪 Running Weather Agent Evaluations\n');
  
  let passed = 0;
  let failed = 0;

  // Test weather queries
  console.log('Testing weather queries (should call getWeather):');
  for (const query of weatherQueries) {
    try {
      const toolCalls = await runAndGetToolCalls(weatherAgent, query);
      const success = toolCalls && 
                     toolCalls.length === 1 && 
                     toolCalls[0].function.name === 'getWeather';
      
      if (success) {
        console.log(`  ✅ "${query}"`);
        passed++;
      } else {
        console.log(`  ❌ "${query}" - Expected getWeather call`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ "${query}" - Error: ${error.message}`);
      failed++;
    }
  }

  // Test non-weather queries
  console.log('\nTesting non-weather queries (should NOT call getWeather):');
  for (const query of nonWeatherQueries) {
    try {
      const toolCalls = await runAndGetToolCalls(weatherAgent, query);
      const success = !toolCalls || toolCalls.length === 0;
      
      if (success) {
        console.log(`  ✅ "${query}"`);
        passed++;
      } else {
        console.log(`  ❌ "${query}" - Expected no tool calls`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ "${query}" - Error: ${error.message}`);
      failed++;
    }
  }

  // Summary
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  runAndGetToolCalls,
  weatherQueries,
  nonWeatherQueries,
  runEvaluations
};

// Run evaluations if executed directly
if (require.main === module) {
  runEvaluations().catch(console.error);
}