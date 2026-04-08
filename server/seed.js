import db from './db.js';
import bcrypt from 'bcryptjs';

const SALT = bcrypt.genSaltSync(10);
const hash = (pw) => bcrypt.hashSync(pw, SALT);

export default function seed() {
  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) {
    console.log('📦 Database already seeded. Skipping.');
    return;
  }

  console.log('🌱 Seeding database...');

  // ─── Users ───
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, avatar, role, status, credits, streak, progress, date_joined)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    { name: 'Aryan Sharma', email: 'aryan@gurukul.edu', pw: 'password123', avatar: 'https://i.pravatar.cc/150?u=me', role: 'STUDENT', status: 'Active', credits: 1240, streak: 12, progress: 68, joined: '2023-08-15' },
    { name: 'Prof. Sarah Jenkins', email: 'sarah@gurukul.edu', pw: 'password123', avatar: 'https://i.pravatar.cc/150?u=2', role: 'TEACHER', status: 'Active', credits: 3200, streak: 45, progress: 92, joined: '2022-01-05' },
    { name: 'Elena Rodriguez', email: 'elena@gurukul.edu', pw: 'password123', avatar: 'https://i.pravatar.cc/150?u=4', role: 'ADMIN', status: 'Active', credits: 5000, streak: 100, progress: 99, joined: '2021-10-15' },
    { name: 'Dr. Aris Thorne', email: 'aris@gurukul.edu', pw: 'password123', avatar: 'https://i.pravatar.cc/150?u=aris', role: 'TEACHER', status: 'Active', credits: 4100, streak: 67, progress: 88, joined: '2021-06-01' },
    { name: 'Marcus Holloway', email: 'marcus@gurukul.edu', pw: 'password123', avatar: 'https://i.pravatar.cc/150?u=marcus', role: 'STUDENT', status: 'Active', credits: 890, streak: 8, progress: 52, joined: '2023-09-20' },
    { name: 'Julian Vance', email: 'julian@gurukul.edu', pw: 'password123', avatar: 'https://i.pravatar.cc/150?u=1', role: 'STUDENT', status: 'Active', credits: 720, streak: 5, progress: 41, joined: '2023-09-12' },
    { name: 'Tobias Smith', email: 'tobias@gurukul.edu', pw: 'password123', avatar: 'https://i.pravatar.cc/150?u=5', role: 'STUDENT', status: 'Suspended', credits: 200, streak: 0, progress: 15, joined: '2023-11-22' },
    { name: 'Liam Chen', email: 'liam@gurukul.edu', pw: 'password123', avatar: 'https://i.pravatar.cc/150?u=liam', role: 'STUDENT', status: 'Active', credits: 1100, streak: 14, progress: 63, joined: '2023-07-10' },
    { name: 'Dr. Ana Sofia', email: 'ana@gurukul.edu', pw: 'password123', avatar: 'https://i.pravatar.cc/150?u=ana', role: 'TEACHER', status: 'Active', credits: 3800, streak: 55, progress: 85, joined: '2022-03-20' },
    { name: 'Sarah J. Miller', email: 'sarahm@gurukul.edu', pw: 'password123', avatar: 'https://i.pravatar.cc/150?u=sarah', role: 'STUDENT', status: 'Active', credits: 950, streak: 10, progress: 55, joined: '2023-08-01' },
  ];

  const insertUsers = db.transaction(() => {
    for (const u of users) {
      insertUser.run(u.name, u.email, hash(u.pw), u.avatar, u.role, u.status, u.credits, u.streak, u.progress, u.joined);
    }
  });
  insertUsers();

  // ─── Resources ───
  const insertResource = db.prepare(`
    INSERT INTO resources (title, type, format, size, uploader_id, category, status, views, downloads, featured, verified, thumbnail)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const resources = [
    { title: 'Advanced Neural Network Architecture: 2024 Synthesis', type: 'Document', format: 'PDF', size: '12.4MB', uploader: 1, cat: 'Computer Science', status: 'Live', views: 12400, downloads: 3100, featured: 1, verified: 1, thumb: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=800' },
    { title: 'Principles of Qualitative Research', type: 'Document', format: 'PDF', size: '4.2MB', uploader: 2, cat: 'Liberal Arts', status: 'Live', views: 2100, downloads: 450, featured: 0, verified: 1, thumb: '' },
    { title: 'Quantum Mechanics: Lecture 4', type: 'Video', format: 'MP4', size: '152MB', uploader: 4, cat: 'Physics', status: 'Live', views: 8700, downloads: 1200, featured: 0, verified: 1, thumb: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800' },
    { title: 'Ethical Frameworks in AI', type: 'Audio', format: 'MP3', size: '18MB', uploader: 2, cat: 'Ethics', status: 'Live', views: 3400, downloads: 890, featured: 0, verified: 0, thumb: '' },
    { title: 'Modern Compiler Design Patterns', type: 'Document', format: 'PDF', size: '8.1MB', uploader: 4, cat: 'Computer Science', status: 'Live', views: 5600, downloads: 1400, featured: 0, verified: 1, thumb: '' },
    { title: 'Introduction to Topology', type: 'Video', format: 'MP4', size: '210MB', uploader: 9, cat: 'Mathematics', status: 'Processing', views: 980, downloads: 120, featured: 0, verified: 0, thumb: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800' },
    { title: 'Cognitive Psychology: Memory Systems', type: 'Document', format: 'PDF', size: '6.3MB', uploader: 2, cat: 'Psychology', status: 'Live', views: 4200, downloads: 780, featured: 0, verified: 1, thumb: '' },
    { title: 'Ancient Greek Philosophy Podcast', type: 'Audio', format: 'MP3', size: '42MB', uploader: 9, cat: 'Philosophy', status: 'Live', views: 6100, downloads: 2300, featured: 0, verified: 1, thumb: '' },
  ];

  const insertResources = db.transaction(() => {
    for (const r of resources) {
      insertResource.run(r.title, r.type, r.format, r.size, r.uploader, r.cat, r.status, r.views, r.downloads, r.featured, r.verified, r.thumb);
    }
  });
  insertResources();

  // ─── Chat Channels ───
  const insertChannel = db.prepare(`INSERT INTO chat_channels (name, description, type) VALUES (?, ?, ?)`);
  const insertMember = db.prepare(`INSERT INTO chat_channel_members (channel_id, user_id) VALUES (?, ?)`);
  const insertMsg = db.prepare(`INSERT INTO chat_messages (channel_id, sender_id, text, pinned, created_at) VALUES (?, ?, ?, ?, ?)`);

  const seedChat = db.transaction(() => {
    // Channels
    insertChannel.run('general-research', 'Open research discussions for all scholars', 'channel');       // id=1
    insertChannel.run('faculty-announcements', 'Official faculty and administrative notices', 'channel');  // id=2
    insertChannel.run('project-alpha', 'Collaborative workspace for Project Alpha team', 'channel');       // id=3

    // Add all users to general
    for (let i = 1; i <= 10; i++) insertMember.run(1, i);
    // Faculty channel: teachers + admins
    for (const uid of [2, 3, 4, 9]) insertMember.run(2, uid);
    // Project alpha: select users
    for (const uid of [1, 4, 5, 8]) insertMember.run(3, uid);

    // Seed messages in general-research
    insertMsg.run(1, 4, "Good morning, everyone. I've posted the updated lecture notes for the quantum entanglement seminar. Please review Section 3.2 before Thursday.", 0, '2024-10-24 10:42:00');
    insertMsg.run(1, 1, "Thanks, Professor! I was just looking for these. I'll make sure to go through the entanglement diagrams.", 0, '2024-10-24 10:45:00');
    insertMsg.run(1, 5, "Has anyone found a good resource on Bell's inequality proofs? I'm struggling with the mathematical formulation.", 0, '2024-10-24 11:02:00');
    insertMsg.run(1, 2, "I recommend the Sakurai textbook, Chapter 4. There's also an excellent MIT OCW lecture on this topic.", 0, '2024-10-24 11:15:00');
    insertMsg.run(1, 8, "The research proposal deadline is next week. Don't forget to submit your drafts for peer review by Wednesday.", 1, '2024-10-24 11:30:00');
    insertMsg.run(1, 4, "Excellent reminder, Liam. I'll be holding extra office hours on Tuesday for anyone who needs feedback on their proposals.", 0, '2024-10-24 11:45:00');

    // Faculty announcements
    insertMsg.run(2, 3, "Reminder: All mid-semester grades must be submitted by November 10th. Please use the new grading portal.", 1, '2024-10-23 09:00:00');
    insertMsg.run(2, 2, "The faculty retreat has been confirmed for December 8-9. RSVP on the Events page.", 0, '2024-10-23 14:30:00');

    // Project alpha
    insertMsg.run(3, 4, "Team, I've set up the shared repository for Project Alpha. Please clone it and review the initial architecture doc.", 0, '2024-10-22 16:00:00');
    insertMsg.run(3, 1, "Done! The architecture looks solid. I have a few suggestions for the data pipeline — I'll push a PR tonight.", 0, '2024-10-22 17:20:00');
  });
  seedChat();

  // ─── Moderation Queue ───
  const insertMod = db.prepare(`INSERT INTO moderation_queue (user_id, reason, details) VALUES (?, ?, ?)`);
  insertMod.run(10, 'Reported', 'Shared content flagged as "Copyright Infringement" by institutional bots.');
  insertMod.run(8, 'Manual Check', 'Request for elevated privileges to "Department Head".');
  insertMod.run(9, 'Verification', 'Credentials update pending verification from university database.');

  // ─── Notes (sample for Aryan) ───
  const insertNote = db.prepare(`INSERT INTO notes (user_id, title, content, category) VALUES (?, ?, ?, ?)`);
  insertNote.run(1, 'Quantum Entanglement Summary', 'Bell states form the backbone of quantum entanglement. Key points:\n\n1. EPR Paradox — Einstein, Podolsky, Rosen (1935)\n2. Bell\'s Theorem — proves no local hidden variable theory can reproduce quantum mechanics\n3. Experimental verification — Aspect experiments (1982)\n\nNeed to review: density matrices and partial trace operations.', 'Physics');
  insertNote.run(1, 'Research Proposal Draft', '# AI-Driven Pedagogical Frameworks\n\n## Abstract\nThis proposal explores how large language models can be integrated into university curricula to provide personalized, adaptive learning experiences.\n\n## Key Research Questions\n- How does AI tutoring compare to traditional office hours?\n- What are the ethical implications of AI-graded assessments?\n\n## Timeline\n- Week 1-3: Literature review\n- Week 4-6: Prototype development\n- Week 7-8: User study', 'Research');
  insertNote.run(1, 'Data Structures Cheat Sheet', '## Hash Tables\n- Average O(1) lookup, insert, delete\n- Worst case O(n) with poor hash function\n- Load factor = n/m (keep below 0.75)\n\n## Binary Search Trees\n- Balanced: O(log n) operations\n- AVL trees: strict balance, slower inserts\n- Red-black trees: relaxed balance, faster inserts\n\n## Graphs\n- BFS: O(V+E), level-order, shortest path (unweighted)\n- DFS: O(V+E), topological sort, cycle detection', 'Computer Science');

  // ─── User Settings ───
  const insertSettings = db.prepare(`INSERT INTO user_settings (user_id, theme, two_factor, notify_resources, notify_mentions, notify_updates) VALUES (?, ?, ?, ?, ?, ?)`);
  for (let i = 1; i <= 10; i++) {
    insertSettings.run(i, 'light', 1, 1, 1, 0);
  }

  // ─── Assignments ───
  const insertAssignment = db.prepare(`INSERT INTO assignments (title, description, course, due_date, max_points, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertAssignment.run('Research Proposal — AI Ethics', 'Write a 2000-word proposal examining the ethical implications of AI in education. Include at least 5 peer-reviewed citations.', 'Ethics in AI', '2024-11-15', 100, 2, 'Active');
  insertAssignment.run('Quantum Computing Problem Set #3', 'Solve problems 4.1–4.8 from the Sakurai textbook. Show all work and include diagrams for spin states.', 'Quantum Mechanics', '2024-11-08', 50, 4, 'Active');
  insertAssignment.run('Data Pipeline Architecture Report', 'Design and document a real-time data pipeline for the Project Alpha dataset. Include system diagrams and performance benchmarks.', 'Systems Design', '2024-11-20', 100, 4, 'Active');
  insertAssignment.run('Introduction to Topology — Midterm Review', 'Complete the practice midterm (posted in Resource Hub). Submit your solutions as a single PDF.', 'Mathematics', '2024-10-30', 80, 9, 'Closed');

  // Sample submissions
  const insertSubmission = db.prepare(`INSERT INTO submissions (assignment_id, student_id, file_path, comment, grade, feedback, graded_by, submitted_at, graded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertSubmission.run(4, 1, '', 'My solutions for the topology midterm review.', 72, 'Good work on the fundamental group calculations. Review the long exact sequence section.', 9, '2024-10-29 14:30:00', '2024-10-31 10:00:00');
  insertSubmission.run(4, 5, '', 'Attached my midterm solutions.', 85, 'Excellent! Very clear proofs.', 9, '2024-10-29 16:45:00', '2024-10-31 10:30:00');

  // ─── Notifications (sample for Aryan) ───
  const insertNotif = db.prepare(`INSERT INTO notifications (user_id, type, title, body, link, read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertNotif.run(1, 'assignment', 'New Assignment', '"Research Proposal — AI Ethics" — due 2024-11-15', '/assignments', 0, '2024-10-24 08:00:00');
  insertNotif.run(1, 'grade', 'Assignment Graded', 'You scored 72 on "Introduction to Topology — Midterm Review"', '/assignments', 0, '2024-10-31 10:00:00');
  insertNotif.run(1, 'resource', 'New Resource Available', '"Advanced Neural Network Architecture" was uploaded to the Resource Hub.', '/resources', 1, '2024-10-20 14:00:00');
  insertNotif.run(1, 'info', 'Welcome to Gurukul', 'Your academic journey begins here. Explore resources, chat with peers, and track your progress.', '/', 1, '2023-08-15 09:00:00');

  console.log('✅ Database seeded successfully!');
  console.log('   → 10 users (login: any email, password: password123)');
  console.log('   → 8 resources');
  console.log('   → 3 chat channels with messages');
  console.log('   → 3 moderation items');
  console.log('   → 3 sample notes for Aryan');
  console.log('   → 4 assignments (1 closed, 3 active)');
  console.log('   → 4 notifications for Aryan');
}
