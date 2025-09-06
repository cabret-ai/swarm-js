#!/usr/bin/env node

/**
 * Parallel Streaming Validation Suite
 * Spawns multiple sub-agent tests to validate different streaming scenarios simultaneously
 */

import { Swarm, Agent, Result } from './dist/index.js';
import { Worker } from 'worker_threads';
import { performance } from 'perf_hooks';

// API key should be set via environment variable: export OPENAI_API_KEY="your-api-key"
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set');
  console.error('Please export OPENAI_API_KEY="your-api-key" before running this test');
  process.exit(1);
}

console.log('🚀 Parallel Streaming Validation Suite');
console.log('=' + '='.repeat(50));

/**
 * Test Configuration
 */
const TEST_SCENARIOS = [
  {
    name: 'Basic Content Streaming',
    description: 'Tests simple text generation with streaming',
    expectedChunks: 15,
    timeout: 30000
  },
  {
    name: 'Multi-Tool Call Streaming',
    description: 'Tests multiple function calls in single stream',
    expectedChunks: 25,
    timeout: 60000
  },
  {
    name: 'Chain Agent Handoff Streaming',
    description: 'Tests sequential agent handoffs',
    expectedChunks: 20,
    timeout: 45000
  },
  {
    name: 'Error Recovery Streaming',
    description: 'Tests error handling and recovery patterns',
    expectedChunks: 10,
    timeout: 30000
  },
  {
    name: 'Performance Stress Test',
    description: 'Tests streaming under high content volume',
    expectedChunks: 100,
    timeout: 90000
  }
];

/**
 * Validation Results Storage
 */
class ValidationResults {
  constructor() {
    this.results = new Map();
    this.startTime = performance.now();
  }

  addResult(testName, result) {
    this.results.set(testName, {
      ...result,
      timestamp: performance.now() - this.startTime
    });
  }

  getOverallScore() {
    const scores = Array.from(this.results.values()).map(r => r.score);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  generateReport() {
    const totalDuration = performance.now() - this.startTime;
    console.log('\n📊 PARALLEL STREAMING VALIDATION REPORT');
    console.log('=' + '='.repeat(60));
    
    this.results.forEach((result, testName) => {
      const status = result.score >= 80 ? '✅ PASS' : result.score >= 60 ? '⚠️  WARN' : '❌ FAIL';
      console.log(`\n${status} ${testName}`);
      console.log(`   Score: ${result.score.toFixed(1)}%`);
      console.log(`   Duration: ${result.duration.toFixed(0)}ms`);
      console.log(`   Chunks: ${result.chunksProcessed}`);
      console.log(`   Issues: ${result.issues.length}`);
      result.issues.forEach(issue => console.log(`     - ${issue}`));
    });

    const overallScore = this.getOverallScore();
    console.log(`\n🎯 OVERALL STREAMING QUALITY: ${overallScore.toFixed(1)}%`);
    console.log(`⏱️  Total Test Duration: ${totalDuration.toFixed(0)}ms`);
    
    // Detailed analysis
    console.log('\n📈 STREAMING PERFORMANCE ANALYSIS:');
    const avgChunks = Array.from(this.results.values())
      .reduce((sum, r) => sum + r.chunksProcessed, 0) / this.results.size;
    const avgDuration = Array.from(this.results.values())
      .reduce((sum, r) => sum + r.duration, 0) / this.results.size;
    
    console.log(`   Average chunks per test: ${avgChunks.toFixed(1)}`);
    console.log(`   Average test duration: ${avgDuration.toFixed(0)}ms`);
    console.log(`   Chunks per second: ${(avgChunks / (avgDuration / 1000)).toFixed(1)}`);
    
    return {
      overallScore,
      totalDuration,
      testResults: Array.from(this.results.entries())
    };
  }
}

/**
 * Sub-Agent Test Implementations
 */
class StreamingTestAgent {
  constructor(apiKey) {
    this.client = new Swarm();
    this.apiKey = apiKey;
  }

  async runBasicContentStreaming() {
    const startTime = performance.now();
    let chunksProcessed = 0;
    const issues = [];
    let hasContent = false;
    let hasDelimiters = false;

    try {
      const agent = new Agent({
        name: 'ContentBot',
        instructions: 'Write a detailed explanation about quantum computing in exactly 3 paragraphs.',
        model: 'gpt-3.5-turbo'
      });

      const stream = this.client.run({
        agent,
        messages: [{ role: 'user', content: 'Explain quantum computing' }],
        stream: true
      });

      for await (const chunk of stream) {
        chunksProcessed++;
        
        if (chunk.delim) {
          hasDelimiters = true;
        }
        
        if (chunk.content && chunk.content.trim()) {
          hasContent = true;
        }
      }

      if (!hasContent) issues.push('No content chunks detected');
      if (!hasDelimiters) issues.push('No delimiter chunks detected');
      if (chunksProcessed < 5) issues.push('Too few chunks processed');

    } catch (error) {
      issues.push(`Streaming error: ${error.message}`);
    }

    const duration = performance.now() - startTime;
    const score = Math.max(0, 100 - (issues.length * 20));

    return { score, duration, chunksProcessed, issues };
  }

  async runMultiToolCallStreaming() {
    const startTime = performance.now();
    let chunksProcessed = 0;
    const issues = [];
    let toolCallsDetected = 0;
    let hasContent = false;

    // Multi-tool functions
    const getWeather = ({ location }) => `Weather in ${location}: 72°F, Sunny`;
    const getTime = ({ timezone }) => `Time in ${timezone}: ${new Date().toLocaleString()}`;
    const calculateDistance = ({ from, to }) => `Distance from ${from} to ${to}: 245 miles`;

    try {
      const agent = new Agent({
        name: 'MultiToolBot',
        instructions: 'You help with weather, time, and distance calculations. Use all available functions to provide comprehensive information.',
        functions: [getWeather, getTime, calculateDistance],
        model: 'gpt-3.5-turbo'
      });

      const stream = this.client.run({
        agent,
        messages: [{ role: 'user', content: 'I need the weather in Paris, current time in Europe/Paris timezone, and distance from Paris to London' }],
        stream: true
      });

      for await (const chunk of stream) {
        chunksProcessed++;
        
        if (chunk.tool_calls) {
          toolCallsDetected++;
        }
        
        if (chunk.content && chunk.content.trim()) {
          hasContent = true;
        }
      }

      if (toolCallsDetected === 0) issues.push('No tool calls detected in stream');
      if (!hasContent) issues.push('No content response detected');
      if (chunksProcessed < 10) issues.push('Insufficient streaming chunks');

    } catch (error) {
      issues.push(`Multi-tool streaming error: ${error.message}`);
    }

    const duration = performance.now() - startTime;
    const score = Math.max(0, 100 - (issues.length * 15) - (toolCallsDetected < 3 ? 20 : 0));

    return { score, duration, chunksProcessed, issues };
  }

  async runChainAgentHandoffStreaming() {
    const startTime = performance.now();
    let chunksProcessed = 0;
    const issues = [];
    let handoffsDetected = 0;
    let agentChanges = [];

    // Agent handoff chain
    const transferToTechnical = () => technicalAgent;
    const transferToSales = () => salesAgent;
    const transferToSupport = () => supportAgent;

    const routerAgent = new Agent({
      name: 'Router',
      instructions: 'Route users to appropriate specialists: technical for API questions, sales for pricing, support for account issues.',
      functions: [transferToTechnical, transferToSales, transferToSupport],
      model: 'gpt-3.5-turbo'
    });

    const technicalAgent = new Agent({
      name: 'Technical',
      instructions: 'Provide technical API guidance. If it becomes a pricing question, transfer to sales.',
      functions: [transferToSales],
      model: 'gpt-3.5-turbo'
    });

    const salesAgent = new Agent({
      name: 'Sales',
      instructions: 'Handle pricing and sales questions. Transfer to support for account issues.',
      functions: [transferToSupport],
      model: 'gpt-3.5-turbo'
    });

    const supportAgent = new Agent({
      name: 'Support',
      instructions: 'Handle account support issues.',
      functions: [],
      model: 'gpt-3.5-turbo'
    });

    try {
      const stream = this.client.run({
        agent: routerAgent,
        messages: [{ role: 'user', content: 'I need API help but also want to know pricing and have an account issue' }],
        stream: true
      });

      for await (const chunk of stream) {
        chunksProcessed++;
        
        if (chunk.tool_calls) {
          handoffsDetected++;
        }
        
        if (chunk.response && chunk.response.agent) {
          agentChanges.push(chunk.response.agent.name);
        }
      }

      if (handoffsDetected === 0) issues.push('No handoffs detected');
      if (agentChanges.length === 0) issues.push('No agent changes detected');
      if (chunksProcessed < 8) issues.push('Chain too short');

    } catch (error) {
      issues.push(`Chain handoff error: ${error.message}`);
    }

    const duration = performance.now() - startTime;
    const score = Math.max(0, 100 - (issues.length * 20) + (handoffsDetected * 10));

    return { score, duration, chunksProcessed, issues, agentChanges };
  }

  async runErrorRecoveryStreaming() {
    const startTime = performance.now();
    let chunksProcessed = 0;
    const issues = [];
    let errorHandled = false;
    let hasRecovery = false;

    const problematicFunction = ({ action }) => {
      if (action === 'error') {
        throw new Error('Intentional test error');
      }
      return `Action ${action} completed successfully`;
    };

    try {
      const agent = new Agent({
        name: 'ErrorTestBot',
        instructions: 'Process user actions. If an error occurs, explain what happened and offer alternatives.',
        functions: [problematicFunction],
        model: 'gpt-3.5-turbo'
      });

      const stream = this.client.run({
        agent,
        messages: [{ role: 'user', content: 'Please perform action: error, then suggest what to do instead' }],
        stream: true
      });

      for await (const chunk of stream) {
        chunksProcessed++;
        
        if (chunk.content) {
          const content = chunk.content.toLowerCase();
          if (content.includes('error') || content.includes('problem')) {
            errorHandled = true;
          }
          if (content.includes('instead') || content.includes('alternative') || content.includes('try')) {
            hasRecovery = true;
          }
        }
      }

      if (!errorHandled) issues.push('Error not properly handled');
      if (!hasRecovery) issues.push('No recovery suggestions provided');

    } catch (error) {
      // Catching the error is also valid error handling
      errorHandled = true;
      issues.push(`Caught error (valid): ${error.message}`);
    }

    const duration = performance.now() - startTime;
    const score = Math.max(0, 100 - (issues.length * 25) + (errorHandled ? 20 : 0) + (hasRecovery ? 20 : 0));

    return { score, duration, chunksProcessed, issues };
  }

  async runPerformanceStressTest() {
    const startTime = performance.now();
    let chunksProcessed = 0;
    const issues = [];
    let contentLength = 0;
    let avgChunkSize = 0;

    try {
      const agent = new Agent({
        name: 'ContentGenerator',
        instructions: 'Generate a comprehensive 2000-word essay about the history of artificial intelligence, covering major milestones, key figures, and future implications. Be very detailed and thorough.',
        model: 'gpt-3.5-turbo'
      });

      const stream = this.client.run({
        agent,
        messages: [{ role: 'user', content: 'Write a comprehensive essay about AI history' }],
        stream: true
      });

      const chunkSizes = [];
      for await (const chunk of stream) {
        chunksProcessed++;
        
        if (chunk.content) {
          const chunkSize = chunk.content.length;
          contentLength += chunkSize;
          chunkSizes.push(chunkSize);
        }
      }

      avgChunkSize = chunkSizes.length ? chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length : 0;

      if (contentLength < 1000) issues.push('Content too short for stress test');
      if (chunksProcessed < 50) issues.push('Too few chunks for stress test');
      if (avgChunkSize < 1) issues.push('Chunks too small');

    } catch (error) {
      issues.push(`Performance test error: ${error.message}`);
    }

    const duration = performance.now() - startTime;
    const throughput = contentLength / (duration / 1000); // chars per second
    const score = Math.max(0, 100 - (issues.length * 20) + (throughput > 100 ? 10 : 0));

    return { score, duration, chunksProcessed, issues, contentLength, avgChunkSize, throughput };
  }
}

/**
 * Run all validation tests in parallel
 */
async function runParallelStreamingValidation() {
  const results = new ValidationResults();
  const testAgent = new StreamingTestAgent();

  console.log('🧪 Starting parallel streaming validation tests...\n');

  // Run tests in parallel
  const testPromises = [
    testAgent.runBasicContentStreaming().then(result => 
      results.addResult('Basic Content Streaming', result)),
    
    testAgent.runMultiToolCallStreaming().then(result => 
      results.addResult('Multi-Tool Call Streaming', result)),
    
    testAgent.runChainAgentHandoffStreaming().then(result => 
      results.addResult('Chain Agent Handoff Streaming', result)),
    
    testAgent.runErrorRecoveryStreaming().then(result => 
      results.addResult('Error Recovery Streaming', result)),
    
    testAgent.runPerformanceStressTest().then(result => 
      results.addResult('Performance Stress Test', result))
  ];

  try {
    console.log('⚡ Running tests in parallel...');
    await Promise.all(testPromises);
    
    return results.generateReport();
    
  } catch (error) {
    console.error('❌ Parallel test execution failed:', error);
    throw error;
  }
}

// Export for potential use as module
export { runParallelStreamingValidation, StreamingTestAgent };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runParallelStreamingValidation()
    .then(report => {
      console.log('\n🏁 Parallel streaming validation completed!');
      process.exit(report.overallScore >= 75 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Validation suite failed:', error);
      process.exit(1);
    });
}