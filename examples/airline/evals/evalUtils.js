const { Swarm } = require('../../../dist/index.js');
const crypto = require('crypto');

// Simple UUID replacement using crypto
function uuidv4() {
    return crypto.randomUUID();
}

/**
 * Utility functions for running and evaluating agent performance
 */

/**
 * Extract response information from Swarm response
 * @param {Object} response - Swarm response object
 * @returns {Object} Extracted response info with tool_calls or message
 */
function extractResponseInfo(response) {
    const results = {};
    
    for (const message of response.messages) {
        if (message.role === 'tool') {
            results.tool_calls = message.tool_name;
            break;
        } else if (!message.tool_calls) {
            results.message = message.content;
        }
    }
    
    return results;
}

/**
 * Run function evaluation tests
 * @param {Agent} agent - The agent to test
 * @param {Array} testCases - Array of test cases
 * @param {number} n - Number of iterations per test case
 * @param {string} evalPath - Path to save evaluation results (optional)
 * @returns {number} Overall accuracy percentage
 */
async function runFunctionEvals(agent, testCases, n = 1, evalPath = null) {
    let correctFunction = 0;
    const results = [];
    const evalId = uuidv4();
    const evalTimestamp = new Date().toISOString();
    const client = new Swarm();

    for (const testCase of testCases) {
        let caseCorrect = 0;
        const caseResults = {
            messages: testCase.conversation,
            expected_function: testCase.function,
            actual_function: [],
            actual_message: []
        };

        console.log('--'.repeat(50));
        console.log(`\x1b[94mConversation: \x1b[0m${JSON.stringify(testCase.conversation)}\n`);

        for (let i = 0; i < n; i++) {
            console.log(`\x1b[90mIteration: ${i + 1}/${n}\x1b[0m`);
            
            const response = await client.run({
                agent: agent,
                messages: testCase.conversation,
                maxTurns: 1
            });

            const output = extractResponseInfo(response);
            const actualFunction = output.tool_calls || 'None';
            const actualMessage = output.message || 'None';

            caseResults.actual_function.push(actualFunction);
            caseResults.actual_message.push(actualMessage);

            if (output.tool_calls) {
                console.log(`\x1b[95mExpected function: \x1b[0m ${testCase.function}, \x1b[95mGot: \x1b[0m${output.tool_calls}\n`);
                if (output.tool_calls === testCase.function) {
                    caseCorrect++;
                    correctFunction++;
                }
            } else if (output.message) {
                console.log(`\x1b[95mExpected function: \x1b[0m ${testCase.function}, \x1b[95mGot: \x1b[0mNone`);
                console.log(`\x1b[90mMessage: ${output.message}\x1b[0m\n`);
                if (testCase.function === 'None') {
                    caseCorrect++;
                    correctFunction++;
                }
            }
        }

        const caseAccuracy = (caseCorrect / n) * 100;
        caseResults.case_accuracy = `${caseAccuracy.toFixed(2)}%`;
        results.push(caseResults);

        console.log(`\x1b[92mCorrect functions for this case: ${caseCorrect} out of ${n}\x1b[0m`);
        console.log(`\x1b[93mAccuracy for this case: ${caseAccuracy.toFixed(2)}%\x1b[0m`);
    }

    const overallAccuracy = (correctFunction / (testCases.length * n)) * 100;
    console.log('**'.repeat(50));
    console.log(`\n\x1b[92mOVERALL: Correct functions selected: ${correctFunction} out of ${testCases.length * n}\x1b[0m`);
    console.log(`\x1b[93mOVERALL: Accuracy: ${overallAccuracy.toFixed(2)}%\x1b[0m`);

    const finalResult = {
        id: evalId,
        timestamp: evalTimestamp,
        results: results,
        correct_evals: correctFunction,
        total_evals: testCases.length * n,
        overall_accuracy_percent: `${overallAccuracy.toFixed(2)}%`
    };

    if (evalPath) {
        const fs = require('fs');
        let existingData = [];
        
        try {
            const fileContent = fs.readFileSync(evalPath, 'utf8');
            existingData = JSON.parse(fileContent);
        } catch (error) {
            // File doesn't exist or is invalid, start with empty array
            existingData = [];
        }

        if (!Array.isArray(existingData)) {
            existingData = [existingData];
        }

        existingData.push(finalResult);

        fs.writeFileSync(evalPath, JSON.stringify(existingData, null, 4));
    }

    return overallAccuracy;
}

module.exports = {
    runFunctionEvals,
    extractResponseInfo
};