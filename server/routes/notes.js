import { Router } from 'express';
import supabase from '../supabase.js';

const router = Router();

// GET /api/notes
router.get('/', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    // Get notes created by current user OR notes by teachers/admins
    // Equivalent to: n.user_id = ? OR u.role IN ('TEACHER', 'ADMIN')
    // We can do this efficiently by just getting all teacher/admin notes, and all user notes, and combining,
    // or by letting Supabase do an OR filter on embedded data (which is tricky).
    // Instead, let's fetch all notes and filter, or fetch notes by user_id, and then notes where author role is Teacher/Admin.
    
    // 1. Fetch user's own notes
    const { data: ownNotes, error: e1 } = await supabase
      .from('notes')
      .select('*, author:users!user_id(name, role)')
      .eq('user_id', req.session.userId);

    // 2. Fetch public course notes (Teacher/Admin)
    const { data: globalNotes, error: e2 } = await supabase
      .from('notes')
      .select('*, author:users!user_id(name, role)')
      .neq('user_id', req.session.userId); // avoid duplicates

    if (e1 || e2) throw (e1 || e2);

    const filteredGlobalNotes = (globalNotes || []).filter(n => n.author?.role === 'TEACHER' || n.author?.role === 'ADMIN');
    
    let combined = [...(ownNotes || []), ...filteredGlobalNotes];
    
    combined.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    const formatted = combined.map(n => ({
      ...n,
      author_name: n.author?.name,
      author_role: n.author?.role
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Notes GET error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /api/notes/:id
router.get('/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.session.userId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Note not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST /api/notes
router.post('/', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { title, content, category } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: req.session.userId,
        title: title || 'Untitled',
        content: content || '',
        category: category || 'General'
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT /api/notes/:id
router.put('/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { title, content, category } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('notes')
      .update({
        title,
        content,
        category: category || 'General',
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.session.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    await supabase.from('notes').delete().eq('id', req.params.id).eq('user_id', req.session.userId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
