/**
 * server/routes/resources.js
 * 
 * Technical Component: Academic Resource Library API
 * Description: Handles the CRUD operations for academic materials. Incorporates 
 * Multer for parsing multipart/form-data, uploading files directly to Supabase Storage, 
 * and storing the absolute public URL in the database. Supports robust filtering 
 * by type and text search queries.
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import supabase from '../supabase.js';

// Use memory storage to send buffers directly to Supabase
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|md|mp4|mp3|wav|png|jpg|jpeg|gif|webp|zip/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error(`File type .${ext} not allowed`));
  }
});

const router = Router();

// GET /api/resources
router.get('/', async (req, res) => {
  const { type, category, featured, search } = req.query;
  
  try {
    let query = supabase
      .from('resources')
      .select('*, uploader:users(name, avatar)')
      .order('created_at', { ascending: false });

    if (type && type !== 'All') query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (featured === '1') query = query.eq('featured', 1);
    if (search) query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    // Flatten uploader details to match frontend expectations
    const formatted = data.map(r => ({
      ...r,
      uploader_name: r.uploader?.name,
      uploader_avatar: r.uploader?.avatar
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// GET /api/resources/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*, uploader:users(name)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Resource not found' });

    // Increment views
    await supabase.from('resources').update({ views: data.views + 1 }).eq('id', req.params.id);
    
    res.json({ ...data, uploader_name: data.uploader?.name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// GET /api/resources/:id/download
router.get('/:id/download', async (req, res) => {
  try {
    const { data, error } = await supabase.from('resources').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Resource not found' });
    if (!data.file_path) return res.status(404).json({ error: 'No file attached to this resource' });

    // Increment downloads
    await supabase.from('resources').update({ downloads: data.downloads + 1 }).eq('id', req.params.id);
    
    // Redirect to the public URL for actual download
    res.redirect(data.file_path);
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

// POST /api/resources
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { title, type, format, category, thumbnail } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

  let fileUrl = '';
  let fileSize = req.body.size || '';
  let fileFormat = format || 'PDF';

  try {
    // 1. Upload file to Supabase Storage if attached
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resources')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('resources').getPublicUrl(fileName);
      fileUrl = publicUrlData.publicUrl;
      
      fileSize = `${(req.file.size / (1024 * 1024)).toFixed(1)}MB`;
      fileFormat = ext.slice(1).toUpperCase();
    }

    // 2. Insert DB record
    const { data: newResource, error: dbError } = await supabase
      .from('resources')
      .insert({
        title,
        type: type || 'Document',
        format: fileFormat,
        size: fileSize,
        file_path: fileUrl, // Store Supabase public URL directly
        uploader_id: req.userId,
        category: category || '',
        status: 'Live',
        thumbnail: thumbnail || ''
      })
      .select('*, uploader:users(name)')
      .single();

    if (dbError) throw dbError;

    const formattedResource = { ...newResource, uploader_name: newResource.uploader?.name };

    // Audit log
    if (req.app.locals.auditLog) {
      req.app.locals.auditLog(req.userId, 'resource_upload', 'resource', newResource.id, `Uploaded: ${title}`);
    }

    res.status(201).json(formattedResource);
  } catch (err) {
    console.error('Resource upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// DELETE /api/resources/:id
router.delete('/:id', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { data: resource } = await supabase.from('resources').select('*').eq('id', req.params.id).single();
    
    // Delete file from Supabase Storage if it exists
    if (resource && resource.file_path && resource.file_path.includes('supabase.co')) {
      const fileName = resource.file_path.split('/').pop();
      if (fileName) {
        await supabase.storage.from('resources').remove([fileName]);
      }
    }

    // Delete DB record
    await supabase.from('resources').delete().eq('id', req.params.id);

    if (req.app.locals.auditLog) {
      req.app.locals.auditLog(req.userId, 'resource_delete', 'resource', req.params.id, `Deleted: ${resource?.title}`);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Resource delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// PATCH /api/resources/:id
router.patch('/:id', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
  
  const updates = req.body;
  const validFields = ['title','type','format','size','category','status','featured','verified','thumbnail'];
  const updateData = {};
  
  validFields.forEach(f => {
    if (updates[f] !== undefined) updateData[f] = updates[f];
  });

  if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'No valid fields' });

  try {
    const { data: resource, error } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, uploader:users(name)')
      .single();

    if (error) throw error;

    res.json({ ...resource, uploader_name: resource.uploader?.name });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

export default router;
