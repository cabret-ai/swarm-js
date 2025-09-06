# Weather Agent

This example is a weather agent demonstrating function calling with a single agent. The agent has tools to get the weather of a particular city, and send an email.

## Setup

Make sure you have the required dependencies installed:

```shell
npm install
```

Build the project:

```shell
npm run build
```

Set your OpenAI API key:

```shell
export OPENAI_API_KEY="your-api-key-here"
```

## Running the Weather Agent

To run the weather agent Swarm:

```shell
node run.js
```

This will start an interactive demo where you can:
- Ask about weather in different cities
- Request email sending functionality
- Have natural conversations with the weather agent

Example queries:
- "What's the weather in New York?"
- "Send an email to john@example.com with subject 'Weather Update' and tell them it's sunny"
- "Do I need an umbrella today? I'm in London."

Type "quit" to exit the demo.

## Evals

> [!NOTE]
> These evals are intended to be examples to demonstrate functionality, but will have to be updated and catered to your particular use case.

This example uses `Jest` to run eval unit tests. We have comprehensive tests in the `evals.test.js` file, including:

1. **Tool Calling Tests**: Verify the agent calls `getWeather` function when expected for weather-related queries
2. **Negative Tests**: Confirm the agent does NOT call `getWeather` for non-weather queries  
3. **Function Integration Tests**: Test the actual function implementations work correctly

The tests cover various scenarios:
- Weather queries: "What's the weather in NYC?", "Tell me the weather in London.", etc.
- Non-weather queries: "Who's the president?", "What time is it?", "Hi!"
- Function behavior: Correct JSON formatting, default parameters, email sending

To run the evals:

```shell
npm test examples/weather_agent/evals.test.js
```

Or run all tests:

```shell
npm test
```

## Files

- **`agents.js`**: Defines the weather agent with `getWeather` and `sendEmail` functions
- **`run.js`**: Interactive demo script to test the weather agent
- **`evals.test.js`**: Jest test suite with comprehensive evaluations
- **`README.md`**: This documentation file

## Function Details

### `getWeather({ location, time })`
- **Parameters**: 
  - `location` (string, required): The city to get weather for
  - `time` (string, optional): Time for weather query, defaults to "now"
- **Returns**: JSON string with location, temperature ("65"), and time
- **Example**: `getWeather({ location: "Paris", time: "morning" })`

### `sendEmail({ recipient, subject, body })`
- **Parameters**: 
  - `recipient` (string, required): Email recipient address
  - `subject` (string, required): Email subject line
  - `body` (string, required): Email body content
- **Returns**: "Sent!" confirmation string
- **Side Effects**: Prints email details to console
- **Example**: `sendEmail({ recipient: "test@example.com", subject: "Hello", body: "Weather update" })`