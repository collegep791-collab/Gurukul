import bcrypt from 'bcryptjs';
import supabase from './supabase.js';

const SALT = bcrypt.genSaltSync(10);
const hash = (pw) => bcrypt.hashSync(pw, SALT);

export default async function seed() {
  if (!supabase) {
    console.log('⚠️ Supabase client not initialized. Skipping seed.');
    return;
  }

  const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
  
  if (count > 0) {
    console.log('📦 Database already seeded. Skipping.');
    return;
  }

  console.log('🌱 Seeding Supabase database...');

  const users = [
    { name: 'System Admin', email: 'admin@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Admin', role: 'ADMIN', status: 'Active', credits: 5000, streak: 100, progress: 99, date_joined: '2021-10-15' },
    { name: 'Prof. Guide', email: 'teacher@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Teacher', role: 'TEACHER', status: 'Active', credits: 3200, streak: 45, progress: 92, date_joined: '2022-01-05' },
    { name: 'Student One', email: 'student@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Student', role: 'STUDENT', status: 'Active', credits: 1240, streak: 12, progress: 68, date_joined: '2023-08-15' }
  ];

  const insertedUsers = [];

  for (const u of users) {
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name: u.name,
        email: u.email,
        password_hash: hash(u.pw),
        avatar: u.avatar,
        role: u.role,
        status: u.status,
        credits: u.credits,
        streak: u.streak,
        progress: u.progress,
        date_joined: u.date_joined
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error inserting user:', u.email, error);
    } else {
      insertedUsers.push(newUser);
      // Create settings
      await supabase.from('user_settings').insert({
        user_id: newUser.id,
        theme: 'light',
        two_factor: 1,
        notify_resources: 1,
        notify_mentions: 1,
        notify_updates: 0
      });
    }
  }

  // Create Global Chat Channel
  const { data: channel, error: channelError } = await supabase
    .from('chat_channels')
    .insert({
      name: 'Campus Hub',
      description: 'Global announcements and general chat for all students and faculty.',
      type: 'channel',
      created_by: insertedUsers[0]?.id
    })
    .select()
    .single();

  if (channel && !channelError) {
    for (const u of insertedUsers) {
      await supabase.from('chat_channel_members').insert({
        channel_id: channel.id,
        user_id: u.id
      });
    }
  }

  console.log('✅ Supabase database seeded with base users and Campus Hub channel.');
}

// Support running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => process.exit(0));
}
