/**
 * src/pages/AuditLogs.jsx
 * 
 * Technical Component: Administrative Audit Trail Viewer
 * Description: Admin-only page that renders a time-ordered table of all significant
 * system events (logins, resource uploads, user suspensions, role changes, moderation
 * actions). Fetches data from the /api/audit endpoint and displays actor details
 * with avatars, action badges, and target entity references. Used for institutional
 * accountability and security compliance.
 * 
 * Dependencies: DataContext (via DashboardLayout), api.js HTTP wrapper
 */
import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../lib/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit?limit=100').then(data => {
      setLogs(data);
      setLoading(false);
    }).catch((e) => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout>
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface dark:text-white mb-3">Audit Logs</h1>
        <p className="text-on-surface-variant dark:text-slate-400 text-lg font-medium max-w-2xl">
          System-wide administrative and security events trail.
        </p>
      </header>
      
      <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl md:rounded-3xl shadow-xl shadow-surface-container-low/50 dark:shadow-slate-950/50 border border-outline-variant/10 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Actor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Action</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Target</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-outline dark:text-slate-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low dark:divide-slate-800">
              {loading && (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              )}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-on-surface-variant dark:text-slate-500 font-bold">
                    No audit logs available.
                  </td>
                </tr>
              )}
              {!loading && logs.map(log => (
                <tr key={log.id} className="hover:bg-surface-container-low/30 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       {log.actor_name ? (
                         <>
                           <img src={log.actor_avatar} className="w-6 h-6 rounded-md" alt="" />
                           <span className="text-xs font-black text-on-surface dark:text-white">{log.actor_name}</span>
                         </>
                       ) : (
                         <span className="text-xs font-black text-outline dark:text-slate-500">System</span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md bg-surface-container-low dark:bg-slate-800 text-[10px] font-black text-primary dark:text-indigo-400 uppercase tracking-widest">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold text-outline dark:text-slate-400">
                      {log.target_type} #{log.target_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-on-surface dark:text-slate-300 line-clamp-2">
                      {log.details || '-'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
