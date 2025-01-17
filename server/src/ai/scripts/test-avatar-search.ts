import { searchAvatarDocuments, getAvatarContext } from '../services/avatarSearchService';
import { pineconeClient, AVATAR_INDEX_NAME } from '../config/pinecone';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function listStoredAvatarDocuments() {
  console.log('\nListing all stored avatar documents in Pinecone:');
  console.log('----------------------------------------');
  
  const index = pineconeClient.index(AVATAR_INDEX_NAME);
  const queryResponse = await index.query({
    vector: new Array(1536).fill(0),
    topK: 100,
    includeMetadata: true
  });

  console.log(`Found ${queryResponse.matches?.length || 0} total documents:`);
  queryResponse.matches?.forEach((match, i) => {
    const metadata = match.metadata as any;
    console.log(`\n${i + 1}. Document: "${metadata.documentName}"`);
    console.log(`   User: ${metadata.userId}`);
    console.log(`   Created: ${new Date(metadata.createdAt).toLocaleString()}`);
    console.log(`   Content Preview: ${metadata.content.substring(0, 100)}...`);
  });
}

async function testAvatarSearch() {
  try {
    // First list all stored documents
    await listStoredAvatarDocuments();

    // Test user ID - replace with an actual user ID from your database
    const testUserId = 'bf42cf64-bf0b-4df9-84c4-a8b5d9251b60';

    console.log('\nTesting avatar document search:');
    // Test queries to try
    const queries = [
      "What is your background?",
      "What are your skills?",
      "Tell me about your experience"
    ];

    // Try each query
    for (const query of queries) {
      console.log('\n-----------------------------------');
      console.log(`Testing query: "${query}"`);
      console.log('-----------------------------------');

      // Test document search
      console.log('\nTesting searchAvatarDocuments:');
      const searchResults = await searchAvatarDocuments(query, testUserId, 3);
      
      // Test context generation
      console.log('\nTesting getAvatarContext:');
      const context = await getAvatarContext(query, testUserId);
      console.log('\nGenerated Context:');
      console.log(context);
    }
  } catch (error) {
    console.error('Error testing avatar search:', error);
  }
}

// Run the test
testAvatarSearch()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  }); 