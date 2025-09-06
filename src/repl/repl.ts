// REPL (Read-Eval-Print Loop) functionality for Swarm JavaScript implementation


import * as readline from 'readline';
import { Swarm } from '../swarm';
import { Agent, ChatCompletionMessage, StreamChunk, SwarmResponse } from '../types';

// ANSI color codes for terminal output
const COLORS = {
  BLUE: '\x1b[94m',
  PURPLE: '\x1b[95m', 
  GRAY: '\x1b[90m',
  RESET: '\x1b[0m'
};

/**
 * Process and print streaming response chunks
 * @param response AsyncGenerator from Swarm.run with stream=true
 * @returns Promise<SwarmResponse> The final response object
 */
export async function processAndPrintStreamingResponse(
  response: AsyncGenerator<StreamChunk, void, unknown>
): Promise<SwarmResponse> {
  let content = '';
  let lastSender = '';

  for await (const chunk of response) {
    if (chunk.sender) {
      lastSender = chunk.sender;
    }

    if (chunk.content !== undefined && chunk.content !== null) {
      if (!content && lastSender) {
        process.stdout.write(`${COLORS.BLUE}${lastSender}:${COLORS.RESET} `);
        lastSender = '';
      }
      process.stdout.write(chunk.content);
      content += chunk.content;
    }

    if (chunk.tool_calls !== undefined && chunk.tool_calls !== null) {
      const toolCalls = Array.isArray(chunk.tool_calls) ? chunk.tool_calls : Object.values(chunk.tool_calls);
      for (const toolCall of toolCalls) {
        if (toolCall && toolCall.function) {
          const name = toolCall.function.name;
          if (name) {
            console.log(`${COLORS.BLUE}${lastSender}: ${COLORS.PURPLE}${name}${COLORS.RESET}()`);
          }
        }
      }
    }

    if (chunk.delim === 'end' && content) {
      console.log(); // End of response message
      content = '';
    }

    if (chunk.response) {
      return chunk.response;
    }
  }

  // This should not happen in normal operation, but provides a fallback
  throw new Error('Streaming response ended without final response object');
}

/**
 * Pretty print messages with color formatting
 * @param messages Array of chat completion messages to print
 */
export function prettyPrintMessages(messages: ChatCompletionMessage[]): void {
  for (const message of messages) {
    if (message.role !== 'assistant') {
      continue;
    }

    // Print agent name in blue
    process.stdout.write(`${COLORS.BLUE}${message.sender}${COLORS.RESET}: `);

    // Print response content, if any
    if (message.content) {
      console.log(message.content);
    }

    // Print tool calls in purple, if any
    const toolCalls = message.tool_calls || [];
    if (toolCalls.length > 1) {
      console.log();
    }
    
    for (const toolCall of toolCalls) {
      if (toolCall && toolCall.function) {
        const name = toolCall.function.name;
        const args = toolCall.function.arguments;
        try {
          const parsedArgs = JSON.parse(args);
          const argStr = JSON.stringify(parsedArgs).replace(/:/g, '=');
          console.log(`${COLORS.PURPLE}${name}${COLORS.RESET}(${argStr.slice(1, -1)})`);
        } catch (e) {
          console.log(`${COLORS.PURPLE}${name}${COLORS.RESET}(${args})`);
        }
      }
    }
  }
}

/**
 * Run a demo loop (REPL) for interactive chat with agents
 * @param startingAgent The initial agent to start the conversation with
 * @param contextVariables Optional context variables to pass to agents
 * @param stream Whether to use streaming responses (default: false)
 * @param debug Whether to enable debug output (default: false)
 */
export async function runDemoLoop(
  startingAgent: Agent,
  contextVariables: Record<string, any> = {},
  stream: boolean = false,
  debug: boolean = false
): Promise<void> {
  const client = new Swarm();
  console.log('Starting Swarm CLI 🐝');

  const messages: ChatCompletionMessage[] = [];
  let agent = startingAgent;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Handle stdin close/end events
  let isClosed = false;
  rl.on('close', () => {
    isClosed = true;
  });
  
  process.stdin.on('end', () => {
    isClosed = true;
    rl.close();
  });

  // Promise wrapper for readline question
  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (isClosed) {
        reject(new Error('REPL closed'));
        return;
      }
      rl.question(prompt, resolve);
    });
  };

  try {
    while (true) {
      let userInput: string;
      try {
        userInput = await question(`${COLORS.GRAY}User${COLORS.RESET}: `);
      } catch (error) {
        // REPL was closed (e.g., piped input ended)
        console.log('\n👋 Session ended.');
        break;
      }
      
      // Allow user to exit the loop
      if (userInput.toLowerCase().trim() === 'quit' || userInput.toLowerCase().trim() === 'exit') {
        console.log('👋 Goodbye!');
        break;
      }

      messages.push({ role: 'user', content: userInput });

      try {
        if (stream) {
          const responseGenerator = client.run({
            agent,
            messages,
            context_variables: contextVariables,
            stream: true,
            debug
          }) as AsyncGenerator<StreamChunk, void, unknown>;

          const response = await processAndPrintStreamingResponse(responseGenerator);
          messages.push(...response.messages);
          agent = response.agent || agent;
        } else {
          const response = await client.run({
            agent,
            messages,
            context_variables: contextVariables,
            stream: false,
            debug
          }) as SwarmResponse;

          prettyPrintMessages(response.messages);
          messages.push(...response.messages);
          agent = response.agent || agent;
        }
      } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error && error.message.includes('API key')) {
          console.log('💡 Make sure OPENAI_API_KEY environment variable is set');
        }
      }
    }
  } finally {
    rl.close();
  }
}