/**
 * src/pages/StudentDashboard.jsx
 * 
 * Technical Component: Student Portal Interface
 * Description: The primary landing page for authenticated Student accounts.
 * Aggregates data from DataContext to display the student's active assignments,
 * recent academic resources, GPA/Progress metrics, and a quick-view of their
 * enrolled chat channels and upcoming deadlines.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

export default function StudentDashboard() {
  const { user, resources, notes, messages, assignments } = useData();
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState('');

  const studentMaterials = resources.slice(0, 3);
  const recentNotes = notes.slice(0, 3);
  const latestMessages = messages.slice(-3);

  // Assignments data for student — uses my_submission_id / my_grade from the API
  const now = new Date().getTime();
  const pendingAssignments = (assignments || []).filter(a => {
    if (!a.due_date) return false;
    const isGraded = a.my_grade !== null && a.my_grade !== undefined;
    const isSubmitted = a.my_submission_id !== null && a.my_submission_id !== undefined;
    return !isGraded && !isSubmitted && new Date(a.due_date).getTime() >= now;
  });
  
  const overdueAssignments = (assignments || []).filter(a => {
    if (!a.due_date) return false;
    const isGraded = a.my_grade !== null && a.my_grade !== undefined;
    const isSubmitted = a.my_submission_id !== null && a.my_submission_id !== undefined;
    return !isGraded && !isSubmitted && new Date(a.due_date).getTime() < now;
  });
  
  const gradedAssignments = (assignments || []).filter(a => a.my_grade !== null && a.my_grade !== undefined);

  // Dynamic course progress from real graded assignments
  const courseProgress = [];
  const courses = [...new Set((assignments || []).map(a => a.course || 'General'))];
  
  courses.slice(0, 4).forEach((course, i) => {
    const courseAssignments = (assignments || []).filter(a => (a.course || 'General') === course);
    const graded = courseAssignments.filter(a => a.my_grade !== null && a.my_grade !== undefined);
    
    // Calculate simple progression: % of graded assignments out of total in this course
    const pct = courseAssignments.length > 0 ? Math.round((graded.length / courseAssignments.length) * 100) : 0;
    
    courseProgress.push({
      label: course,
      subject: courseAssignments[0]?.title || 'Core Curriculum',
      pct: pct,
      color: i % 2 === 0 ? 'primary' : 'secondary',
      badgeClass: i % 2 === 0 ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-secondary-fixed text-on-secondary-fixed-variant'
    });
  });

  // If no assignments exist yet, show fallback empty states so the UI retains structure
  if (courseProgress.length === 0) {
    courseProgress.push({ label: 'Liberal Arts', subject: 'Philosophy of Ethics', pct: 0, color: 'primary', badgeClass: 'bg-primary-fixed text-on-primary-fixed-variant' });
    courseProgress.push({ label: 'Computer Science', subject: 'Data Structures', pct: 0, color: 'secondary', badgeClass: 'bg-secondary-fixed text-on-secondary-fixed-variant' });
  }

  return (
    <DashboardLayout>
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface dark:text-white mb-3">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="text-on-surface-variant dark:text-slate-400 text-lg font-medium max-w-2xl">
            You've completed <span className="text-primary dark:text-indigo-400 font-black">{user.progress}%</span> of your weekly goals. Your academic momentum is exceptional.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="bg-surface-container-low dark:bg-slate-900 px-5 py-3 rounded-2xl flex items-center gap-4 border border-outline-variant/10 dark:border-slate-800 shadow-sm">
            <div className="h-10 w-10 bg-tertiary-container dark:bg-emerald-900/50 text-on-tertiary-container dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>trending_up</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Streak</p>
              <p className="text-xl font-black text-on-surface dark:text-white">{user.streak} Days</p>
            </div>
          </div>
          <div className="bg-surface-container-low dark:bg-slate-900 px-5 py-3 rounded-2xl flex items-center gap-4 border border-outline-variant/10 dark:border-slate-800 shadow-sm">
            <div className="h-10 w-10 bg-primary-fixed dark:bg-indigo-900/50 text-primary dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Credits</p>
              <p className="text-xl font-black text-on-surface dark:text-white">{user.credits?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* ─── Assignments Overview ─── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-on-surface dark:text-white tracking-tight">Assignments</h3>
              <button onClick={() => navigate('/assignments')} className="text-primary dark:text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Pending */}
              <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-outline-variant/5 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-primary-fixed dark:bg-indigo-900/50 text-primary dark:text-indigo-400 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined">pending_actions</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Pending</p>
                    <p className="text-2xl font-black text-on-surface dark:text-white">{pendingAssignments.length}</p>
                  </div>
                </div>
              </div>
              {/* Overdue */}
              <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-outline-variant/5 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-error-container dark:bg-red-900/50 text-error dark:text-red-400 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined">warning</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Overdue</p>
                    <p className="text-2xl font-black text-on-surface dark:text-white">{overdueAssignments.length}</p>
                  </div>
                </div>
              </div>
              {/* Graded */}
              <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-outline-variant/5 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 bg-tertiary-fixed dark:bg-emerald-900/50 text-tertiary dark:text-emerald-400 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined">grade</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Graded</p>
                    <p className="text-2xl font-black text-on-surface dark:text-white">{gradedAssignments.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming list */}
            {pendingAssignments.length > 0 && (
              <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-5 border border-outline-variant/5 dark:border-slate-800 space-y-3">
                {pendingAssignments.slice(0, 3).map(a => (
                  <div key={a.id} onClick={() => navigate('/assignments')} className="flex items-center justify-between p-4 bg-surface-container-low dark:bg-slate-800 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary dark:text-indigo-400">assignment</span>
                      <div>
                        <h4 className="text-sm font-black text-on-surface dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400">{a.title}</h4>
                        <p className="text-[10px] font-bold text-outline dark:text-slate-500">{a.channel_name || a.subject}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-error uppercase tracking-widest">
                        Due {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingAssignments.length === 0 && overdueAssignments.length === 0 && (
              <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-8 border border-outline-variant/5 dark:border-slate-800 text-center">
                <span className="material-symbols-outlined text-4xl text-outline/30 dark:text-slate-700 mb-2 block">task_alt</span>
                <p className="text-sm font-bold text-on-surface-variant dark:text-slate-500">You're all caught up! No pending assignments.</p>
              </div>
            )}
          </section>

          {/* Progress Overview Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courseProgress.map((course, i) => (
              <div key={i} className="bg-surface-container-lowest dark:bg-slate-900 p-6 rounded-2xl border border-outline-variant/5 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 ${course.badgeClass} dark:bg-slate-800 dark:text-indigo-400 text-[10px] font-black rounded-full uppercase tracking-wider`}>{course.label}</span>
                  <span className={`text-2xl font-black text-${course.color} dark:text-indigo-400`}>{course.pct}%</span>
                </div>
                <h3 className="text-xl font-black text-on-surface dark:text-white mb-4 truncate">{course.subject}</h3>
                <div className="h-2 w-full bg-surface-container-low dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div className={`bg-${course.color} dark:bg-indigo-500 h-full rounded-full transition-all duration-1000`} style={{width: `${course.pct}%`}}></div>
                </div>
                <p className="text-sm text-on-surface-variant dark:text-slate-400 flex items-center gap-2 font-medium">
                  <span className="material-symbols-outlined text-sm">history</span>
                  In Progress
                </p>
              </div>
            ))}
          </section>

          {/* Curriculum Materials Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-on-surface dark:text-white tracking-tight">Curriculum Materials</h3>
              <button onClick={() => navigate('/resources')} className="text-primary dark:text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {studentMaterials.length === 0 && (
                <div className="col-span-3 text-center py-12 bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-outline-variant/5 dark:border-slate-800">
                  <span className="material-symbols-outlined text-4xl text-outline/20 dark:text-slate-700 block mb-3">folder_open</span>
                  <p className="text-sm font-bold text-on-surface-variant dark:text-slate-500">No resources available yet.</p>
                </div>
              )}
              {studentMaterials.map(mat => (
                <div key={mat.id} className="bg-surface-container-lowest dark:bg-slate-900 group cursor-pointer rounded-2xl overflow-hidden border border-outline-variant/5 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="aspect-video relative overflow-hidden bg-surface-container-low dark:bg-slate-800">
                    <img src={mat.thumbnail || 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=400&q=80'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                       {mat.type === 'Video' && <span className="material-symbols-outlined text-white text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>play_circle</span>}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-lg text-primary dark:text-indigo-400">{mat.type === 'Video' ? 'videocam' : mat.type === 'Audio' ? 'headphones' : 'description'}</span>
                      <span className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest">{mat.type} • {mat.format}</span>
                    </div>
                    <h4 className="font-black text-on-surface dark:text-white mb-4 line-clamp-1 text-sm">{mat.title}</h4>
                    <span className="text-primary dark:text-indigo-400 text-sm font-black flex items-center gap-1 group-hover:gap-2 transition-all">
                      Access Module
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Sidebar Widgets */}
        <aside className="space-y-8">
          
          {/* Recent Notes Widget */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 border border-outline-variant/5 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-on-surface dark:text-white">Recent Notes</h3>
              <button onClick={() => navigate('/notes')} className="text-primary dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">View All</button>
            </div>
            <div className="space-y-4">
              {recentNotes.length === 0 && (
                <p className="text-sm text-on-surface-variant dark:text-slate-500 text-center py-6">No notes yet. <button onClick={() => navigate('/notes')} className="text-primary dark:text-indigo-400 font-bold">Create one</button></p>
              )}
              {recentNotes.map(note => (
                <button key={note.id} onClick={() => navigate('/notes')} className="w-full text-left p-4 bg-surface-container-low dark:bg-slate-800 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-black text-on-surface dark:text-white truncate max-w-[180px] group-hover:text-primary dark:group-hover:text-indigo-400">{note.title}</h4>
                    <span className="text-[9px] font-black text-outline dark:text-slate-500 uppercase tracking-widest">{note.category}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400 line-clamp-1">{note.content || 'Empty note...'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Chat Widget */}
          <div className="bg-surface-container-low dark:bg-slate-900 rounded-2xl p-6 border border-outline-variant/5 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-black text-on-surface dark:text-white">Quick Chat</h3>
               <button onClick={() => navigate('/chat')} className="text-primary dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">Open</button>
            </div>
            <div className="space-y-4 mb-6">
              {latestMessages.length === 0 && (
                <p className="text-xs text-on-surface-variant dark:text-slate-500 text-center py-4">No recent messages.</p>
              )}
              {latestMessages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && <img src={msg.sender_avatar} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />}
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[80%] ${
                      isMe
                        ? 'bg-primary dark:bg-indigo-600 text-white rounded-tr-none shadow-md'
                        : 'bg-white dark:bg-slate-800 text-on-surface dark:text-slate-200 rounded-tl-none shadow-sm border border-outline-variant/10 dark:border-slate-700'
                    }`}>
                      {msg.text.length > 60 ? msg.text.slice(0, 60) + '...' : msg.text}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-xl shadow-inner border border-outline-variant/10 dark:border-slate-700">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Reply..." className="flex-1 bg-transparent border-none text-xs outline-none px-2 dark:text-white dark:placeholder-slate-500" />
              <button onClick={() => navigate('/chat')} className="h-8 w-8 bg-primary-fixed dark:bg-indigo-900/50 text-primary dark:text-indigo-400 rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>send</span>
              </button>
            </div>
            
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 dark:bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-primary/10 dark:group-hover:bg-indigo-500/10 transition-all"></div>
          </div>

        </aside>
      </div>
    </DashboardLayout>
  );
}
