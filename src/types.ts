// Type definitions for Swarm JavaScript implementation

export interface ChatCompletionMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  sender?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export type AgentFunction = (...args: any[]) => string | Agent | Result | Promise<string | Agent | Result>;

export interface AgentConfig {
  name?: string;
  model?: string;
  instructions?: string | ((contextVariables: Record<string, any>) => string);
  functions?: AgentFunction[];
  tool_choice?: string | null;
  parallel_tool_calls?: boolean;
}

export class Agent {
  name: string;
  model: string;
  instructions: string | ((contextVariables: Record<string, any>) => string);
  functions: AgentFunction[];
  tool_choice: string | null;
  parallel_tool_calls: boolean;

  constructor(config: AgentConfig = {}) {
    this.name = config.name ?? 'Agent';
    this.model = config.model ?? 'gpt-4o';
    this.instructions = config.instructions ?? 'You are a helpful agent.';
    this.functions = config.functions ?? [];
    this.tool_choice = config.tool_choice ?? null;
    this.parallel_tool_calls = config.parallel_tool_calls ?? true;
  }
}

export interface SwarmResponse {
  messages: ChatCompletionMessage[];
  agent: Agent | null;
  context_variables: Record<string, any>;
}

export class Result {
  value: string;
  agent: Agent | null;
  context_variables: Record<string, any>;

  constructor(config: {
    value?: string;
    agent?: Agent | null;
    context_variables?: Record<string, any>;
  } = {}) {
    this.value = config.value ?? '';
    this.agent = config.agent ?? null;
    this.context_variables = config.context_variables ?? {};
  }
}

export interface SwarmRunOptions {
  agent: Agent;
  messages: ChatCompletionMessage[];
  context_variables?: Record<string, any>;
  model_override?: string | null;
  stream?: boolean;
  debug?: boolean;
  max_turns?: number;
  execute_tools?: boolean;
}

export interface StreamChunk {
  delim?: 'start' | 'end';
  content?: string;
  role?: string;
  sender?: string;
  tool_calls?: any;
  response?: SwarmResponse;
}