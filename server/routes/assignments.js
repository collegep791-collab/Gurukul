import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `submission-${unique}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// Auth guard middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

// GET /api/assignments — list assignments
router.get('/', requireAuth, (req, res) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);

  let assignments;
  if (user.role === 'STUDENT') {
    // Students see all active assignments with their submission status
    assignments = db.prepare(`
      SELECT a.*, u.name as creator_name, u.avatar as creator_avatar,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as total_submissions,
        (SELECT id FROM submissions WHERE assignment_id = a.id AND student_id = ?) as my_submission_id,
        (SELECT grade FROM submissions WHERE assignment_id = a.id AND student_id = ?) as my_grade
      FROM assignments a
      JOIN users u ON a.created_by = u.id
      WHERE a.status = 'Active'
      ORDER BY a.due_date ASC
    `).all(req.session.userId, req.session.userId);
  } else {
    // Teachers/Admins see assignments they created (or all for admin)
    const whereClause = user.role === 'ADMIN' ? '' : 'WHERE a.created_by = ?';
    const params = user.role === 'ADMIN' ? [] : [req.session.userId];
    assignments = db.prepare(`
      SELECT a.*, u.name as creator_name, u.avatar as creator_avatar,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as total_submissions,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id AND grade IS NOT NULL) as graded_count
      FROM assignments a
      JOIN users u ON a.created_by = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
    `).all(...params);
  }

  res.json(assignments);
});

// POST /api/assignments — teacher/admin creates assignment
router.post('/', requireAuth, (req, res) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (user.role === 'STUDENT') return res.status(403).json({ error: 'Students cannot create assignments' });

  const { title, description, course, due_date, max_points } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!due_date) return res.status(400).json({ error: 'Due date is required' });

  const result = db.prepare(`
    INSERT INTO assignments (title, description, course, due_date, max_points, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, description || '', course || '', due_date, max_points || 100, req.session.userId);

  const assignment = db.prepare('SELECT a.*, u.name as creator_name FROM assignments a JOIN users u ON a.created_by = u.id WHERE a.id = ?').get(result.lastInsertRowid);

  // Notify all students
  const students = db.prepare("SELECT id FROM users WHERE role = 'STUDENT'").all();
  for (const { id } of students) {
    if (req.app.locals.notify) {
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

  res.status(201).json(assignment);
});

// POST /api/assignments/:id/submit — student submits
router.post('/:id/submit', requireAuth, upload.single('file'), (req, res) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  if (assignment.status !== 'Active') return res.status(400).json({ error: 'Assignment is closed' });

  // Check if already submitted
  const existing = db.prepare('SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?').get(req.params.id, req.session.userId);
  if (existing) return res.status(400).json({ error: 'Already submitted. Contact your teacher to resubmit.' });

  const filePath = req.file ? req.file.filename : '';
  const comment = req.body.comment || '';

  const result = db.prepare(`
    INSERT INTO submissions (assignment_id, student_id, file_path, comment)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.session.userId, filePath, comment);

  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(result.lastInsertRowid);

  // Notify the teacher who created the assignment
  if (req.app.locals.notify) {
    const student = db.prepare('SELECT name FROM users WHERE id = ?').get(req.session.userId);
    req.app.locals.notify(assignment.created_by, {
      type: 'assignment',
      title: 'New Submission',
      body: `${student.name} submitted "${assignment.title}"`,
      link: '/assignments'
    });
  }

  res.status(201).json(submission);
});

// GET /api/assignments/:id/submissions — teacher views submissions
router.get('/:id/submissions', requireAuth, (req, res) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (user.role === 'STUDENT') return res.status(403).json({ error: 'Forbidden' });

  const submissions = db.prepare(`
    SELECT s.*, u.name as student_name, u.avatar as student_avatar, u.email as student_email
    FROM submissions s
    JOIN users u ON s.student_id = u.id
    WHERE s.assignment_id = ?
    ORDER BY s.submitted_at ASC
  `).all(req.params.id);

  res.json(submissions);
});

// PATCH /api/assignments/:id/submissions/:subId/grade — teacher grades
router.patch('/:id/submissions/:subId/grade', requireAuth, (req, res) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (user.role === 'STUDENT') return res.status(403).json({ error: 'Forbidden' });

  const { grade, feedback } = req.body;
  if (grade === undefined || grade === null) return res.status(400).json({ error: 'Grade is required' });

  db.prepare(`
    UPDATE submissions SET grade = ?, feedback = ?, graded_by = ?, graded_at = datetime('now')
    WHERE id = ? AND assignment_id = ?
  `).run(grade, feedback || '', req.session.userId, req.params.subId, req.params.id);

  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.subId);

  // Notify student
  if (req.app.locals.notify && submission) {
    const assignment = db.prepare('SELECT title FROM assignments WHERE id = ?').get(req.params.id);
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
});

// PATCH /api/assignments/:id — update assignment status
router.patch('/:id', requireAuth, (req, res) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (user.role === 'STUDENT') return res.status(403).json({ error: 'Forbidden' });

  const { status, title, description, due_date, max_points } = req.body;
  const fields = [];
  const values = [];
  if (status) { fields.push('status = ?'); values.push(status); }
  if (title) { fields.push('title = ?'); values.push(title); }
  if (description) { fields.push('description = ?'); values.push(description); }
  if (due_date) { fields.push('due_date = ?'); values.push(due_date); }
  if (max_points) { fields.push('max_points = ?'); values.push(max_points); }

  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

  db.prepare(`UPDATE assignments SET ${fields.join(', ')} WHERE id = ?`).run(...values, req.params.id);
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  res.json(assignment);
});

export default router;
