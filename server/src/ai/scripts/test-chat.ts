import { generateResponse } from '../services/chatService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testChat() {
  try {
    // Test queries
    const queries = [
      "What messages mention Drew and when were they sent?",
      "What messages were sent between 7 AM and 9 AM on January 8th?",
      "What's the most recent message about testing?"
    ];

    // Try each query
    for (const query of queries) {
      console.log('\n-----------------------------------');
      console.log(`Question: "${query}"`);
      console.log('-----------------------------------');

      const response = await generateResponse(query);
      console.log('\nAI Response:', response);
    }
  } catch (error) {
    console.error('Error testing chat:', error);
  }
}

// Run the test
testChat(); 