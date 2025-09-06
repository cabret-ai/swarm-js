const { Agent } = require('../../dist/index.js');

/**
 * Get the current weather in a given location. Location MUST be a city.
 * @param {Object} params - The parameters object
 * @param {string} params.location - The city to get weather for
 * @param {string} [params.time="now"] - The time to get weather for
 * @returns {string} JSON string containing weather information
 */
function getWeather({ location, time = "now" }) {
    return JSON.stringify({ 
        location: location, 
        temperature: "65", 
        time: time 
    });
}

/**
 * Send an email to a recipient
 * @param {Object} params - The parameters object
 * @param {string} params.recipient - The email recipient
 * @param {string} params.subject - The email subject
 * @param {string} params.body - The email body
 * @returns {string} Confirmation message
 */
function sendEmail({ recipient, subject, body }) {
    console.log("Sending email...");
    console.log(`To: ${recipient}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    return "Sent!";
}

const weatherAgent = new Agent({
    name: "Weather Agent",
    instructions: "You are a helpful agent.",
    functions: [getWeather, sendEmail],
});

module.exports = {
    weatherAgent,
    getWeather,
    sendEmail
};