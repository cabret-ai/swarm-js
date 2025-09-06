#!/usr/bin/env node

const { QdrantClient } = require('@qdrant/js-client-rest');
const OpenAI = require('openai');

async function testQdrantConnectivity() {
    console.log('Testing Qdrant connectivity...\n');
    
    try {
        // Test basic connection
        const qdrant = new QdrantClient({ 
            host: 'localhost', 
            port: 6333,
            checkCompatibility: false
        });
        
        console.log('✓ Qdrant client created successfully');
        
        // Test collections endpoint
        const collections = await qdrant.getCollections();
        console.log('✓ Collections retrieved:', collections.collections.map(c => c.name));
        
        // Test specific collection
        const collection = await qdrant.getCollection('help_center');
        console.log('✓ Collection "help_center" exists');
        console.log(`  - Vectors count: ${collection.vectors_count}`);
        console.log(`  - Points count: ${collection.points_count}`);
        
        // Test query functionality
        const client = new OpenAI();
        console.log('\n✓ OpenAI client created successfully');
        
        const embeddingResponse = await client.embeddings.create({
            input: "How do I check my token usage?",
            model: "text-embedding-3-large",
        });
        
        console.log('✓ Embedding generated successfully');
        
        const query_results = await qdrant.search('help_center', {
            vector: {
                name: 'article',
                vector: embeddingResponse.data[0].embedding
            },
            limit: 3,
        });
        
        console.log('✓ Qdrant search completed successfully');
        console.log(`  - Found ${query_results.length} results`);
        
        if (query_results.length > 0) {
            console.log(`  - Top result: "${query_results[0].payload.title}"`);
            console.log(`  - Score: ${query_results[0].score.toFixed(4)}`);
        }
        
        console.log('\n🎉 All tests passed! Qdrant connectivity is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    testQdrantConnectivity().catch(console.error);
}

module.exports = { testQdrantConnectivity };