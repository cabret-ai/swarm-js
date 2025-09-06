// Main Swarm class implementation

import OpenAI from 'openai';
import { 
  Agent, 
  SwarmResponse, 
  SwarmRunOptions, 
  ChatCompletionMessage, 
  ToolCall,
  AgentFunction,
  Result 
} from './types';
import { debugPrint, functionToJson, mergeChunk } from './util';

const CTX_VARS_NAME = 'context_variables';

export class Swarm {
  private client: OpenAI;

  constructor(client?: OpenAI) {
    this.client = client || new OpenAI();
  }

  private async getChatCompletion(
    agent: Agent,
    history: ChatCompletionMessage[],
    contextVariables: Record<string, any>,
    modelOverride: string | null,
    stream: boolean,
    debug: boolean
  ): Promise<any> {
    const contextVars = { ...contextVariables };
    const instructions = typeof agent.instructions === 'function' 
      ? agent.instructions(contextVars)
      : agent.instructions;

    const messages = [
      { role: 'system' as const, content: instructions },
      ...history
    ];

    debugPrint(debug, 'Getting chat completion for...:', messages);

    const tools = agent.functions.map(f => functionToJson(f));
    
    // Hide context_variables from model
    for (const tool of tools) {
      const params = tool.function.parameters;
      delete params.properties[CTX_VARS_NAME];
      if (params.required) {
        params.required = params.required.filter((r: string) => r !== CTX_VARS_NAME);
      }
    }

    const createParams: any = {
      model: modelOverride || agent.model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: agent.tool_choice,
      stream,
    };

    if (tools.length > 0) {
      createParams.parallel_tool_calls = agent.parallel_tool_calls;
    }

    return await this.client.chat.completions.create(createParams);
  }

  private handleFunctionResult(result: any, debug: boolean): Result {
    if (result instanceof Result) {
      return result;
    }

    if (result instanceof Agent) {
      return new Result({
        value: JSON.stringify({ assistant: result.name }),
        agent: result,
      });
    }

    try {
      return new Result({ value: String(result) });
    } catch (e) {
      const errorMessage = `Failed to cast response to string: ${result}. Make sure agent functions return a string or Result object. Error: ${e}`;
      debugPrint(debug, errorMessage);
      throw new TypeError(errorMessage);
    }
  }

  private async handleToolCalls(
    toolCalls: ToolCall[],
    functions: AgentFunction[],
    contextVariables: Record<string, any>,
    debug: boolean
  ): Promise<SwarmResponse> {
    const functionMap: Record<string, AgentFunction> = {};
    for (const func of functions) {
      functionMap[func.name] = func;
    }

    const partialResponse: SwarmResponse = {
      messages: [],
      agent: null,
      context_variables: {}
    };

    for (const toolCall of toolCalls) {
      const name = toolCall.function.name;
      
      // Handle missing tool case, skip to next tool
      if (!(name in functionMap)) {
        debugPrint(debug, `Tool ${name} not found in function map.`);
        partialResponse.messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name,
          content: `Error: Tool ${name} not found.`,
        });
        continue;
      }

      const args = JSON.parse(toolCall.function.arguments);
      debugPrint(debug, `Processing tool call: ${name} with arguments`, args);

      const func = functionMap[name];
      
      // Pass context_variables to agent functions
      const funcStr = func.toString();
      if (funcStr.includes('context_variables')) {
        args[CTX_VARS_NAME] = contextVariables;
      }

      // Handle both destructured and individual parameter styles
      let rawResult;
      const paramMatch = funcStr.match(/\(([^)]*)\)/);
      const paramString = paramMatch ? paramMatch[1].trim() : '';
      
      // Check if function uses destructuring pattern like function({ prop1, prop2 })
      const isDestructuredPattern = paramString.startsWith('{') && paramString.includes('}');
      
      if (isDestructuredPattern) {
        // Function expects destructured parameters, pass the entire args object
        rawResult = await func(args);
      } else {
        // For backward compatibility, check if this is the known problematic pattern
        // Functions like queryDocs(query) should receive the value directly
        const argKeys = Object.keys(args).filter(key => key !== CTX_VARS_NAME);
        
        if (argKeys.length === 0) {
          // No arguments to pass
          rawResult = await func();
        } else if (argKeys.length === 1 && 
                   paramString !== '' && 
                   !paramString.includes(':') && 
                   !paramString.includes('params') && 
                   !paramString.includes('args') &&
                   !paramString.includes('{') &&
                   paramString === argKeys[0]) {
          // Single parameter with matching name - likely wants the value directly
          // This handles cases like queryDocs(query) where the parameter name matches the key
          rawResult = await func(args[argKeys[0]]);
        } else {
          // Default behavior: pass the entire args object (maintains backward compatibility)
          rawResult = await func(args);
        }
      }
      const result = this.handleFunctionResult(rawResult, debug);

      partialResponse.messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name,
        content: result.value,
      });

      Object.assign(partialResponse.context_variables, result.context_variables);
      if (result.agent) {
        partialResponse.agent = result.agent;
      }
    }

    return partialResponse;
  }

  private async *runAndStreamInternal(options: SwarmRunOptions): AsyncGenerator<any, void, unknown> {
    const {
      agent,
      messages,
      context_variables = {},
      model_override = null,
      debug = false,
      max_turns = Infinity,
      execute_tools = true,
    } = options;

    let activeAgent = agent;
    const contextVariables = { ...context_variables };
    const history = [...messages];
    const initLen = messages.length;

    while (history.length - initLen < max_turns) {
      const message: any = {
        content: '',
        sender: activeAgent.name,
        role: 'assistant',
        function_call: null,
        tool_calls: {},
      };

      const completion = await this.getChatCompletion(
        activeAgent,
        history,
        contextVariables,
        model_override,
        true,
        debug
      );

      yield { delim: 'start' };
      
      for await (const chunk of completion) {
        const delta = chunk.choices[0].delta;
        
        // Clone delta for yielding
        const yieldDelta = JSON.parse(JSON.stringify(delta));
        if (yieldDelta.role === 'assistant') {
          yieldDelta.sender = activeAgent.name;
        }
        
        // Yield content chunks with proper format
        if (yieldDelta.content) {
          yield {
            content: yieldDelta.content,
            role: yieldDelta.role,
            sender: yieldDelta.sender || activeAgent.name,
            tool_calls: yieldDelta.tool_calls
          };
        } else if (yieldDelta.tool_calls) {
          yield {
            content: undefined,
            role: yieldDelta.role,
            tool_calls: yieldDelta.tool_calls
          };
        }
        
        // Clone delta for merging to avoid modifying the yielded object
        const mergeDelta = JSON.parse(JSON.stringify(delta));
        if (mergeDelta.role === 'assistant') {
          mergeDelta.sender = activeAgent.name;
        }
        delete mergeDelta.role;
        delete mergeDelta.sender;
        mergeChunk(message, mergeDelta);
      }
      
      yield { delim: 'end' };

      message.tool_calls = Object.values(message.tool_calls);
      if (message.tool_calls.length === 0) {
        message.tool_calls = null;
      }

      debugPrint(debug, 'Received completion:', message);
      history.push(message);

      if (!message.tool_calls || !execute_tools) {
        debugPrint(debug, 'Ending turn.');
        break;
      }

      const partialResponse = await this.handleToolCalls(
        message.tool_calls,
        activeAgent.functions,
        contextVariables,
        debug
      );

      history.push(...partialResponse.messages);
      Object.assign(contextVariables, partialResponse.context_variables);
      if (partialResponse.agent) {
        activeAgent = partialResponse.agent;
      }
    }

    yield {
      response: {
        messages: history.slice(initLen),
        agent: activeAgent,
        context_variables: contextVariables,
      }
    };
  }

  run(options: SwarmRunOptions & { stream?: false }): Promise<SwarmResponse>;
  run(options: SwarmRunOptions & { stream: true }): AsyncGenerator<any, void, unknown>;
  run(options: SwarmRunOptions): Promise<SwarmResponse> | AsyncGenerator<any, void, unknown> {
    const {
      agent,
      messages,
      context_variables = {},
      model_override = null,
      stream = false,
      debug = false,
      max_turns = Infinity,
      execute_tools = true,
    } = options;

    if (stream) {
      return this.runAndStreamInternal(options);
    }

    return this.runSync(options);
  }

  // Public method for streaming (matches Python API)
  async *runAndStream(options: SwarmRunOptions): AsyncGenerator<any, void, unknown> {
    yield* this.runAndStreamInternal(options);
  }

  private async runSync(options: SwarmRunOptions): Promise<SwarmResponse> {
    const {
      agent,
      messages,
      context_variables = {},
      model_override = null,
      debug = false,
      max_turns = Infinity,
      execute_tools = true,
    } = options;

    let activeAgent = agent;
    const contextVariables = { ...context_variables };
    const history = [...messages];
    const initLen = messages.length;

    while (history.length - initLen < max_turns && activeAgent) {
      const completion = await this.getChatCompletion(
        activeAgent,
        history,
        contextVariables,
        model_override,
        false,
        debug
      );

      const message = completion.choices[0].message;
      debugPrint(debug, 'Received completion:', message);

      message.sender = activeAgent.name;
      history.push(JSON.parse(JSON.stringify(message)));

      if (!message.tool_calls || !execute_tools) {
        debugPrint(debug, 'Ending turn.');
        break;
      }

      const partialResponse = await this.handleToolCalls(
        message.tool_calls,
        activeAgent.functions,
        contextVariables,
        debug
      );

      history.push(...partialResponse.messages);
      Object.assign(contextVariables, partialResponse.context_variables);
      if (partialResponse.agent) {
        activeAgent = partialResponse.agent;
      }
    }

    return {
      messages: history.slice(initLen),
      agent: activeAgent,
      context_variables: contextVariables,
    };
  }
}