import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import supabase from '../supabase.js';

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// Auth guard middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

// GET /api/assignments — list assignments
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('role').eq('id', req.session.userId).single();
    if (!user) return res.status(401).json({ error: 'User not found' });

    let assignments = [];

    if (user.role === 'STUDENT') {
      // 1. Fetch all active assignments
      const { data: activeAssignments } = await supabase
        .from('assignments')
        .select('*, creator:users!created_by(name, avatar)')
        .eq('status', 'Active')
        .order('due_date', { ascending: true });

      if (activeAssignments && activeAssignments.length > 0) {
        // 2. Fetch submissions for this student
        const assignmentIds = activeAssignments.map(a => a.id);
        const { data: submissions } = await supabase
          .from('submissions')
          .select('id, assignment_id, grade, feedback')
          .eq('student_id', req.session.userId)
          .in('assignment_id', assignmentIds);

        // 3. Map together
        assignments = activeAssignments.map(a => {
          const sub = submissions?.find(s => s.assignment_id === a.id);
          return {
            ...a,
            creator_name: a.creator?.name,
            creator_avatar: a.creator?.avatar,
            my_submission_id: sub ? sub.id : null,
            my_grade: sub ? sub.grade : null,
            my_feedback: sub ? sub.feedback : null
          };
        });
      }
    } else {
      // Teachers/Admins
      let query = supabase
        .from('assignments')
        .select('*, creator:users!created_by(name, avatar), submissions(id, grade)')
        .order('created_at', { ascending: false });

      if (user.role !== 'ADMIN') {
        query = query.eq('created_by', req.session.userId);
      }

      const { data: teacherAssignments } = await query;
      
      if (teacherAssignments) {
        assignments = teacherAssignments.map(a => {
          const subs = a.submissions || [];
          const gradedCount = subs.filter(s => s.grade !== null).length;
          return {
            ...a,
            creator_name: a.creator?.name,
            creator_avatar: a.creator?.avatar,
            total_submissions: subs.length,
            graded_count: gradedCount
          };
        });
      }
    }

    res.json(assignments);
  } catch (err) {
    console.error('Assignments GET error:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/assignments — teacher/admin creates assignment
router.post('/', requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('role').eq('id', req.session.userId).single();
    if (user.role === 'STUDENT') return res.status(403).json({ error: 'Students cannot create assignments' });

    const { title, description, course, due_date, max_points } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!due_date) return res.status(400).json({ error: 'Due date is required' });

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        title,
        description: description || '',
        course: course || '',
        due_date,
        max_points: max_points || 100,
        created_by: req.session.userId
      })
      .select('*, creator:users!created_by(name)')
      .single();

    if (error) throw error;

    const formattedAssignment = { ...assignment, creator_name: assignment.creator?.name };

    // Notify all students
    const { data: students } = await supabase.from('users').select('id').eq('role', 'STUDENT');
    if (students && req.app.locals.notify) {
      for (const { id } of students) {
        req.app.locals.notify(id, {
          type: 'assignment',
          title: 'New Assignment',
          body: `"${title}" — due ${due_date}`,
          link: '/assignments'
        });
      }
    }

    if (req.app.locals.auditLog) {
      req.app.locals.auditLog(req.session.userId, 'assignment_create', 'assignment', assignment.id, `Created: ${title}`);
    }

    res.status(201).json(formattedAssignment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// POST /api/assignments/:id/submit — student submits
router.post('/:id/submit', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { data: assignment } = await supabase.from('assignments').select('*').eq('id', req.params.id).single();
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.status !== 'Active') return res.status(400).json({ error: 'Assignment is closed' });

    // Check if already submitted
    const { data: existing } = await supabase.from('submissions').select('id').eq('assignment_id', req.params.id).eq('student_id', req.session.userId).single();
    if (existing) return res.status(400).json({ error: 'Already submitted. Contact your teacher to resubmit.' });

    let fileUrl = '';
    
    // Upload file if exists
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const fileName = `submission-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('assignments').getPublicUrl(fileName);
      fileUrl = publicUrlData.publicUrl;
    }

    const { data: submission, error: submitError } = await supabase
      .from('submissions')
      .insert({
        assignment_id: req.params.id,
        student_id: req.session.userId,
        file_path: fileUrl,
        comment: req.body.comment || ''
      })
      .select()
      .single();

    if (submitError) throw submitError;

    // Notify the teacher
    if (req.app.locals.notify) {
      const { data: student } = await supabase.from('users').select('name').eq('id', req.session.userId).single();
      req.app.locals.notify(assignment.created_by, {
        type: 'assignment',
        title: 'New Submission',
        body: `${student?.name} submitted "${assignment.title}"`,
        link: '/assignments'
      });
    }

    res.status(201).json(submission);
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

// GET /api/assignments/:id/submissions — teacher views submissions
router.get('/:id/submissions', requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('role').eq('id', req.session.userId).single();
    if (user.role === 'STUDENT') return res.status(403).json({ error: 'Forbidden' });

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*, student:users!student_id(name, avatar, email)')
      .eq('assignment_id', req.params.id)
      .order('submitted_at', { ascending: true });

    if (error) throw error;

    const formatted = submissions.map(s => ({
      ...s,
      student_name: s.student?.name,
      student_avatar: s.student?.avatar,
      student_email: s.student?.email
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// PATCH /api/assignments/:id/submissions/:subId/grade — teacher grades
router.patch('/:id/submissions/:subId/grade', requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('role').eq('id', req.session.userId).single();
    if (user.role === 'STUDENT') return res.status(403).json({ error: 'Forbidden' });

    const { grade, feedback } = req.body;
    if (grade === undefined || grade === null) return res.status(400).json({ error: 'Grade is required' });

    const { data: submission, error } = await supabase
      .from('submissions')
      .update({
        grade,
        feedback: feedback || '',
        graded_by: req.session.userId,
        graded_at: new Date().toISOString()
      })
      .eq('id', req.params.subId)
      .eq('assignment_id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (submission && grade) {
      const gradeVal = parseInt(grade) || 10;
      // Get current credits and progress
      const { data: student } = await supabase.from('users').select('credits, progress').eq('id', submission.student_id).single();
      if (student) {
        const newCredits = (student.credits || 0) + gradeVal;
        const newProgress = Math.min(100, (student.progress || 0) + 2);
        await supabase.from('users').update({ credits: newCredits, progress: newProgress }).eq('id', submission.student_id);
      }
      
      await supabase.from('user_activity').insert({ user_id: submission.student_id, activity_type: 'assignment_grade', credits_earned: gradeVal });
    }

    if (req.app.locals.notify && submission) {
      const { data: assignment } = await supabase.from('assignments').select('title').eq('id', req.params.id).single();
      req.app.locals.notify(submission.student_id, {
        type: 'grade',
        title: 'Assignment Graded',
        body: `You scored ${grade} on "${assignment?.title}"${feedback ? ` — "${feedback}"` : ''}`,
        link: '/assignments'
      });
    }

    if (req.app.locals.auditLog) {
      req.app.locals.auditLog(req.session.userId, 'assignment_grade', 'submission', req.params.subId, `Graded: ${grade}`);
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Grading failed' });
  }
});

// PATCH /api/assignments/:id — update assignment status
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('role').eq('id', req.session.userId).single();
    if (user.role === 'STUDENT') return res.status(403).json({ error: 'Forbidden' });

    const { status, title, description, due_date, max_points } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (due_date) updateData.due_date = due_date;
    if (max_points) updateData.max_points = max_points;

    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'No fields to update' });

    const { data: assignment, error } = await supabase
      .from('assignments')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

export default router;
