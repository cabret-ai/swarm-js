#!/usr/bin/env node

/**
 * Test script for customer service streaming
 */

const { Swarm } = require('../../dist/index.js');
const { 
  mainAssistant, 
  billingAssistant, 
  technicalAssistant,
  orderAssistant,
  accountAssistant
} = require('./main.js');

async function testAgentTransfers() {
  console.log('🧪 Testing Customer Service Agent Transfers\n');
  
  const client = new Swarm();
  const contextVariables = {};
  
  const testCases = [
    {
      name: "Billing Transfer",
      message: "I have a question about my bill",
      expectedAgent: billingAssistant
    },
    {
      name: "Technical Transfer", 
      message: "My service isn't working",
      expectedAgent: technicalAssistant
    },
    {
      name: "Order Transfer",
      message: "Where is my order?",
      expectedAgent: orderAssistant
    },
    {
      name: "Account Transfer",
      message: "I need to change my password",
      expectedAgent: accountAssistant
    }
  ];

  for (const test of testCases) {
    console.log(`\nTest: ${test.name}`);
    console.log(`User: "${test.message}"`);
    
    const response = await client.run({
      agent: mainAssistant,
      messages: [{ role: 'user', content: test.message }],
      context_variables: contextVariables,
      debug: false
    });

    const lastMessage = response.messages[response.messages.length - 1];
    console.log(`Response: ${lastMessage.content.substring(0, 100)}...`);
    console.log(`Current Agent: ${response.agent.name}`);
    console.log(`Transfer successful: ${response.agent === test.expectedAgent ? '✅' : '❌'}`);
  }

  console.log('\n\nTest: Streaming Response');
  console.log('User: "Hello, I need help"');
  console.log('Streaming: ');
  
  const stream = client.run({
    agent: mainAssistant,
    messages: [{ role: 'user', content: 'Hello, I need help' }],
    context_variables: contextVariables,
    stream: true,
    debug: false
  });

  for await (const chunk of stream) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
    }
  }
  
  console.log('\n\n✅ All tests completed!');
}

testAgentTransfers().catch(console.error);