const { Swarm, Agent, runDemoLoop } = require('../../dist/index.js');

const knowledgeBase = {
    'billing': {
        title: 'Billing Information',
        content: 'For billing questions, please check your account dashboard or contact our billing department at billing@company.com',
        url: 'https://help.company.com/billing'
    },
    'account': {
        title: 'Account Management',
        content: 'To manage your account, log into your dashboard and navigate to Account Settings. You can update personal information, change passwords, and manage preferences.',
        url: 'https://help.company.com/account'
    },
    'technical': {
        title: 'Technical Support',
        content: 'For technical issues, please restart your device first. If the problem persists, contact our technical support team.',
        url: 'https://help.company.com/technical'
    },
    'refund': {
        title: 'Refund Policy',
        content: 'We offer full refunds within 30 days of purchase. Please contact customer service with your order number.',
        url: 'https://help.company.com/refunds'
    }
};

function queryDocs(query) {
    /**
     * Query the simple knowledge base for relevant articles.
     */
    console.log(`Searching knowledge base with query: ${query}`);
    
    const queryLower = query.toLowerCase();
    
    for (const [key, article] of Object.entries(knowledgeBase)) {
        if (queryLower.includes(key) || queryLower.includes(article.title.toLowerCase())) {
            console.log(`Found relevant article: ${article.title}`);
            return { 
                response: `Title: ${article.title}\nContent: ${article.content}\nURL: ${article.url}` 
            };
        }
    }
    
    console.log("No specific results found, providing general help");
    return { 
        response: "I couldn't find a specific answer to your question. Please contact our customer service team or try rephrasing your question." 
    };
}

function sendEmail(email_address, message) {
    /**
     * Send an email to the user.
     */
    const response = `Email sent to: ${email_address} with message: ${message}`;
    console.log(response);
    return { response: response };
}

function submitTicket(description) {
    /**
     * Submit a ticket for the user.
     */
    const ticketNumber = Math.floor(Math.random() * 100000);
    const response = `Ticket #${ticketNumber} created for: ${description}`;
    console.log(response);
    return { response: response };
}

function transferToHelpCenter() {
    /**
     * Transfer the user to the help center agent.
     */
    return helpCenterAgent;
}

const userInterfaceAgent = new Agent({
    name: "User Interface Agent",
    instructions: "You are a user interface agent that handles all interactions with the user. You are helpful and friendly. If the user has specific questions about billing, account management, technical issues, or refunds, transfer them to the help center agent.",
    functions: [transferToHelpCenter]
});

const helpCenterAgent = new Agent({
    name: "Help Center Agent", 
    instructions: "You are a customer service help center agent. Use the queryDocs function to search for relevant information, submit tickets for complex issues, and send emails when necessary. Always be helpful and professional.",
    functions: [queryDocs, submitTicket, sendEmail]
});

async function startCustomerServiceDemo() {
    console.log('\n🎧 Customer Service Demo');
    console.log('I can help you with billing, account, technical issues, and refunds. Type "quit" to exit.\n');
    
    try {
        await runDemoLoop(userInterfaceAgent, {}, false, false);
    } catch (error) {
        console.error('Error in demo loop:', error);
    }
}

module.exports = {
    queryDocs,
    sendEmail,
    submitTicket,
    transferToHelpCenter,
    userInterfaceAgent,
    helpCenterAgent,
    startCustomerServiceDemo,
    knowledgeBase
};

if (require.main === module) {
    startCustomerServiceDemo().catch(console.error);
}