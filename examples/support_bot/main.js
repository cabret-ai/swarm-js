const OpenAI = require('openai');
const { QdrantClient } = require('@qdrant/js-client-rest');
const { Swarm, Agent, runDemoLoop } = require('../../dist/index.js');

const client = new OpenAI();
const qdrant = new QdrantClient({ 
    host: 'localhost', 
    port: 6333,
    checkCompatibility: false
});

const EMBEDDING_MODEL = "text-embedding-3-large";

const collectionName = "help_center";

async function queryQdrant(query, collection_name, vector_name = "article", top_k = 5) {
    // Creates embedding vector from user query
    const embeddingResponse = await client.embeddings.create({
        input: query,
        model: EMBEDDING_MODEL,
    });
    
    const embedded_query = embeddingResponse.data[0].embedding;

    const query_results = await qdrant.search(collection_name, {
        vector: {
            name: vector_name,
            vector: embedded_query
        },
        limit: top_k,
    });

    return query_results;
}

async function queryDocs(query) {
    /**
     * Query the knowledge base for relevant articles.
     */
    console.log(`Searching knowledge base with query: ${query}`);
    
    try {
        const query_results = await queryQdrant(query, collectionName);
        const output = [];

        for (let i = 0; i < query_results.length; i++) {
            const article = query_results[i];
            const title = article.payload.title;
            const text = article.payload.text;
            const url = article.payload.url;

            output.push([title, text, url]);
        }

        if (output.length > 0) {
            const [title, content, _] = output[0];
            const response = `Title: ${title}\nContent: ${content}`;
            const truncated_content = content.replace(/\s+/g, ' ').substring(0, 50) + (content.length > 50 ? '...' : '');
            console.log("Most relevant article title:", truncated_content);
            return { response: response };
        } else {
            console.log("No results");
            return { response: "No results found." };
        }
    } catch (error) {
        console.error("Error querying docs:", error);
        return { response: "Error searching knowledge base." };
    }
}

function sendEmail(email_address, message) {
    /**
     * Send an email to the user.
     */
    const response = `Email sent to: ${email_address} with message: ${message}`;
    return { response: response };
}

function submitTicket(description) {
    /**
     * Submit a ticket for the user.
     */
    return { response: `Ticket created for ${description}` };
}

function transferToHelpCenter() {
    /**
     * Transfer the user to the help center agent.
     */
    return helpCenterAgent;
}

// Define the agents
const userInterfaceAgent = new Agent({
    name: "User Interface Agent",
    instructions: "You are a user interface agent that handles all interactions with the user. You work as part of a support system that includes a Help Center Agent with access to a vector database containing OpenAI documentation. When users need to search our knowledge base or have questions about OpenAI products, transfer them to the Help Center Agent who can query the vector database. Call this agent for general questions and initial routing.",
    functions: [transferToHelpCenter]
});

const helpCenterAgent = new Agent({
    name: "Help Center Agent", 
    instructions: "You are an OpenAI help center agent with access to a vector database containing comprehensive OpenAI documentation. You can search this knowledge base using queryDocs to find relevant information about GPT models, DALL-E, Whisper, and other OpenAI products. You also have the ability to submit support tickets and send emails when needed. Always search the vector database first when answering questions about OpenAI products.",
    functions: [queryDocs, submitTicket, sendEmail]
});

async function startSupportBotDemo() {
    console.log('\n🤖 Support Bot Demo');
    console.log('I can help you find answers in our knowledge base. Type "quit" to exit.\n');
    
    try {
        await runDemoLoop(userInterfaceAgent, {}, false, false);
    } catch (error) {
        console.error('Error in demo loop:', error);
    }
}

module.exports = {
    queryQdrant,
    queryDocs,
    sendEmail,
    submitTicket,
    transferToHelpCenter,
    userInterfaceAgent,
    helpCenterAgent,
    startSupportBotDemo
};

if (require.main === module) {
    startSupportBotDemo().catch(console.error);
}