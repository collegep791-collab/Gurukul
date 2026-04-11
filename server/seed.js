import db from './db.js';
import bcrypt from 'bcryptjs';

const SALT = bcrypt.genSaltSync(10);
const hash = (pw) => bcrypt.hashSync(pw, SALT);

export default function seed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) {
    console.log('📦 Database already seeded. Skipping.');
    return;
  }

  console.log('🌱 Seeding database...');

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, avatar, role, status, credits, streak, progress, date_joined)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [];

  // Admins & Teachers
  users.push({ name: 'Aryan Sharma', email: 'aryan@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Jameson', role: 'STUDENT', status: 'Active', credits: 1240, streak: 12, progress: 68, joined: '2023-08-15' });
  users.push({ name: 'Prof. Priya Desai', email: 'priya@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Amaya', role: 'TEACHER', status: 'Active', credits: 3200, streak: 45, progress: 92, joined: '2022-01-05' });
  users.push({ name: 'Elena Rodriguez', email: 'elena@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Eliza', role: 'ADMIN', status: 'Active', credits: 5000, streak: 100, progress: 99, joined: '2021-10-15' });
  users.push({ name: 'Dr. Raj Patel', email: 'raj@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Oliver', role: 'TEACHER', status: 'Active', credits: 4100, streak: 67, progress: 88, joined: '2021-06-01' });
  users.push({ name: 'Dr. Anjali Singh', email: 'anjali@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Eden', role: 'TEACHER', status: 'Active', credits: 3800, streak: 55, progress: 85, joined: '2022-03-20' });
  users.push({ name: 'Prof. David Clark', email: 'david@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=David', role: 'TEACHER', status: 'Active', credits: 3400, streak: 40, progress: 80, joined: '2021-09-01' });
  users.push({ name: 'Prof. Anita Bose', email: 'anita@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Anita', role: 'TEACHER', status: 'Active', credits: 3900, streak: 50, progress: 87, joined: '2022-08-15' });
  users.push({ name: 'Vikram Mehta', email: 'vikram@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Vikram', role: 'ADMIN', status: 'Active', credits: 4500, streak: 80, progress: 90, joined: '2022-01-10' });

  // 79 more Students
  const firstNames = ['Aarav', 'Vihaan', 'Sai', 'Reyansh', 'Ishaan', 'Shaurya', 'Aarush', 'Atharv', 'Shlok', 'Kabir', 'Rohan', 'Pranav', 'Samar', 'Arav', 'Ishita', 'Aarohi', 'Tvisha', 'Avni', 'Riya', 'Kavya', 'Suhana', 'Diya', 'Ananya', 'Pari', 'Sneha', 'Meera', 'Roshni', 'Isha', 'Aisha', 'Kyra', 'Trisha', 'Sara', 'Neha', 'Pooja', 'Rahul', 'Nikhil', 'Tanmay', 'Karan', 'Ravi', 'Amit', 'Sunil', 'Vijay', 'Vikas', 'Ajay', 'Oliver', 'Noah', 'William', 'James', 'Benjamin', 'Lucas', 'Henry', 'Alexander', 'Ethan', 'Jacob', 'Michael', 'Daniel', 'Matthew', 'Jackson', 'Sebastian', 'Olivia', 'Emma', 'Ava', 'Charlotte', 'Sophia', 'Amelia', 'Isabella', 'Mia', 'Evelyn', 'Harper', 'Camila', 'Gianna', 'Abigail', 'Luna', 'Ella', 'Chloe', 'Avery', 'Sofia'];
  const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Das', 'Sen', 'Gupta', 'Iyer', 'Reddy', 'Roy', 'Chowdhury', 'Nair', 'Bose', 'Verma', 'Yadav', 'Dixit', 'Malhotra', 'Jain', 'Mehta', 'Kaur', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  for (let i = 1; i <= 79; i++) {
    const fn = getRandomElement(firstNames);
    const ln = getRandomElement(lastNames);
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gurukul.edu`;
    users.push({ name: `${fn} ${ln}`, email, pw: 'password123', avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${fn}${i}`, role: 'STUDENT', status: 'Active', credits: getRandomInt(100, 2000), streak: getRandomInt(0, 30), progress: getRandomInt(10, 90), joined: '2023-09-01' });
  }

  const insertUsers = db.transaction(() => {
    for (const u of users) {
      insertUser.run(u.name, u.email, hash(u.pw), u.avatar, u.role, u.status, u.credits, u.streak, u.progress, u.joined);
    }
  });
  insertUsers();

  // ─── Settings ───
  const insertSettings = db.prepare(`INSERT INTO user_settings (user_id, theme, two_factor, notify_resources, notify_mentions, notify_updates) VALUES (?, ?, ?, ?, ?, ?)`);
  db.transaction(() => {
    for (let i = 1; i <= Object.keys(users).length; i++) {
      insertSettings.run(i, 'light', 1, 1, 1, 0);
    }
  })();

  // ─── Global Chat Channel ───
  const globalChannelId = db.prepare(`INSERT INTO chat_channels (name, description, type) VALUES ('Campus Hub', 'Global announcements and general chat for all students and faculty.', 'channel')`).run().lastInsertRowid;
  const insertMember = db.prepare('INSERT INTO chat_channel_members (channel_id, user_id) VALUES (?, ?)');
  db.transaction(() => {
    for (let i = 1; i <= Object.keys(users).length; i++) {
      insertMember.run(globalChannelId, i);
    }
  })();

  // ─── Assignments (15-20 distributed) ───
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const insertAssignment = db.prepare(`INSERT INTO assignments (title, description, course, due_date, max_points, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const courses = ['Ethics in AI', 'Quantum Mechanics', 'Systems Design', 'Mathematics', 'Literature', 'History'];
  const assignmentIds = [];
  
  db.transaction(() => {
    for (let i = 1; i <= 20; i++) {
        const title = `Assignment Task ${i}`;
        const desc = `Complete all tasks listed in chapter ${i}.`;
        const course = getRandomElement(courses);
        const due = i % 2 === 0 ? nextWeek : (i % 3 === 0 ? yesterday : nextMonth);
        const teacherId = getRandomElement([2, 4, 5, 6, 7]);
        const status = due === yesterday ? 'Closed' : 'Active';
        const result = insertAssignment.run(title, desc, course, due, 100, teacherId, status);
        assignmentIds.push({ id: result.lastInsertRowid, teacherId, maxPoints: 100 });
    }
  })();

  // ─── Submissions (100+) ───
  const insertSubmission = db.prepare(`INSERT INTO submissions (assignment_id, student_id, file_path, comment, grade, feedback, graded_by, submitted_at, graded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.transaction(() => {
    for (let i = 0; i < 150; i++) {
      const assignment = getRandomElement(assignmentIds);
      // Ensure student ids are out of the 80 range
      const studentId = getRandomInt(9, 87);
      const grade = getRandomInt(60, 100);
      insertSubmission.run(
          assignment.id, studentId, '', 
          'Submitted work.', grade, 'Good job.', 
          assignment.teacherId, 
          '2024-10-29 14:30:00', '2024-10-31 10:00:00'
      );
    }
    // Also explicitly give Aryan (id 1) some submissions
    insertSubmission.run(1, 1, '', 'My solutions.', 72, 'Good work.', 2, '2024-10-29 14:30:00', '2024-10-31 10:00:00');
  })();

  // ─── Resources ───
  const insertResource = db.prepare(`INSERT INTO resources (title, type, format, size, uploader_id, category, status, views, downloads, featured, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  db.transaction(() => {
    insertResource.run('Advanced Neural Network Architecture', 'Document', 'PDF', '12.4MB', 1, 'Computer Science', 'Live', 12400, 3100, 1, 1);
    insertResource.run('Principles of Qualitative Research', 'Document', 'PDF', '4.2MB', 2, 'Liberal Arts', 'Live', 2100, 450, 0, 1);
    insertResource.run('Quantum Mechanics: Lecture 4', 'Video', 'MP4', '152MB', 4, 'Physics', 'Live', 8700, 1200, 0, 1);
  })();

  console.log('✅ Database seeded with 87 users, assignments, and submissions.');
}
