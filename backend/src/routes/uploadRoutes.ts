import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import { supabase } from '../config/db';

const router = express.Router();

// Use memory storage for temporary file handling before uploading to Supabase
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload to Supabase Storage
    // NOTE: Ensure you have created a public bucket named 'sterling_uploads' in Supabase
    const { data, error } = await supabase.storage
      .from('sterling_uploads')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage Error:', error);
      return res.status(500).json({ success: false, message: 'Failed to upload to storage' });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('sterling_uploads')
      .getPublicUrl(filePath);

    res.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error('Upload catch error:', err);
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
});

export default router;
