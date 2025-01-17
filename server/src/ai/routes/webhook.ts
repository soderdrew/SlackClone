import { Router } from 'express';
import { handleNewMessage, handleMessageUpdate, handleMessageDeletion } from '../services/messageHandler';
import { handleNewDocument, handleDocumentDeletion } from '../services/documentHandler';

const router = Router();

// Verify webhook request is from Supabase
const verifyWebhookSecret = (req: any, res: any, next: any) => {
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  const providedSecret = req.headers['x-webhook-secret'];

  if (!webhookSecret) {
    console.error('SUPABASE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  if (providedSecret !== webhookSecret) {
    console.error('Invalid webhook secret provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

/**
 * Webhook endpoint to handle Supabase realtime events for messages
 */
router.post('/message-events', verifyWebhookSecret, async (req, res) => {
  try {
    const { type, record, old_record } = req.body;
    console.log('Webhook received:', {
      type,
      messageId: record?.id || old_record?.id,
      oldContent: old_record?.content,
      newContent: record?.content
    });
    
    switch (type) {
      case 'INSERT':
        await handleNewMessage(record);
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      
      case 'UPDATE':
        console.log('Processing UPDATE event:', {
          messageId: record.id,
          oldContent: old_record?.content,
          newContent: record.content,
          isEdited: record.is_edited
        });
        await handleMessageUpdate(record);
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      
      case 'DELETE':
        await handleMessageDeletion(old_record.id);
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
      
      default:
        console.warn(`Unhandled event type: ${type}`);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error processing message event:', error);
    res.status(500).json({ 
      error: 'Failed to process message event',
      details: error.message || 'Unknown error'
    });
  }
});

/**
 * Webhook endpoint to handle Supabase realtime events for avatar documents
 */
router.post('/document-events', verifyWebhookSecret, async (req, res) => {
  try {
    const { type, record, old_record } = req.body;
    console.log('Document webhook received:', {
      type,
      documentId: record?.id || old_record?.id
    });
    
    switch (type) {
      case 'INSERT':
        await handleNewDocument(record);
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      
      case 'DELETE':
        await handleDocumentDeletion(old_record.id);
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
      
      default:
        console.warn(`Unhandled event type: ${type}`);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error processing document event:', error);
    res.status(500).json({ 
      error: 'Failed to process document event',
      details: error.message || 'Unknown error'
    });
  }
});

export default router; 