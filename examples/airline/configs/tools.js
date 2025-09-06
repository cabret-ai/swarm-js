/**
 * Helper functions for airline customer service operations
 * These functions simulate various airline operations like refunds, flight changes, baggage search, etc.
 */

/**
 * Escalate the case to a human agent
 * @param {string} reason - Optional reason for escalation
 * @returns {string} Confirmation message
 */
function escalateToAgent(reason = null) {
    return reason ? `Escalating to agent: ${reason}` : "Escalating to agent";
}

/**
 * Check if customer is eligible to change their flight
 * @returns {string} Eligibility confirmation message
 */
function validToChangeFlight() {
    return "Customer is eligible to change flight";
}

/**
 * Process flight change request
 * @returns {string} Success confirmation message
 */
function changeFlight() {
    return "Flight was successfully changed!";
}

/**
 * Initiate refund process for customer
 * @returns {string} Refund initiation confirmation
 */
function initiateRefund() {
    const status = "Refund initiated";
    return status;
}

/**
 * Initiate flight credits for customer
 * @returns {string} Flight credits initiation confirmation
 */
function initiateFlightCredits() {
    const status = "Successfully initiated flight credits";
    return status;
}

/**
 * Mark case as resolved
 * @returns {string} Case resolution confirmation
 */
function caseResolved() {
    return "Case resolved. No further questions.";
}

/**
 * Initiate baggage search process
 * @returns {string} Baggage search result
 */
function initiateBaggageSearch() {
    return "Baggage was found!";
}

module.exports = {
    escalateToAgent,
    validToChangeFlight,
    changeFlight,
    initiateRefund,
    initiateFlightCredits,
    caseResolved,
    initiateBaggageSearch
};