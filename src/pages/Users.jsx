/**
 * src/pages/Users.jsx
 * 
 * Technical Component: Institutional Directory & Identity Management
 * Description: Acts as the primary directory for the campus. Standard users can
 * browse profiles and initiate direct messages. Admins possess elevated controls 
 * to suspend accounts, override roles, or manually provision new user identities.
 */
import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

export default function Users() {
  const { users, toggleUserSuspend, updateUserRole, createUser, fetchUsers } = useData();
  const [filterRole, setFilterRole] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'STUDENT', usn: '', class: '1st Year', section: 'A' });
  const [addingUser, setAddingUser] = useState(false);

  const handleSuspend = async (uid) => {
    setUpdating(uid);
    try { await toggleUserSuspend(uid); } catch(e) { alert('Failed to suspend'); }
    setUpdating(null);
  };

  const handleRoleChange = async (uid, role) => {
    setUpdating(uid);
    try { await updateUserRole(uid, role); } catch(e) { alert('Failed to update role'); }
    setUpdating(null);
  };

  const filteredUsers = (filterRole === 'All' 
    ? users 
    : users.filter(u => u.role === filterRole.toUpperCase())
  ).filter(u => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    try {
      await createUser(addForm);
      await fetchUsers();
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', role: 'STUDENT', usn: '', class: '1st Year', section: 'A' });
    } catch(err) {
      alert('Failed to add user: ' + (err.message || err.error || 'Unknown error'));
    }
    setAddingUser(false);
  };

  return (
    <DashboardLayout>
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface dark:text-white mb-3">User Management</h1>
          <p className="text-on-surface-variant dark:text-slate-400 text-lg font-medium max-w-2xl">
            Audit institutional roles, manage permissions, and oversee the academic registry.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary dark:bg-indigo-600 text-white flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          Add New User
        </button>
      </header>

      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-xl shadow-surface-container-low/50 dark:shadow-slate-950/50 border border-outline-variant/10 dark:border-slate-800 overflow-hidden">
        
        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 border-b border-outline-variant/10 dark:border-slate-800">
          <div className="flex gap-2 flex-wrap">
            {['All', 'Student', 'Teacher', 'Admin'].map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  filterRole === role 
                    ? 'bg-primary dark:bg-indigo-600 text-white shadow-md shadow-primary/20' 
                    : 'bg-surface-container-low dark:bg-slate-800 text-outline dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-surface-container-high dark:hover:bg-slate-700'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline dark:text-slate-500 text-sm">search</span>
              <input 
                className="pl-10 pr-4 py-2 bg-surface-container-low dark:bg-slate-800 border-none rounded-xl text-sm font-medium w-56 outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white dark:placeholder-slate-500" 
                placeholder="Search users..." 
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <p className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{filteredUsers.length} Users</p>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Scholar</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Role</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500 hidden md:table-cell">Credits</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500 hidden md:table-cell">Streak</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500 hidden lg:table-cell">Joined</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low dark:divide-slate-800">
              {paginatedUsers.map(u => (
                <tr key={u.id} className="hover:bg-surface-container-low/30 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={u.avatar} className="h-10 w-10 rounded-xl object-cover border-2 border-surface-container-low dark:border-slate-800 group-hover:border-primary/20 dark:group-hover:border-indigo-500/20 transition-colors" alt="" />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-container-lowest dark:border-slate-900 ${u.status === 'Active' ? 'bg-tertiary-fixed' : u.status === 'Suspended' ? 'bg-error' : 'bg-outline'}`}></span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-on-surface dark:text-white">{u.name}</p>
                        <p className="text-[10px] font-bold text-outline dark:text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={u.role} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updating === u.id}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer ${
                        u.role === 'ADMIN' ? 'bg-error-container dark:bg-red-900/30 text-on-error-container dark:text-red-300' :
                        u.role === 'TEACHER' ? 'bg-tertiary-fixed dark:bg-emerald-900/30 text-on-tertiary-fixed dark:text-emerald-300' :
                        'bg-primary-fixed dark:bg-indigo-900/30 text-on-primary-fixed-variant dark:text-indigo-300'
                      }`}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="STUDENT">Student</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-sm font-black text-on-surface dark:text-white">{(u.credits || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-tertiary-fixed">local_fire_department</span>
                      <p className="text-sm font-bold text-on-surface dark:text-white">{u.streak || 0}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-tertiary-fixed' : u.status === 'Suspended' ? 'bg-error' : 'bg-outline'}`}></span>
                      <span className="text-xs font-bold text-on-surface dark:text-slate-300">{u.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <p className="text-xs font-medium text-on-surface-variant dark:text-slate-400">{u.date_joined || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleSuspend(u.id)}
                        disabled={updating === u.id}
                        className="p-2 text-outline dark:text-slate-500 hover:text-error dark:hover:text-red-400 transition-colors rounded-lg hover:bg-surface-container-low dark:hover:bg-slate-800"
                        title={u.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {u.status === 'Suspended' ? 'check_circle' : 'block'}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined text-5xl text-outline/20 dark:text-slate-700 block mb-4">group_off</span>
                    <p className="text-on-surface-variant dark:text-slate-500 font-bold">No users found matching this filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-outline-variant/10 dark:border-slate-800">
          <p className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest">Showing {paginatedUsers.length} of {filteredUsers.length} scholars</p>
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage <= 1}
              className="h-9 w-9 border border-outline-variant/20 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-surface-container-low dark:hover:bg-slate-800 transition-all text-outline dark:text-slate-400 disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-xs font-black text-on-surface dark:text-white min-w-[40px] text-center">{currentPage}/{totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage >= totalPages}
              className="h-9 w-9 border border-outline-variant/20 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-surface-container-low dark:hover:bg-slate-800 transition-all text-outline dark:text-slate-400 disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in duration-200 border border-outline-variant/10 dark:border-slate-800">
            <h2 className="text-2xl font-black text-on-surface dark:text-white mb-6">Create New User</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="Full Name" required className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
                <input value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} type="email" placeholder="Email" required className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} placeholder="Password (min 6)" required className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
                <select value={addForm.role} onChange={e => setAddForm({...addForm, role: e.target.value})} className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white">
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="pt-2 border-t border-outline-variant/10 dark:border-slate-800">
                <p className="text-xs font-bold text-outline dark:text-slate-500 uppercase tracking-widest mb-3">Academic Info</p>
                <div className="grid grid-cols-3 gap-3">
                  <input value={addForm.usn} onChange={e => setAddForm({...addForm, usn: e.target.value})} placeholder="USN" className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
                  <select value={addForm.class} onChange={e => setAddForm({...addForm, class: e.target.value})} className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white">
                    <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
                  </select>
                  <select value={addForm.section} onChange={e => setAddForm({...addForm, section: e.target.value})} className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 dark:text-white">
                    <option>A</option><option>B</option><option>C</option><option>D</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-surface-container-high dark:bg-slate-800 hover:bg-surface-container-highest dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" disabled={addingUser} className="flex-1 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-primary dark:bg-indigo-600 text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-center">
                  {addingUser ? 'Saving...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
