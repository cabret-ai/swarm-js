const { Swarm } = require('../../dist/index.js');
const { triageAgent } = require('../../examples/triage_agent/agents.js');

const client = new Swarm();

async function testTriageAgent() {
    console.log('Testing triage agent with live API...');
    
    try {
        // Test sales routing
        const salesResponse = await client.run({
            agent: triageAgent,
            messages: [{ role: 'user', content: "I want to talk to someone about buying some products" }],
        });
        
        console.log('\nSales Query Result:');
        console.log(salesResponse.messages[salesResponse.messages.length - 1].content);
        console.log('Active agent:', salesResponse.agent.name);
        
        // Test refunds routing
        const refundResponse = await client.run({
            agent: triageAgent,
            messages: [{ role: 'user', content: "I need to return item_123 because it was defective" }],
        });
        
        console.log('\nRefund Query Result:');
        console.log(refundResponse.messages[refundResponse.messages.length - 1].content);
        console.log('Active agent:', refundResponse.agent.name);
        
        console.log('\n✅ Triage agent live test completed successfully!');
        
    } catch (error) {
        console.error('❌ Triage agent test failed:', error);
        throw error;
    }
}

testTriageAgent().catch(console.error);