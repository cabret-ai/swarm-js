const { Agent } = require('../../dist/index.js');

/**
 * Refund an item. Make sure you have the item_id of the form item_... Ask for user confirmation before processing the refund.
 */
function processRefund(itemId, reason = "NOT SPECIFIED") {
    console.log(`[mock] Refunding item ${itemId} because ${reason}...`);
    return "Success!";
}

/**
 * Apply a discount to the user's cart.
 */
function applyDiscount() {
    console.log("[mock] Applying discount...");
    return "Applied discount of 11%";
}

const triageAgent = new Agent({
    name: "Triage Agent",
    instructions: "Determine which agent is best suited to handle the user's request, and transfer the conversation to that agent."
});

const salesAgent = new Agent({
    name: "Sales Agent",
    instructions: "Be super enthusiastic about selling bees."
});

const refundsAgent = new Agent({
    name: "Refunds Agent",
    instructions: "Help the user with a refund. If the reason is that it was too expensive, offer the user a refund code. If they insist, then process the refund.",
    functions: [processRefund, applyDiscount]
});

/**
 * Call this function if a user is asking about a topic that is not handled by the current agent.
 */
function transferBackToTriage() {
    return triageAgent;
}

function transferToSales() {
    return salesAgent;
}

function transferToRefunds() {
    return refundsAgent;
}

triageAgent.functions = [transferToSales, transferToRefunds];
salesAgent.functions = [transferBackToTriage];
refundsAgent.functions = [...refundsAgent.functions, transferBackToTriage];

module.exports = {
    triageAgent,
    salesAgent,
    refundsAgent,
    processRefund,
    applyDiscount,
    transferBackToTriage,
    transferToSales,
    transferToRefunds
};