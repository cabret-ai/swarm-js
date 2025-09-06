# Customer Service Streaming Demo

This example demonstrates a customer service system with streaming responses and agent handoffs using the Swarm.js library.

## Features

- **Streaming Responses**: Real-time AI responses that stream to the user
- **Multi-Agent System**: Specialized agents for different domains
- **Seamless Handoffs**: Automatic routing between agents based on user needs
- **Interactive CLI**: Command-line interface for testing

## Agents

1. **Customer Service Representative** (Main)
   - Initial point of contact
   - Routes to specialized agents
   - Handles general inquiries

2. **Billing Specialist**
   - Payment issues and methods
   - Invoice questions
   - Subscription management
   - Refunds and credits

3. **Technical Support Specialist**
   - Product technical issues
   - Troubleshooting steps
   - Configuration problems
   - Bug reports

4. **Order Management Specialist**
   - Order status and tracking
   - Shipping information
   - Order modifications
   - Cancellations and returns

5. **Account Management Specialist**
   - Account settings
   - Password resets
   - Profile updates
   - Security concerns

## Usage

### Run the Interactive Demo

```bash
node main.js
```

### Run Tests

```bash
node test.js
```

## How It Works

The demo uses the core Swarm.js library to:

1. **Define Agents**: Each agent has specific instructions and transfer functions
2. **Handle Transfers**: Transfer functions return the target agent
3. **Stream Responses**: Uses the streaming API for real-time output
4. **Maintain Context**: Conversation history is preserved across transfers

## Key Differences from Complex Implementation

This implementation:
- Uses the core Swarm library directly (no custom SwarmSystem)
- Follows the same pattern as the Python implementation
- Avoids complex event systems and custom streaming managers
- Provides clean, simple agent transfers

## Example Conversation

```
> Hello, I have a billing question
Customer Service Representative: I'd be happy to help with your billing question. Let me connect you with our billing specialist.

[TRANSFER] Routing to billing specialist: billing inquiry

🔄 Now connected to: Billing Specialist

> Can you explain my recent charges?
Billing Specialist: I'll help you understand your recent charges...
```