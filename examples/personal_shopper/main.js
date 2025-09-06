const { Swarm, Agent, runDemoLoop } = require('../../dist/index.js');
const database = require('./database.js');

const client = new Swarm();

function refundItem(user_id, item_id) {
    /**
     * Initiate a refund based on the user ID and item ID.
     * Takes as input arguments in the format '{"user_id":"1","item_id":"3"}'
     */
    const conn = database.getConnection();
    const stmt = conn.prepare(`
        SELECT amount FROM PurchaseHistory
        WHERE user_id = ? AND item_id = ?
    `);
    const result = stmt.get(user_id, item_id);
    
    if (result) {
        const amount = result.amount;
        console.log(`Refunding $${amount} to user ID ${user_id} for item ID ${item_id}.`);
    } else {
        console.log(`No purchase found for user ID ${user_id} and item ID ${item_id}.`);
    }
    console.log("Refund initiated");
    return "Refund initiated successfully";
}

function notifyCustomer(user_id, method) {
    /**
     * Notify a customer by their preferred method of either phone or email.
     * Takes as input arguments in the format '{"user_id":"1","method":"email"}'
     */
    const conn = database.getConnection();
    const stmt = conn.prepare(`
        SELECT email, phone FROM Users
        WHERE user_id = ?
    `);
    const user = stmt.get(user_id);
    
    if (user) {
        const { email, phone } = user;
        if (method === "email" && email) {
            console.log(`Emailed customer ${email} a notification.`);
            return `Emailed customer ${email} a notification.`;
        } else if (method === "phone" && phone) {
            console.log(`Texted customer ${phone} a notification.`);
            return `Texted customer ${phone} a notification.`;
        } else {
            const message = `No ${method} contact available for user ID ${user_id}.`;
            console.log(message);
            return message;
        }
    } else {
        const message = `User ID ${user_id} not found.`;
        console.log(message);
        return message;
    }
}

function orderItem(user_id, product_id) {
    /**
     * Place an order for a product based on the user ID and product ID.
     * Takes as input arguments in the format '{"user_id":"1","product_id":"2"}'
     */
    const dateOfPurchase = new Date().toISOString();
    const itemId = Math.floor(Math.random() * 300) + 1;
    
    const conn = database.getConnection();
    const stmt = conn.prepare(`
        SELECT product_id, product_name, price FROM Products
        WHERE product_id = ?
    `);
    const result = stmt.get(product_id);
    
    if (result) {
        const { product_id: productId, product_name: productName, price } = result;
        console.log(`Ordering product ${productName} for user ID ${user_id}. The price is ${price}.`);
        
        // Add the purchase to the database
        database.addPurchase(user_id, dateOfPurchase, itemId, price);
        return `Successfully ordered ${productName} for $${price}`;
    } else {
        const message = `Product ${product_id} not found.`;
        console.log(message);
        return message;
    }
}

function createTriageAgent(name, instructions, agents, addBacklinks = true) {
    const transferFunctions = [];
    
    agents.forEach(agent => {
        const functionName = `transferTo${agent.name.replace(/\s+/g, '')}`;
        const transferFunction = function() {
            return agent;
        };
        
        Object.defineProperty(transferFunction, 'name', { value: functionName });
        transferFunction.description = `Transfer to ${agent.name}`;
        
        transferFunctions.push(transferFunction);
    });
    
    if (addBacklinks) {
        const transferBackToTriage = function() {
            return triageAgent; 
        };
        Object.defineProperty(transferBackToTriage, 'name', { value: 'transferBackToTriage' });
        transferBackToTriage.description = 'Transfer back to triage agent';
        
        agents.forEach(agent => {
            agent.functions.push(transferBackToTriage);
        });
    }
    
    return new Agent({
        name: name,
        instructions: instructions,
        functions: transferFunctions
    });
}

database.initializeDatabase();

console.log("Database initialized. Previewing tables:");
database.previewTable("Users");
database.previewTable("PurchaseHistory");
database.previewTable("Products");

const refundsAgent = new Agent({
    name: "Refunds Agent",
    instructions: `You are a refund agent that handles all actions related to refunds after a return has been processed.
    You must ask for both the user ID and item ID to initiate a refund. Ask for both user_id and item_id in one message.
    If the user asks you to notify them, you must ask them what their preferred method of notification is. For notifications, you must
    ask them for user_id and method in one message.`,
    functions: [refundItem, notifyCustomer]
});

const salesAgent = new Agent({
    name: "Sales Agent", 
    instructions: `You are a sales agent that handles all actions related to placing an order to purchase an item.
    Regardless of what the user wants to purchase, must ask for BOTH the user ID and product ID to place an order.
    An order cannot be placed without these two pieces of information. Ask for both user_id and product_id in one message.
    If the user asks you to notify them, you must ask them what their preferred method is. For notifications, you must
    ask them for user_id and method in one message.`,
    functions: [orderItem, notifyCustomer]
});

const triageAgent = createTriageAgent(
    "Triage Agent",
    `You are to triage a users request, and call a tool to transfer to the right intent.
    Once you are ready to transfer to the right intent, call the tool to transfer to the right intent.
    You dont need to know specifics, just the topic of the request.
    If the user request is about making an order or purchasing an item, transfer to the Sales Agent.
    If the user request is about getting a refund on an item or returning a product, transfer to the Refunds Agent.
    When you need more information to triage the request to an agent, ask a direct question without explaining why you're asking it.
    Do not share your thought process with the user! Do not make unreasonable assumptions on behalf of user.`,
    [salesAgent, refundsAgent],
    true
);

console.log("\nTriage Agent Functions:");
triageAgent.functions.forEach(f => {
    console.log(f.name);
});

async function startPersonalShopperDemo() {
    console.log('\n🛍️  Personal Shopper Demo');
    console.log('I can help you with orders and refunds. Type "quit" to exit.\n');
    
    try {
        await runDemoLoop(triageAgent, {}, false, false);
    } finally {
        database.closeConnection();
    }
}

module.exports = {
    refundItem,
    notifyCustomer,
    orderItem,
    triageAgent,
    salesAgent,
    refundsAgent,
    startPersonalShopperDemo
};

if (require.main === module) {
    startPersonalShopperDemo().catch(console.error);
}