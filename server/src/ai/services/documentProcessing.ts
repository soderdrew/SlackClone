import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { adminSupabase } from '../../config/supabase';
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

interface ProcessedDocument {
  content: string;
  metadata: {
    fileName: string;
    mimeType: string;
    size: number;
    userId: string;
  };
}

// List of supported MIME types
const SUPPORTED_MIME_TYPES = [
  'text/plain',                                           // .txt files
  'application/pdf',                                      // .pdf files
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx files
  'application/msword',                                   // .doc files
  'text/markdown',                                        // .md files
  'text/csv',                                            // .csv files
  'application/rtf',                                      // .rtf files
];

/**
 * Processes a document from storage and prepares it for embedding
 */
export const processDocument = async (documentId: string): Promise<ProcessedDocument> => {
  try {
    // 1. Get document metadata from database
    const { data: document, error: dbError } = await adminSupabase
      .from('avatar_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (dbError || !document) {
      throw new Error(`Failed to fetch document metadata: ${dbError?.message}`);
    }

    // Check if mime type is supported
    if (!SUPPORTED_MIME_TYPES.includes(document.mime_type)) {
      throw new Error(`Unsupported file type: ${document.mime_type}. Only text documents are supported.`);
    }

    // 2. Download file from storage
    const { data: fileData, error: storageError } = await adminSupabase
      .storage
      .from('avatars')
      .download(document.storage_path);

    if (storageError || !fileData) {
      throw new Error(`Failed to download file: ${storageError?.message}`);
    }

    // 3. Extract text content based on file type
    let textContent = await extractTextContent(fileData, document.mime_type);

    // 4. Clean and prepare text
    textContent = cleanText(textContent);

    // 5. Split if needed (for very large documents)
    if (textContent.length > 10000) { // If more than ~10k characters
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100,
      });
      const chunks = await splitter.createDocuments([textContent]);
      textContent = chunks.map(chunk => chunk.pageContent).join('\n\n');
    }

    return {
      content: textContent,
      metadata: {
        fileName: document.name,
        mimeType: document.mime_type,
        size: document.size,
        userId: document.user_id
      }
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

/**
 * Extracts text content from different file types
 */
const extractTextContent = async (fileData: Blob, mimeType: string): Promise<string> => {
  // Convert Blob to ArrayBuffer
  const buffer = await fileData.arrayBuffer();

  switch (mimeType) {
    case 'text/plain':
    case 'text/markdown':
    case 'text/csv':
      return await fileData.text();

    case 'application/pdf':
      const pdfData = new Uint8Array(buffer);
      const pdfContent = await pdfParse(pdfData);
      return pdfContent.text;

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
    case 'application/rtf':
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
};

/**
 * Cleans and normalizes text content
 */
const cleanText = (text: string): string => {
  // Basic text cleaning, similar to what we do for messages
  let cleanText = text.trim();
  // Remove excessive whitespace
  cleanText = cleanText.replace(/\s+/g, ' ');
  // Remove any null characters
  cleanText = cleanText.replace(/\0/g, '');
  // Remove any control characters
  cleanText = cleanText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  return cleanText;
}; 