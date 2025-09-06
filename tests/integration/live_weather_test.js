const { Swarm } = require('../../dist/index.js');
const { weatherAgent } = require('../../examples/weather_agent/agents.js');

const client = new Swarm();

async function testWeatherAgent() {
    console.log('Testing weather agent with live API...');
    
    try {
        // Test weather query
        const weatherResponse = await client.run({
            agent: weatherAgent,
            messages: [{ role: 'user', content: "What's the weather in New York?" }],
        });
        
        console.log('\nWeather Query Result:');
        console.log(weatherResponse.messages[weatherResponse.messages.length - 1].content);
        
        // Test email functionality
        const emailResponse = await client.run({
            agent: weatherAgent,
            messages: [{ role: 'user', content: "Send an email to john@example.com with subject 'Weather Update' and body 'It's sunny today!'" }],
        });
        
        console.log('\nEmail Query Result:');
        console.log(emailResponse.messages[emailResponse.messages.length - 1].content);
        
        console.log('\n✅ Weather agent live test completed successfully!');
        
    } catch (error) {
        console.error('❌ Weather agent test failed:', error);
        throw error;
    }
}

testWeatherAgent().catch(console.error);