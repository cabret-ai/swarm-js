// Mock OpenAI client for testing
// Based on Python tests/mock_client.py

export interface MockToolCall {
  name: string;
  args: Record<string, any>;
}

export interface MockMessage {
  role: string;
  content: string;
}

export function createMockResponse(
  message: MockMessage,
  functionCalls: MockToolCall[] = [],
  model: string = 'gpt-4o'
): any {
  const role = message.role || 'assistant';
  const content = message.content || '';
  
  const toolCalls = functionCalls.length > 0 
    ? functionCalls.map(call => ({
        id: 'mock_tc_id',
        type: 'function' as const,
        function: {
          name: call.name,
          arguments: JSON.stringify(call.args),
        },
      }))
    : null;

  return {
    id: 'mock_cc_id',
    created: 1234567890,
    model,
    object: 'chat.completion',
    choices: [{
      message: {
        role,
        content,
        tool_calls: toolCalls,
      },
      finish_reason: 'stop',
      index: 0,
    }],
  };
}

export function createMockStreamResponse(chunks: any[]): AsyncIterable<any> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}

export class MockOpenAIClient {
  private responses: any[] = [];
  private streamResponses: any[][] = [];
  private currentIndex = 0;
  private currentStreamIndex = 0;

  public chat = {
    completions: {
      create: jest.fn().mockImplementation((params: any) => {
        if (params.stream) {
          return this.getStreamResponse();
        }
        
        if (this.responses.length === 1) {
          return this.responses[0];
        }
        if (this.currentIndex < this.responses.length) {
          return this.responses[this.currentIndex++];
        }
        throw new Error('No more mock responses available');
      }),
    },
  };

  private getStreamResponse(): AsyncIterable<any> {
    if (this.streamResponses.length === 1) {
      return createMockStreamResponse(this.streamResponses[0]);
    }
    if (this.currentStreamIndex < this.streamResponses.length) {
      return createMockStreamResponse(this.streamResponses[this.currentStreamIndex++]);
    }
    throw new Error('No more mock stream responses available');
  }

  setResponse(response: any): void {
    this.responses = [response];
    this.currentIndex = 0;
  }

  setSequentialResponses(responses: any[]): void {
    this.responses = responses;
    this.currentIndex = 0;
  }

  setStreamResponse(chunks: any[]): void {
    this.streamResponses = [chunks];
    this.currentStreamIndex = 0;
  }

  setSequentialStreamResponses(streamResponses: any[][]): void {
    this.streamResponses = streamResponses;
    this.currentStreamIndex = 0;
  }

  assertCreateCalledWith(expectedArgs: any): void {
    expect(this.chat.completions.create).toHaveBeenCalledWith(expectedArgs);
  }
}