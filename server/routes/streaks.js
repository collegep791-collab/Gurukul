import { Router } from 'express';
import supabase from '../supabase.js';

const router = Router();

// Ensure user is authenticated
router.use((req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
});

// GET /api/streaks/me
router.get('/me', async (req, res) => {
  const userId = req.session.userId;
  
  try {
    const { data: user } = await supabase.from('users').select('streak, credits').eq('id', userId).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Get today's activity
    const todayStr = new Date().toISOString().split('T')[0];
    
    const { count: todayActivity } = await supabase
      .from('user_activity')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'login')
      .gte('created_at', `${todayStr}T00:00:00Z`);
    
    // Get last 7 days of activity summary
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentActivity } = await supabase
      .from('user_activity')
      .select('created_at, credits_earned')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    // Aggregate in JS instead of complex SQL GROUP BY
    const historyMap = {};
    if (recentActivity) {
      recentActivity.forEach(a => {
        const d = a.created_at.split('T')[0];
        historyMap[d] = (historyMap[d] || 0) + (a.credits_earned || 0);
      });
    }

    const history = Object.keys(historyMap).sort().map(k => ({
      log_date: k,
      total_credits: historyMap[k]
    }));

    res.json({
      streak: user.streak,
      credits: user.credits,
      checkedInToday: (todayActivity || 0) > 0,
      history
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch streak' });
  }
});

// POST /api/streaks/checkin
router.post('/checkin', async (req, res) => {
  const userId = req.session.userId;
  
  try {
    const { data: user } = await supabase.from('users').select('streak, credits').eq('id', userId).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Did they check in today?
    const { data: todayActivity } = await supabase
      .from('user_activity')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_type', 'login')
      .gte('created_at', `${todayStr}T00:00:00Z`)
      .limit(1);

    if (todayActivity && todayActivity.length > 0) {
      return res.json({ message: 'Already checked in today', streak: user.streak, credits: user.credits });
    }

    // Did they check in yesterday? If so, continuous streak.
    const yesterdayDateObj = new Date();
    yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
    const yesterdayStr = yesterdayDateObj.toISOString().split('T')[0];

    const { data: yesterdayActivity } = await supabase
      .from('user_activity')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_type', 'login')
      .gte('created_at', `${yesterdayStr}T00:00:00Z`)
      .lt('created_at', `${todayStr}T00:00:00Z`)
      .limit(1);

    let newStreak = user.streak;
    if (yesterdayActivity && yesterdayActivity.length > 0) {
      newStreak += 1; // Unbroken streak
    } else {
      newStreak = 1; // Reset streak
    }

    const baseCredits = 10;
    const bonus = newStreak * 5;
    const earned = baseCredits + bonus;
    const newCredits = user.credits + earned;

    // Update streak and credits
    await supabase.from('users').update({ streak: newStreak, credits: newCredits }).eq('id', userId);
    
    // Log activity
    await supabase.from('user_activity').insert({ user_id: userId, activity_type: 'login', credits_earned: earned });

    res.json({ streak: newStreak, credits: newCredits, earned });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check in' });
  }
});

export default router;
