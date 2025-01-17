import { generateAvatarResponse, formatAvatarResponse } from '../services/avatarChatService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test profile
const testProfile = {
  id: 'bf42cf64-bf0b-4df9-84c4-a8b5d9251b60',
  username: 'Jeff Bezos',
  email: 'soderdrews@gmail.com',
  bio: 'Founder of Amazon',
  created_at: new Date().toISOString()
};

async function testAvatarChat() {
  try {
    console.log('\nTesting AI Avatar Chat:');
    console.log('----------------------------------------');

    // Test queries that cover different aspects
    const queries = [
      "What is your background in software development?",
      "What are your main areas of expertise?",
      "How do you stay updated with technology trends?"
    ];

    // Try each query
    for (const query of queries) {
      console.log('\n-----------------------------------');
      console.log(`Question: "${query}"`);
      console.log('-----------------------------------');

      const response = await generateAvatarResponse(query, testProfile.id, testProfile);
      const formattedResponse = formatAvatarResponse(response);
      
      console.log('\nResponse:');
      console.log(formattedResponse);
    }
  } catch (error) {
    console.error('Error testing avatar chat:', error);
  }
}

// Run the test
testAvatarChat()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  }); 