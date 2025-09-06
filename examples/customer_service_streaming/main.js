#!/usr/bin/env node

/**
 * Customer Service Streaming Demo
 * Uses the core Swarm library for proper agent handoffs and streaming
 */

const { Swarm, Agent } = require('../../dist/index.js');
const readline = require('readline');

// Customer context
const customerContext = `Here is what you know about the customer's details:
1. CUSTOMER_ID: customer_67890
2. NAME: Sarah Johnson  
3. PHONE_NUMBER: (555) 123-4567
4. EMAIL: sarah.johnson@email.com
5. STATUS: Premium
6. ACCOUNT_STATUS: Active
7. BALANCE: $0.00
8. LOCATION: 789 Oak Street, Portland, OR 97205, USA
9. JOIN_DATE: March 15, 2023
10. LAST_LOGIN: July 20, 2024`;

// Forward declare agents to handle circular dependencies
let mainAssistant, billingAssistant, technicalAssistant, orderAssistant, accountAssistant;

// Transfer functions
function transferToBilling({ reason = "billing inquiry" }) {
  console.log(`\n[TRANSFER] Routing to billing specialist: ${reason}\n`);
  return billingAssistant;
}

function transferToTechnical({ issue = "technical issue" }) {
  console.log(`\n[TRANSFER] Routing to technical support: ${issue}\n`);
  return technicalAssistant;
}

function transferToOrderManagement({ orderRelated = "order inquiry" }) {
  console.log(`\n[TRANSFER] Routing to order management: ${orderRelated}\n`);
  return orderAssistant;
}

function transferToAccountManagement({ accountIssue = "account inquiry" }) {
  console.log(`\n[TRANSFER] Routing to account management: ${accountIssue}\n`);
  return accountAssistant;
}

function transferToMain() {
  console.log(`\n[TRANSFER] Routing back to main customer service\n`);
  return mainAssistant;
}

// Agent definitions
mainAssistant = new Agent({
  name: "Customer Service Representative",
  model: "gpt-4o",
  instructions: `You are a helpful and empathetic customer service representative.

Key Information:
${customerContext}

Your responsibilities:
1. Greet customers warmly and professionally
2. Understand their needs and route to appropriate specialists
3. Handle general inquiries directly
4. Always maintain a friendly, professional tone

Routing guidelines:
- Billing questions → transfer to billing specialist
- Technical issues → transfer to technical support
- Order inquiries → transfer to order management
- Account issues → transfer to account management

Only use one transfer function per response. Be clear about why you're transferring.`,
  functions: [
    transferToBilling,
    transferToTechnical,
    transferToOrderManagement,
    transferToAccountManagement
  ]
});

billingAssistant = new Agent({
  name: "Billing Specialist",
  model: "gpt-4o",
  instructions: `You are a billing specialist.

Key Information:
${customerContext}

Focus on:
- Payment issues and methods
- Invoice questions
- Subscription management
- Refunds and credits
- Billing disputes

If the customer asks about non-billing topics, transfer back to main customer service.`,
  functions: [transferToMain]
});

technicalAssistant = new Agent({
  name: "Technical Support Specialist",
  model: "gpt-4o",
  instructions: `You are a technical support specialist.

Key Information:
${customerContext}

Help with:
- Product technical issues
- Troubleshooting steps
- Configuration problems
- Bug reports
- Feature requests

For non-technical issues, transfer back to main customer service.`,
  functions: [transferToMain]
});

orderAssistant = new Agent({
  name: "Order Management Specialist",
  model: "gpt-4o",
  instructions: `You are an order management specialist.

Key Information:
${customerContext}

Assist with:
- Order status and tracking
- Shipping information
- Order modifications
- Cancellations
- Returns and exchanges

For non-order issues, transfer back to main customer service.`,
  functions: [transferToMain]
});

accountAssistant = new Agent({
  name: "Account Management Specialist",
  model: "gpt-4o",
  instructions: `You are an account management specialist.

Key Information:
${customerContext}

Handle:
- Account settings and preferences
- Password resets
- Profile updates
- Security concerns
- Account deletion or suspension

For non-account issues, transfer back to main customer service.`,
  functions: [transferToMain]
});

/**
 * Main streaming demo function
 */
async function runStreamingDemo() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║         🚀 Customer Service Streaming Demonstration                   ║
║                                                                       ║
║              Real-time AI Multi-Agent System                          ║
║                                                                       ║
║    • Streaming LLM responses with live tool execution                 ║
║    • Intelligent agent routing and handoffs                          ║
║    • Specialized billing, technical, order & account support         ║
║    • Interactive command interface with session management           ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
  `);

  console.log('\n╭─────────────────────────────────────────────────────╮');
  console.log('│           Customer Service Streaming Chat           │');
  console.log('╰─────────────────────────────────────────────────────╯\n');
  console.log(`Connected to: ${mainAssistant.name}`);
  console.log('Type your message and press Enter. Type "exit" to quit.\n');

  const client = new Swarm();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  const messages = [];
  let currentAgent = mainAssistant;
  const contextVariables = {};

  // Handle user input
  rl.on('line', async (input) => {
    const trimmedInput = input.trim();
    
    if (trimmedInput.toLowerCase() === 'exit' || trimmedInput.toLowerCase() === 'quit') {
      console.log('\n👋 Session ended. Thank you!\n');
      rl.close();
      process.exit(0);
    }

    if (!trimmedInput) {
      rl.prompt();
      return;
    }

    messages.push({ role: 'user', content: trimmedInput });
    console.log(`You: ${trimmedInput}`);

    try {
      // Show typing indicator
      process.stdout.write(`${currentAgent.name}: `);

      const stream = client.run({
        agent: currentAgent,
        messages,
        context_variables: contextVariables,
        stream: true,
        debug: false
      });

      let responseContent = '';
      let newAgent = null;

      for await (const chunk of stream) {
        // Handle content chunks
        if (chunk.content) {
          process.stdout.write(chunk.content);
          responseContent += chunk.content;
        }

        if (chunk.response) {
          messages.length = 0;
          messages.push(...chunk.response.messages);
          
          if (chunk.response.agent !== currentAgent) {
            newAgent = chunk.response.agent;
          }
          
          Object.assign(contextVariables, chunk.response.context_variables);
        }
      }

      console.log(); // New line after response

      // Handle agent switch
      if (newAgent) {
        currentAgent = newAgent;
        console.log(`\n🔄 Now connected to: ${currentAgent.name}\n`);
      }

    } catch (error) {
      console.error('\n❌ Error:', error.message);
      if (error.stack && process.env.DEBUG) {
        console.error(error.stack);
      }
    }

    rl.prompt();
  });

  // Handle Ctrl+C gracefully
  rl.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...\n');
    rl.close();
    process.exit(0);
  });

  console.log('📝 Quick Help:');
  console.log('  • Type your message and press Enter');
  console.log('  • Type "exit" or Ctrl+C to quit\n');

  rl.prompt();
}

module.exports = {
  mainAssistant,
  billingAssistant,
  technicalAssistant,
  orderAssistant,
  accountAssistant,
  runStreamingDemo
};

if (require.main === module) {
  runStreamingDemo().catch(console.error);
}