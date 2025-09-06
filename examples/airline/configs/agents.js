const { Agent } = require('../../../dist/index.js');
const {
    escalateToAgent,
    validToChangeFlight,
    changeFlight,
    initiateRefund,
    initiateFlightCredits,
    caseResolved,
    initiateBaggageSearch
} = require('./tools.js');

const { STARTER_PROMPT } = require('../data/routines/prompts.js');
const { LOST_BAGGAGE_POLICY } = require('../data/routines/baggage/policies.js');
const {
    FLIGHT_CANCELLATION_POLICY,
    FLIGHT_CHANGE_POLICY
} = require('../data/routines/flight_modification/policies.js');

// Agent transfer functions
function transferToFlightModification() {
    return flightModification;
}

function transferToFlightCancel() {
    return flightCancel;
}

function transferToFlightChange() {
    return flightChange;
}

function transferToLostBaggage() {
    return lostBaggage;
}

function transferToTriage() {
    /**
     * Call this function when a user needs to be transferred to a different agent and a different policy.
     * For instance, if a user is asking about a topic that is not handled by the current agent, call this function.
     */
    return triageAgent;
}

function triageInstructions(contextVariables) {
    const customerContext = contextVariables.customer_context || null;
    const flightContext = contextVariables.flight_context || null;
    return `You are to triage a users request, and call a tool to transfer to the right intent.
    Once you are ready to transfer to the right intent, call the tool to transfer to the right intent.
    You dont need to know specifics, just the topic of the request.
    When you need more information to triage the request to an agent, ask a direct question without explaining why you're asking it.
    Do not share your thought process with the user! Do not make unreasonable assumptions on behalf of user.
    The customer context is here: ${customerContext}, and flight context is here: ${flightContext}`;
}

// Create all agents
const triageAgent = new Agent({
    name: "Triage Agent",
    instructions: triageInstructions,
    functions: [transferToFlightModification, transferToLostBaggage]
});

const flightModification = new Agent({
    name: "Flight Modification Agent",
    instructions: `You are a Flight Modification Agent for a customer service airlines company.
      You are an expert customer service agent deciding which sub intent the user should be referred to.
You already know the intent is for flight modification related question. First, look at message history and see if you can determine if the user wants to cancel or change their flight.
Ask user clarifying questions until you know whether or not it is a cancel request or change flight request. Once you know, call the appropriate transfer function. Either ask clarifying questions, or call one of your functions, every time.`,
    functions: [transferToFlightCancel, transferToFlightChange],
    parallelToolCalls: false
});

const flightCancel = new Agent({
    name: "Flight cancel traversal",
    instructions: STARTER_PROMPT + FLIGHT_CANCELLATION_POLICY,
    functions: [
        escalateToAgent,
        initiateRefund,
        initiateFlightCredits,
        transferToTriage,
        caseResolved
    ]
});

const flightChange = new Agent({
    name: "Flight change traversal",
    instructions: STARTER_PROMPT + FLIGHT_CHANGE_POLICY,
    functions: [
        escalateToAgent,
        changeFlight,
        validToChangeFlight,
        transferToTriage,
        caseResolved
    ]
});

const lostBaggage = new Agent({
    name: "Lost baggage traversal",
    instructions: STARTER_PROMPT + LOST_BAGGAGE_POLICY,
    functions: [
        escalateToAgent,
        initiateBaggageSearch,
        transferToTriage,
        caseResolved
    ]
});

module.exports = {
    triageAgent,
    flightModification,
    flightCancel,
    flightChange,
    lostBaggage,
    transferToFlightModification,
    transferToFlightCancel,
    transferToFlightChange,
    transferToLostBaggage,
    transferToTriage
};