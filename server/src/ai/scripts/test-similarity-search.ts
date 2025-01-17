import { similaritySearch } from '../services/searchService';
import { pineconeClient, MESSAGE_INDEX_NAME } from '../config/pinecone';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function listStoredMessages() {
  console.log('\nListing all stored messages in Pinecone:');
  console.log('----------------------------------------');
  
  const index = pineconeClient.index(MESSAGE_INDEX_NAME);
  const queryResponse = await index.query({
    vector: new Array(1536).fill(0),
    topK: 100,
    includeMetadata: true
  });

  console.log(`Found ${queryResponse.matches?.length || 0} total messages:`);
  queryResponse.matches?.forEach((match, i) => {
    const metadata = match.metadata as any;
    console.log(`\n${i + 1}. Message: "${metadata.content}"`);
    console.log(`   Channel: ${metadata.channelId}`);
    console.log(`   Created: ${new Date(metadata.createdAt).toLocaleString()}`);
  });
}

async function testSimilaritySearch() {
  try {
    // First list all stored messages
    await listStoredMessages();

    console.log('\nTesting similarity search across all channels:');
    // Test queries to try
    const queries = [
      "Hello there Drew",  // Exact match with message #43
      "Hi dale",          // Exact match with message #1
      "good morning"      // Similar to message #7 "morning"
    ];

    // Try each query
    for (const query of queries) {
      console.log('\n-----------------------------------');
      console.log(`Testing query: "${query}"`);
      console.log('-----------------------------------');

      const results = await similaritySearch(query, undefined, 5);
      
      // Display results
      results.forEach((result, index) => {
        const score = result.score ?? 0;
        console.log(`\nResult ${index + 1} (Score: ${score.toFixed(3)}):`);
        console.log(`Message: ${result.message.content}`);
        console.log(`Channel: ${result.message.channelId}`);
        console.log(`Created: ${new Date(result.message.createdAt).toLocaleString()}`);
        if (result.message.isEdited) {
          console.log(`Updated: ${new Date(result.message.updatedAt!).toLocaleString()}`);
        }
      });
    }
  } catch (error) {
    console.error('Error testing similarity search:', error);
  }
}

// Run the test
testSimilaritySearch(); 