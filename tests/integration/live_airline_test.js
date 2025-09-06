const { Swarm } = require('../../dist/index.js');
const { triageAgent } = require('../../examples/airline/configs/agents.js');

const client = new Swarm();

async function testAirlineAgent() {
    console.log('Testing airline agent with live API...');
    
    const contextVariables = {
        customer_context: `Here is what you know about the customer's details:
1. CUSTOMER_ID: customer_12345
2. NAME: John Doe
3. PHONE_NUMBER: (123) 456-7890
4. EMAIL: johndoe@example.com
5. STATUS: Premium
6. ACCOUNT_STATUS: Active
7. BALANCE: $0.00
8. LOCATION: 1234 Main St, San Francisco, CA 94123, USA`,
        flight_context: `The customer has an upcoming flight from LGA (Laguardia) in NYC to LAX in Los Angeles.
The flight # is 1919. The flight departure date is 3pm ET, 5/21/2024.`
    };
    
    try {
        // Test basic airline query
        const response = await client.run({
            agent: triageAgent,
            messages: [{ role: 'user', content: "I need to change my flight time from 3pm to 6pm" }],
            context_variables: contextVariables
        });
        
        console.log('\nAirline Query Result:');
        console.log(response.messages[response.messages.length - 1].content);
        console.log('Active agent:', response.agent.name);
        
        console.log('\n✅ Airline agent live test completed successfully!');
        
    } catch (error) {
        console.error('❌ Airline agent test failed:', error);
        throw error;
    }
}

testAirlineAgent().catch(console.error);