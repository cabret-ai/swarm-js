const { Swarm, runDemoLoop } = require('../../dist/index.js');
const { weatherAgent } = require('./agents.js');

console.log('🌤️  Weather Agent Demo');
console.log('Type your questions about weather or email sending. Type "quit" to exit.\n');

// Start the demo using the new REPL
runDemoLoop(weatherAgent, {}, false, false).catch(console.error);