-- Check existing storage policies
SELECT policy_name as name, definition 
FROM storage.policies 
WHERE bucket_id = 'message-attachments'; 