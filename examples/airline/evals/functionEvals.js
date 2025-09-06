const {
    triageAgent,
    flightModification
} = require('../configs/agents.js');
const { runFunctionEvals } = require('./evalUtils.js');

// Test cases for triage agent
const triageTestCases = [
    {
        conversation: [
            { role: 'user', content: 'I need to change my flight' }
        ],
        function: 'transferToFlightModification'
    },
    {
        conversation: [
            { role: 'user', content: 'My luggage is missing' }
        ],
        function: 'transferToLostBaggage'
    },
    {
        conversation: [
            { role: 'user', content: 'I want to cancel my booking' }
        ],
        function: 'transferToFlightModification'
    },
    {
        conversation: [
            { role: 'user', content: 'Help me with my lost baggage claim' }
        ],
        function: 'transferToLostBaggage'
    },
    {
        conversation: [
            { role: 'user', content: 'I need assistance with flight modifications' }
        ],
        function: 'transferToFlightModification'
    }
];

// Test cases for flight modification agent
const flightModificationCases = [
    {
        conversation: [
            { role: 'user', content: 'I want to cancel my flight and get a refund' }
        ],
        function: 'transferToFlightCancel'
    },
    {
        conversation: [
            { role: 'user', content: 'I need to change my flight to tomorrow' }
        ],
        function: 'transferToFlightChange'
    },
    {
        conversation: [
            { role: 'user', content: 'Can I get my money back for this flight?' }
        ],
        function: 'transferToFlightCancel'
    },
    {
        conversation: [
            { role: 'user', content: 'I want to move my flight to a different date' }
        ],
        function: 'transferToFlightChange'
    },
    {
        conversation: [
            { role: 'user', content: 'Please cancel my reservation' }
        ],
        function: 'transferToFlightCancel'
    }
];

const n = 5;

async function main() {
    try {
        // Create eval results directory if it doesn't exist
        const fs = require('fs');
        if (!fs.existsSync('eval_results')) {
            fs.mkdirSync('eval_results');
        }

        console.log('🧪 Running Airline Agent Evaluations\n');

        // Run triage agent evaluations
        console.log('📋 Running Triage Agent Evaluations...');
        await runFunctionEvals(
            triageAgent,
            triageTestCases,
            n,
            'eval_results/triage_evals.json'
        );

        console.log('\n' + '='.repeat(80) + '\n');

        // Run flight modification evaluations
        console.log('✈️ Running Flight Modification Agent Evaluations...');
        await runFunctionEvals(
            flightModification,
            flightModificationCases,
            n,
            'eval_results/flight_modification_evals.json'
        );

        console.log('\n✅ All evaluations completed!');
        console.log('📊 Results saved to eval_results/ directory');

    } catch (error) {
        console.error('❌ Error running evaluations:', error.message);
        if (error.message.includes('API key')) {
            console.log('💡 Make sure OPENAI_API_KEY environment variable is set');
        }
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    triageTestCases,
    flightModificationCases
};