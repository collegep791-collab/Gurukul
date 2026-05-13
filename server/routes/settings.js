import { Router } from 'express';
import supabase from '../supabase.js';

const router = Router();

// GET /api/settings
router.get('/', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', req.userId).single();
    
    if (!settings) {
      // Create default settings if missing
      const defaultSettings = { user_id: req.userId, theme: 'light', two_factor: 1, notify_resources: 1, notify_mentions: 1, notify_updates: 0 };
      await supabase.from('user_settings').insert(defaultSettings);
      return res.json(defaultSettings);
    }
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { theme, two_factor, notify_resources, notify_mentions, notify_updates } = req.body;

  try {
    const updateData = {
      user_id: req.userId,
      theme: theme ?? 'light',
      two_factor: two_factor ?? 1,
      notify_resources: notify_resources ?? 1,
      notify_mentions: notify_mentions ?? 1,
      notify_updates: notify_updates ?? 0
    };

    const { data: settings, error } = await supabase
      .from('user_settings')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
