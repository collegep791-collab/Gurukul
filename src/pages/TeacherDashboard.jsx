/**
 * src/pages/TeacherDashboard.jsx
 * 
 * Technical Component: Faculty Portal Interface
 * Description: The primary landing page for authenticated Teacher accounts.
 * Provides a high-level overview of active courses, pending assignment submissions
 * requiring grading, published resources, and quick access to student rosters 
 * and moderation tools.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

export default function TeacherDashboard() {
  const { user, resources, assignments, users, notes } = useData();
  const navigate = useNavigate();

  // Teacher-specific stats
  const myResources = resources.filter(r => r.uploader_id === user?.id);
  const myAssignments = assignments.filter(a => a.created_by === user?.id);
  const activeAssignments = myAssignments.filter(a => a.status === 'Active');
  const students = users.filter(u => u.role === 'STUDENT');
  const activeStudents = students.filter(s => s.status === 'Active');

  // Recent resources (all)
  const recentResources = resources.slice(0, 5);

  return (
    <DashboardLayout>
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface dark:text-white mb-3">Faculty Hub</h1>
          <p className="text-on-surface-variant dark:text-slate-400 text-lg font-medium max-w-2xl">
            Welcome back, <span className="text-primary dark:text-indigo-400 font-black">{user?.name?.split(' ').pop()}</span>. Manage your courses, assignments, and academic resources.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => navigate('/assignments')} className="bg-primary dark:bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-lg">add</span>
            New Assignment
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { icon: 'school', label: 'Active Students', val: activeStudents.length, color: 'primary', bg: 'bg-primary-fixed dark:bg-indigo-900/50' },
          { icon: 'assignment', label: 'Active Assignments', val: activeAssignments.length, color: 'secondary', bg: 'bg-secondary-fixed dark:bg-blue-900/50' },
          { icon: 'description', label: 'My Resources', val: myResources.length, color: 'tertiary', bg: 'bg-tertiary-fixed dark:bg-emerald-900/50' },
          { icon: 'trending_up', label: 'Teaching Streak', val: `${user?.streak || 0}d`, color: 'primary', bg: 'bg-primary-fixed dark:bg-indigo-900/50' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container-lowest dark:bg-slate-900 p-6 rounded-2xl border border-outline-variant/5 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-2xl text-${stat.color} dark:text-indigo-400`} style={{fontVariationSettings: "'FILL' 1"}}>{stat.icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">{stat.label}</p>
                <p className="text-2xl font-black text-on-surface dark:text-white">{stat.val}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Active Assignments */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-on-surface dark:text-white tracking-tight">Your Assignments</h3>
              <button onClick={() => navigate('/assignments')} className="text-primary dark:text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                Manage <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {activeAssignments.length === 0 && (
              <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-8 border border-outline-variant/5 dark:border-slate-800 text-center">
                <span className="material-symbols-outlined text-4xl text-outline/30 dark:text-slate-700 mb-2 block">assignment</span>
                <p className="text-sm font-bold text-on-surface-variant dark:text-slate-500">No active assignments. Create one to get started.</p>
              </div>
            )}

            <div className="space-y-3">
              {activeAssignments.slice(0, 4).map(a => (
                <div key={a.id} onClick={() => navigate('/assignments')} className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-5 border border-outline-variant/5 dark:border-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 bg-primary-fixed dark:bg-indigo-900/50 text-primary dark:text-indigo-400 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined">assignment</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-on-surface dark:text-white group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors">{a.title}</h4>
                        <p className="text-[10px] font-bold text-outline dark:text-slate-500">{a.course || 'General'} • {a.max_points} pts</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-error uppercase tracking-widest">
                        Due {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] font-bold text-outline dark:text-slate-500 mt-1">
                        {a.total_submissions || 0} submissions
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Resources */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-on-surface dark:text-white tracking-tight">Recent Resources</h3>
              <button onClick={() => navigate('/resources')} className="text-primary dark:text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-outline-variant/5 dark:border-slate-800 overflow-hidden">
              {recentResources.map((res, i) => (
                <div key={res.id} className={`flex items-center justify-between px-5 py-4 hover:bg-surface-container-low/50 dark:hover:bg-slate-800/50 transition-colors ${i < recentResources.length - 1 ? 'border-b border-outline-variant/5 dark:border-slate-800' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${res.type === 'Video' ? 'bg-secondary-fixed dark:bg-blue-900/50 text-on-secondary-fixed-variant dark:text-blue-400' : res.type === 'Audio' ? 'bg-tertiary-fixed dark:bg-emerald-900/50 text-tertiary dark:text-emerald-400' : 'bg-primary-fixed dark:bg-indigo-900/50 text-primary dark:text-indigo-400'}`}>
                      <span className="material-symbols-outlined text-lg">{res.type === 'Video' ? 'videocam' : res.type === 'Audio' ? 'headphones' : 'description'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface dark:text-white">{res.title}</p>
                      <p className="text-[10px] text-outline dark:text-slate-500 font-medium">{res.category} • {res.size}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest">{res.type}</span>
                </div>
              ))}
              {recentResources.length === 0 && (
                <div className="px-5 py-12 text-center text-on-surface-variant dark:text-slate-500 font-medium">No resources yet.</div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          {/* Student Roster Quick View */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-6 border border-outline-variant/5 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-on-surface dark:text-white">Students</h3>
              <button onClick={() => navigate('/users')} className="text-primary dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">View All</button>
            </div>
            <div className="space-y-3">
              {students.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low dark:hover:bg-slate-800 transition-all">
                  <div className="relative">
                    <img src={s.avatar} className="w-9 h-9 rounded-full" alt="" />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface-container-lowest dark:border-slate-900 ${s.status === 'Active' ? 'bg-tertiary-fixed' : s.status === 'Suspended' ? 'bg-error' : 'bg-outline'}`}></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-on-surface dark:text-white truncate">{s.name}</p>
                    <p className="text-[9px] font-medium text-outline dark:text-slate-500">Progress: {s.progress}%</p>
                  </div>
                  <div className="h-1.5 w-16 bg-surface-container-low dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-primary dark:bg-indigo-500 h-full rounded-full" style={{width: `${s.progress}%`}}></div>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <p className="text-sm text-on-surface-variant dark:text-slate-500 text-center py-6">No students enrolled.</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-primary dark:bg-indigo-900 p-6 rounded-2xl relative overflow-hidden group shadow-lg">
            <div className="relative z-10">
              <h3 className="text-white text-lg font-black mb-2 leading-tight">Quick Actions</h3>
              <p className="text-primary-fixed/80 dark:text-indigo-200 text-xs mb-4 font-medium">Create content and manage your courses.</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => navigate('/resources')} className="bg-white/20 text-white py-2.5 px-4 rounded-xl text-xs font-black hover:bg-white/30 transition-all text-left flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">upload</span>
                  Upload Resource
                </button>
                <button onClick={() => navigate('/chat')} className="bg-white/20 text-white py-2.5 px-4 rounded-xl text-xs font-black hover:bg-white/30 transition-all text-left flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">forum</span>
                  Open Chat
                </button>
              </div>
            </div>
            <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-8xl text-white/10 group-hover:rotate-12 transition-transform duration-500">auto_stories</span>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
