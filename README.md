![Swarm Logo](assets/logo.png)

# Swarm (JavaScript/TypeScript)

A lightweight JavaScript/TypeScript implementation of OpenAI's Swarm framework for multi-agent orchestration, ported from the original Python version.

> [!IMPORTANT]
> This is an educational JavaScript port of OpenAI's experimental Swarm framework. For production use, consider the official [OpenAI Agents SDK](https://github.com/openai/openai-agents-python).


<br/>

# Swarm JS Demo
The extent of human contribution to this codebase was recording and uploading this demo of
- The new test suite running on Swarm-JS
- A weather/email agent built on top of Swarm-JS using tools to get the weather and send an email
- A fleet of customer support agents that can transfer an user to each other and use realtime streaming

If you want to see more, clone the codebase! There is an implemented example of an agent that lives in a docker container and has access to a RAG tool (using a real vector database) to answer questions for OpenAI support. All implemented by the rewrite system of course ;)

![Demo](assets/swarm_js_demo.gif)

## Install

Requires Node.js 16+

```bash
npm install
```

## Usage

```javascript
const { Swarm, Agent } = require('./dist/index.js');
// Or with TypeScript/ES modules:
// import { Swarm, Agent } from './src/index';

const client = new Swarm();

function transferToAgentB() {
    return agentB;
}

const agentA = new Agent({
    name: "Agent A",
    instructions: "You are a helpful agent.",
    functions: [transferToAgentB],
});

const agentB = new Agent({
    name: "Agent B",
    instructions: "Only speak in Haikus.",
});

async function main() {
    const response = await client.run({
        agent: agentA,
        messages: [{ role: "user", content: "I want to talk to agent B." }],
    });

    console.log(response.messages[response.messages.length - 1].content);
}

main().catch(console.error);
```

## Overview

Swarm focuses on making agent **coordination** and **execution** lightweight, highly controllable, and easily testable.

It accomplishes this through two primitive abstractions: `Agent`s and **handoffs**. An `Agent` encompasses `instructions` and `functions`, and can at any point choose to hand off a conversation to another `Agent`.

## Examples

Check out `/examples` for inspiration:

- [`basic/`](examples/basic): Simple examples of fundamentals like setup, function calling, handoffs, and context variables
- [`triage_agent/`](examples/triage_agent): Simple example of setting up a basic triage step to hand off to the right agent
- [`weather_agent/`](examples/weather_agent): Simple example of function calling

## Documentation

![Swarm Diagram](assets/swarm_diagram.png)

## Running Swarm

Start by instantiating a Swarm client (which internally uses the official OpenAI client):

```javascript
const { Swarm } = require('./dist/index.js');

const client = new Swarm();
```

### `client.run()`

Swarm's `run()` function is analogous to the `chat.completions.create()` function in the Chat Completions API – it takes `messages` and returns `messages` and saves no state between calls.

```javascript
const response = await client.run({
    agent: myAgent,
    messages: [{ role: "user", content: "Hello!" }],
    context_variables: { user_id: "123" },
    max_turns: 5,
    debug: true
});
```

#### Arguments

| Argument              | Type      | Description                                                                                              | Default     |
| --------------------- | --------- | -------------------------------------------------------------------------------------------------------- | ----------- |
| **agent**             | `Agent`   | The (initial) agent to be called.                                                                       | (required)  |
| **messages**          | `Array`   | A list of message objects, identical to Chat Completions messages                                       | (required)  |
| **context_variables** | `Object`  | A dictionary of additional context variables, available to functions and Agent instructions             | `{}`        |
| **max_turns**         | `number`  | The maximum number of conversational turns allowed                                                       | `Infinity`  |
| **model_override**    | `string`  | An optional string to override the model being used by an Agent                                         | `null`      |
| **execute_tools**     | `boolean` | If `false`, interrupt execution and immediately returns `tool_calls` message when an Agent tries to call a function | `true` |
| **stream**            | `boolean` | If `true`, enables streaming responses                                                                   | `false`     |
| **debug**             | `boolean` | If `true`, enables debug logging                                                                         | `false`     |

## Agents

An `Agent` simply encapsulates a set of `instructions` with a set of `functions`:

```javascript
const agent = new Agent({
    name: "Help Center Agent",
    model: "gpt-4o",
    instructions: "You are a helpful customer service agent.",
    functions: [lookupItem, refundItem],
    tool_choice: "auto"
});
```

### Agent Fields

| Field                   | Type                     | Description                                                                   | Default                      |
| ----------------------- | ------------------------ | ----------------------------------------------------------------------------- | ---------------------------- |
| **name**                | `string`                 | The name of the agent.                                                       | `"Agent"`                    |
| **model**               | `string`                 | The model to be used by the agent.                                           | `"gpt-4o"`                   |
| **instructions**        | `string` or `function`   | Instructions for the agent, can be a string or a function returning a string.| `"You are a helpful agent."` |
| **functions**           | `Array`                  | A list of functions that the agent can call.                                 | `[]`                         |
| **tool_choice**         | `string`                 | The tool choice for the agent, if any.                                       | `null`                       |
| **parallel_tool_calls** | `boolean`                | Whether to allow parallel tool calls.                                        | `true`                       |

## Functions

- Swarm `Agent`s can call JavaScript functions directly.
- Function should usually return a `string` (values will be attempted to be cast as a `string`).
- If a function returns an `Agent`, execution will be transferred to that `Agent`.
- If a function defines a `context_variables` parameter, it will be populated by the `context_variables` passed into `client.run()`.

```javascript
function greet({ name, age, context_variables }) {
    const userName = context_variables.user_name;
    console.log(`Hello ${name}, you are ${age} years old. Nice to meet you, ${userName}!`);
    return "Greeting completed";
}

const agent = new Agent({
    functions: [greet]
});
```

### Handoffs and Updating Context Variables

An `Agent` can hand off to another `Agent` by returning it in a `function`:

```javascript
const salesAgent = new Agent({ name: "Sales Agent" });

function transferToSales() {
    return salesAgent;
}

const agent = new Agent({ functions: [transferToSales] });
```

It can also update the `context_variables` by returning a `Result` object:

```javascript
const { Result } = require('./dist/index.js');

function talkToSales() {
    console.log("Transferring to sales...");
    return new Result({
        value: "Transferred successfully",
        agent: salesAgent,
        context_variables: { department: "sales" }
    });
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build TypeScript
npm run build

# Run examples (after building)
node examples/basic/bare_minimum.js
```

## Testing

The project includes comprehensive testing with both unit tests and integration tests:

### **Unit Tests** (Fast, Mocked)
```bash
npm run test:unit        # Run only unit tests with mocks
```
- Tests core functionality with mocked OpenAI responses
- Fast execution (~1 second)
- No API key required
- Located in `tests/` directory

### **Integration Tests** (Real API)
```bash
npm run test:integration # Run integration tests with real API
```
- Tests with real OpenAI API calls
- Requires valid `OPENAI_API_KEY` environment variable
- Tests actual agent behavior and tool calling
- Located in `examples/` directory (e.g., `weather_agent/evals.test.js`)

### **All Tests**
```bash
npm test                 # Run all tests (unit + integration)
npm run test:all         # Same as above, but sequential
```

## TypeScript Support

Full TypeScript support with type definitions:

```typescript
import { Swarm, Agent, Result, SwarmResponse } from './src/index';

const agent: Agent = new Agent({
    name: "TypeScript Agent",
    instructions: "You help with TypeScript code."
});

const response: SwarmResponse = await client.run({
    agent,
    messages: [{ role: "user", content: "Help me with TypeScript!" }]
});
```

## Configuration

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

The Swarm client automatically uses the official OpenAI Node.js library and will pick up your API key from the environment.

## Architecture

This JavaScript implementation maintains full compatibility with the Python version:

- **Same API**: All methods, parameters, and behaviors match the Python version
- **Official OpenAI Client**: Uses the official `openai` npm package
- **TypeScript First**: Written in TypeScript with full type definitions
- **Test Parity**: All Python tests converted to Jest
- **Example Parity**: All Python examples converted to JavaScript