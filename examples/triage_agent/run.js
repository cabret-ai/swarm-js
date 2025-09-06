const { Swarm, runDemoLoop } = require('../../dist/index.js');
const { triageAgent } = require('./agents.js');

console.log('🎯 Triage Agent Demo');
console.log('Ask about sales or refunds, and I\'ll route you to the right agent. Type "quit" to exit.\n');

runDemoLoop(triageAgent, {}, false, false).catch(console.error);