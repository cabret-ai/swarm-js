// Main entry point for Swarm JavaScript implementation

export { Swarm } from './swarm';
export { Agent, Result } from './types';
export type { 
  SwarmResponse, 
  SwarmRunOptions, 
  ChatCompletionMessage, 
  ToolCall, 
  AgentFunction, 
  AgentConfig,
  StreamChunk
} from './types';

// REPL functionality
export { 
  runDemoLoop, 
  processAndPrintStreamingResponse, 
  prettyPrintMessages 
} from './repl/repl';