# Triage Agent Example

This example demonstrates a multi-agent system where a triage agent routes user requests to specialized agents based on the user's intent.

## Overview

The system consists of three agents:
- **Triage Agent**: Determines which specialized agent should handle the user's request
- **Sales Agent**: Enthusiastic about selling products (specifically bees!)  
- **Refunds Agent**: Handles refund requests and can apply discounts

## Agent Handoff Logic

The triage agent analyzes user requests and transfers conversations to the appropriate specialist:
- Sales-related queries → Sales Agent
- Refund/return queries → Refunds Agent

Each specialized agent can also transfer back to the triage agent if the user asks about topics outside their expertise.

## Files

- `agents.js` - Contains the agent definitions and handoff functions
- `run.js` - Interactive demo script  
- `evals.js` - Evaluation tests to verify correct agent routing
- `evals_util.js` - Utility functions for LLM-based evaluations

## Running the Demo

```bash
cd examples/triage_agent
node run.js
```

## Example Interactions

**Sales Transfer:**
```
User: I want to talk to sales
Triage Agent: I'll transfer you to our sales team!
Sales Agent: Hi there! I'm super excited to help you with our amazing bee products!
```

**Refunds Transfer:**
```  
User: I need to return an item
Triage Agent: Let me connect you with our refunds specialist.
Refunds Agent: I'd be happy to help with your refund. Can you provide the item ID?
```

## Functions

**Refunds Agent Functions:**
- `processRefund(itemId, reason)` - Process a refund for an item
- `applyDiscount()` - Apply a discount to the user's cart

**Transfer Functions:**
- `transferToSales()` - Route to sales agent
- `transferToRefunds()` - Route to refunds agent  
- `transferBackToTriage()` - Return to triage agent

## Running Tests

```bash
npm test examples/triage_agent/evals.js
```

The evaluations verify:
1. Triage agent correctly identifies and routes different types of requests
2. Conversations are successfully handled by the appropriate agents
3. Agent handoff logic works correctly

## Key Features

- **Intent Recognition**: Triage agent identifies user intent from natural language
- **Seamless Handoffs**: Smooth transfers between specialized agents
- **Context Preservation**: Conversation history maintained across agent transfers
- **Fallback Handling**: Agents can transfer back when requests fall outside their expertise