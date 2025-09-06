const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { QdrantClient } = require('@qdrant/js-client-rest');

// Initialize clients
const client = new OpenAI();
const GPT_MODEL = "gpt-4o";
const EMBEDDING_MODEL = "text-embedding-3-large";

async function main() {
    try {
        // Load articles from JSON files
        const dataDir = path.join(__dirname, 'data');
        const articleList = fs.readdirSync(dataDir);
        
        console.log(`Found ${articleList.length} article files`);
        
        const articles = [];
        
        // Read all article files
        for (const filename of articleList) {
            if (!filename.endsWith('.json')) continue;
            
            const articlePath = path.join(dataDir, filename);
            const data = JSON.parse(fs.readFileSync(articlePath, 'utf8'));
            articles.push(data);
        }
        
        console.log(`Loaded ${articles.length} articles`);
        
        // Generate embeddings for articles
        for (let i = 0; i < articles.length; i++) {
            try {
                console.log(`Processing article ${i + 1}/${articles.length}: ${articles[i].title}`);
                
                const embedding = await client.embeddings.create({
                    model: EMBEDDING_MODEL,
                    input: articles[i].text
                });
                
                articles[i].embedding = embedding.data[0].embedding;
            } catch (error) {
                console.error(`Error processing article "${articles[i].title}":`, error.message);
            }
        }
        
        console.log('Embeddings generated successfully');
        
        // Set up Qdrant vector database
        const qdrant = new QdrantClient({ 
            host: 'localhost', 
            port: 6333,
            checkCompatibility: false
        });
        const collectionName = 'help_center';
        const vectorSize = articles[0].embedding.length;
        
        console.log(`Vector size: ${vectorSize}`);
        
        // Check if collection exists and delete it if it does
        try {
            await qdrant.getCollection(collectionName);
            console.log('Collection exists, deleting...');
            await qdrant.deleteCollection(collectionName);
        } catch (error) {
            // Collection doesn't exist, which is fine
            console.log('Collection does not exist, creating new one...');
        }
        
        // Create vector database collection
        await qdrant.createCollection(collectionName, {
            vectors: {
                article: {
                    size: vectorSize,
                    distance: 'Cosine'
                }
            }
        });
        
        console.log('Collection created successfully');
        
        // Populate collection with vectors
        const points = articles.map((article, index) => ({
            id: index,
            vector: {
                article: article.embedding
            },
            payload: {
                title: article.title,
                text: article.text,
                url: article.url,
                article_id: article.article_id
            }
        }));
        
        await qdrant.upsert(collectionName, {
            wait: true,
            points: points
        });
        
        console.log(`Successfully uploaded ${points.length} articles to Qdrant collection "${collectionName}"`);
        
    } catch (error) {
        console.error('Error in data preparation:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };