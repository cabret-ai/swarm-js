# Airline Customer Service Demo

A comprehensive multi-agent customer service system for an airline company built with Swarm-JS. This example demonstrates complex agent handoffs, policy-driven workflows, and context management for realistic airline customer service scenarios.

## Overview

This example simulates a Fly Airlines customer service system with multiple specialized agents that handle different types of customer requests:

- **Triage Agent**: Routes customers to the appropriate specialized agent
- **Flight Modification Agent**: Determines whether customers want to cancel or change flights
- **Flight Cancel Agent**: Handles flight cancellation requests and processes refunds/credits
- **Flight Change Agent**: Manages flight change requests and rebooking
- **Lost Baggage Agent**: Assists customers with lost luggage claims

## Features

- **Multi-Agent Orchestration**: Seamless handoffs between specialized agents
- **Policy-Driven Responses**: Agents follow strict airline policies for consistent service
- **Context Variables**: Customer and flight information persists across agent transfers
- **Realistic Workflows**: Complete end-to-end customer service scenarios
- **Function Calling**: Agents can perform actions like initiating refunds, changing flights, etc.
- **Comprehensive Testing**: Evaluation framework with test cases for agent behavior

## Project Structure

```
examples/airline/
├── main.js                                      # Main demo runner
├── configs/
│   ├── agents.js                               # Agent definitions and handoff functions
│   └── tools.js                                # Helper functions for airline operations
├── data/
│   └── routines/
│       ├── prompts.js                          # Base prompts and instructions
│       ├── baggage/
│       │   └── policies.js                     # Lost baggage handling policies
│       └── flight_modification/
│           └── policies.js                     # Flight cancellation and change policies
├── evals/
│   ├── evalUtils.js                           # Evaluation utilities
│   └── functionEvals.js                       # Agent evaluation tests
└── README.md                                   # This file
```

## Customer Context

The demo simulates a customer with the following profile:
- **Name**: John Doe (Premium Status)
- **Flight**: #1919 from LGA (LaGuardia) → LAX (Los Angeles)
- **Date**: May 21, 2024 at 3:00 PM ET
- **Contact**: (123) 456-7890, johndoe@example.com

## Agent Policies

### Triage Agent
Routes customers based on their inquiry:
- Flight-related issues → Flight Modification Agent
- Baggage issues → Lost Baggage Agent

### Flight Modification Agent
Determines specific intent:
- Cancellation requests → Flight Cancel Agent
- Change requests → Flight Change Agent

### Flight Cancel Agent
Follows strict cancellation policy:
1. Confirms flight details
2. Offers refund or flight credits
3. Processes the customer's choice
4. Provides timeline expectations

### Flight Change Agent
Handles flight changes:
1. Verifies eligibility for changes
2. Suggests alternatives
3. Checks availability
4. Processes the change
5. Informs about fees/differences

### Lost Baggage Agent
Assists with missing luggage:
1. Initiates baggage search
2. Arranges delivery if found
3. Escalates if not found

## Running the Demo

1. Make sure you have your OpenAI API key set:
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   ```

2. Run the interactive demo:
   ```bash
   node examples/airline/main.js
   ```

3. Try different customer requests:
   - "I need to cancel my flight"
   - "Can I change my flight to tomorrow?"
   - "My baggage is missing"
   - "I want a refund"

## Example Interactions

### Flight Cancellation
```
User: I need to cancel flight 1919
Triage Agent: I'll transfer you to our flight modification specialist.
Flight Modification Agent: I can help with that. Do you want to cancel for a refund or flight credits?
User: I want a refund
Flight Cancel Agent: I'll process your refund for flight 1919. The refund will be processed within 3-5 business days.
```

### Lost Baggage
```
User: My luggage didn't arrive
Triage Agent: I'll connect you with our baggage assistance team.
Lost Baggage Agent: I'll start searching for your baggage right away. Good news - your baggage was found! We'll arrange delivery to your address.
```

## Running Evaluations

Test agent performance with the evaluation framework:

```bash
node examples/airline/evals/functionEvals.js
```

This runs automated tests to verify:
- Agents call the correct transfer functions
- Proper routing based on customer intent
- Consistency across multiple test runs

Results are saved to `eval_results/` with detailed accuracy metrics.

## Key Implementation Details

### Agent Handoffs
Agents use transfer functions to route customers:
```javascript
function transferToFlightModification() {
    return flightModification;
}
```

### Context Persistence
Customer and flight information flows through all agents:
```javascript
const contextVariables = {
    customer_context: "Customer details...",
    flight_context: "Flight information..."
};
```

### Policy Enforcement
Agents follow structured policies to ensure consistent service:
```javascript
const FLIGHT_CANCELLATION_POLICY = `
1. Confirm flight details
2. Offer refund or credits
3. Process customer choice
...`;
```

## Extensibility

This framework can be extended with:
- Additional agent types (e.g., Upgrade Agent, Special Assistance)
- More complex policies and business rules
- Integration with external systems (booking APIs, payment processors)
- Multi-language support
- Advanced routing logic based on customer status

## Dependencies

- Node.js
- Swarm-JS framework
- OpenAI API access
- UUID package (for evaluations)

This example demonstrates the power of multi-agent systems for complex customer service workflows while maintaining clear separation of concerns and policy-driven decision making.