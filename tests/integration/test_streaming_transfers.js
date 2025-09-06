#!/usr/bin/env node

/**
 * Test script for customer service streaming transfers
 * This tests the agent transfer functionality programmatically
 */

const { Swarm } = require('../../dist/index.js');
const { 
  mainAssistant, 
  billingAssistant, 
  technicalAssistant 
} = require('../../examples/customer_service_streaming/main.js');

async function testTransfers() {
  const client = new Swarm();
  const contextVariables = {
    customer_context: "Test customer: Sarah Johnson"
  };

  console.log('🧪 Testing Customer Service Agent Transfers\n');

  // Test 1: Billing transfer
  console.log('Test 1: Testing billing transfer');
  console.log('User: "I have a question about my bill"');
  
  let messages = [{ role: 'user', content: 'I have a question about my bill' }];
  
  const response1 = await client.run({
    agent: mainAssistant,
    messages,
    context_variables: contextVariables,
    debug: false
  });

  console.log(`Assistant: ${response1.messages[0].content}`);
  console.log(`Current Agent: ${response1.agent.name}`);
  console.log(`Transfer successful: ${response1.agent === billingAssistant ? '✅' : '❌'}\n`);

  // Test 2: Continue conversation with billing agent
  console.log('Test 2: Continue with billing agent');
  console.log('User: "Can you explain the charges on my account?"');
  
  messages = response1.messages;
  messages.push({ role: 'user', content: 'Can you explain the charges on my account?' });
  
  const response2 = await client.run({
    agent: response1.agent,
    messages,
    context_variables: contextVariables,
    debug: false
  });

  console.log(`Assistant: ${response2.messages[response2.messages.length - 1].content}`);
  console.log(`Current Agent: ${response2.agent.name}\n`);

  // Test 3: Transfer back to main
  console.log('Test 3: Testing transfer back to main');
  console.log('User: "I also have a technical issue"');
  
  messages = [...messages, ...response2.messages];
  messages.push({ role: 'user', content: 'I also have a technical issue' });
  
  const response3 = await client.run({
    agent: response2.agent,
    messages,
    context_variables: contextVariables,
    debug: false
  });

  console.log(`Assistant: ${response3.messages[response3.messages.length - 1].content}`);
  console.log(`Current Agent: ${response3.agent.name}`);
  console.log(`Transfer back successful: ${response3.agent === mainAssistant ? '✅' : '❌'}\n`);

  // Test 4: Test streaming with transfers
  console.log('Test 4: Testing streaming mode with transfer');
  console.log('User: "My internet is not working"');
  
  messages = [{ role: 'user', content: 'My internet is not working' }];
  
  console.log('Streaming response:');
  const stream = client.run({
    agent: mainAssistant,
    messages,
    context_variables: contextVariables,
    stream: true,
    debug: false
  });

  let finalAgent = null;
  let streamContent = '';
  
  for await (const chunk of stream) {
    if (chunk.content) {
      process.stdout.write(chunk.content);
      streamContent += chunk.content;
    }
    if (chunk.response) {
      finalAgent = chunk.response.agent;
    }
  }
  
  console.log(`\n\nFinal Agent: ${finalAgent?.name}`);
  console.log(`Transfer to technical successful: ${finalAgent === technicalAssistant ? '✅' : '❌'}\n`);

  console.log('✅ All tests completed!');
}

// Run tests
testTransfers().catch(console.error);