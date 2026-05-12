import { Router } from 'express';
import supabase from '../supabase.js';

const router = Router();

// GET /api/audit — admin-only audit log
router.get('/', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { data: user } = await supabase.from('users').select('role').eq('id', req.session.userId).single();
    if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const { data: logs, error } = await supabase
      .from('audit_log')
      .select('*, actor:users!actor_id(name, avatar)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const formatted = logs.map(l => ({
      ...l,
      actor_name: l.actor?.name,
      actor_avatar: l.actor?.avatar
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
