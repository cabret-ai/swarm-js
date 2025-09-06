const fs = require('fs');
const path = require('path');

// Check if file exists
const filePath = './examples/basic/simple_loop_no_helpers.js';
if (!fs.existsSync(filePath)) {
  console.error('File does not exist');
  process.exit(1);
}

// Try to require the dist module
try {
  const { Swarm, Agent } = require('../../dist/index.js');
  console.log('✓ Successfully imported Swarm and Agent from dist');
  
  // Test basic instantiation
  const client = new Swarm();
  const agent = new Agent({ name: 'Test', instructions: 'Test agent' });
  
  console.log('✓ Successfully created Swarm client and Agent');
  console.log('✓ File dependencies are working correctly');
  
  // Read and validate the created file content
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('const { Swarm, Agent }') && 
      content.includes('readline') &&
      content.includes('prettyPrintMessages') &&
      content.includes('async function main')) {
    console.log('✓ File contains expected structure and functions');
  } else {
    console.error('❌ File missing expected content');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log('🎉 All tests passed! The simple_loop_no_helpers.js file is ready to use.');