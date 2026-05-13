import { useState, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';

export default function Assignments() {
  const { user, assignments, submitAssignment, gradeSubmission, fetchAssignments, createAssignment, fetchSubmissions } = useData();
  const [tab, setTab] = useState('active'); // active | past | create
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [loadingSubs, setLoadingSubs] = useState(false);
  const fileRef = useRef(null);

  // Create form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newPoints, setNewPoints] = useState(100);

  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const now = new Date().getTime();
  const { active, past } = assignments.reduce((acc, a) => {
    if (!a.due_date) return acc; 

    const dueTime = new Date(a.due_date).getTime();
    const hoursSinceDue = (now - dueTime) / (1000 * 60 * 60);
    
    const isGraded = a.my_grade !== null && a.my_grade !== undefined;
    const isSubmitted = a.my_submission_id !== null && a.my_submission_id !== undefined;

    if (a.status === 'Closed' || isGraded || (hoursSinceDue > 24 && !isSubmitted)) {
      acc.past.push(a);
    } else {
      acc.active.push(a);
    }
    return acc;
  }, { active: [], past: [] });

  const activeAssignments = active;
  const pastAssignments = past;

  const viewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setLoadingSubs(true);
    try {
      const subs = await fetchSubmissions(assignment.id);
      setSubmissions(subs);
    } catch {}
    setLoadingSubs(false);
  };

  const handleSubmit = async (assignmentId) => {
    setSubmitting(true);
    try {
      const file = fileRef.current?.files[0] || null;
      await submitAssignment(assignmentId, file, comment);
      setComment('');
      if (fileRef.current) fileRef.current.value = '';
      await fetchAssignments();
    } catch (err) {
      alert(err.message || 'Submission failed');
    }
    setSubmitting(false);
  };

  const handleGrade = async (assignmentId, subId) => {
    try {
      await gradeSubmission(assignmentId, subId, parseInt(gradeInput), feedbackInput);
      setGradeInput('');
      setFeedbackInput('');
      viewSubmissions(selectedAssignment);
    } catch (err) {
      alert(err.message || 'Grading failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAssignment({ title: newTitle, description: newDesc, course: newCourse, due_date: newDue, max_points: newPoints });
      setNewTitle(''); setNewDesc(''); setNewCourse(''); setNewDue(''); setNewPoints(100);
      setTab('active');
      await fetchAssignments();
    } catch (err) {
      alert(err.message || 'Failed to create assignment');
    }
  };

  const getDaysUntil = (date) => {
    const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    return `${diff} days left`;
  };

  return (
    <DashboardLayout>
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface dark:text-white mb-3">Assignments</h1>
            <p className="text-on-surface-variant dark:text-slate-400 text-lg font-medium">
              {isStudent ? 'Track your assignments, submit work, and view grades.' : 'Create assignments, review submissions, and grade student work.'}
            </p>
          </div>
          {isTeacher && (
            <button onClick={() => setTab('create')} className="bg-primary dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-lg">add</span>
              New Assignment
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {['active', 'past'].map(t => (
          <button key={t} onClick={() => { setTab(t); setSelectedAssignment(null); }} className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-primary dark:bg-indigo-600 text-white shadow-md' : 'bg-surface-container-low dark:bg-slate-800 text-outline dark:text-slate-400 hover:text-on-surface dark:hover:text-white'}`}>
            {t === 'active' ? `Active (${activeAssignments.length})` : `Past (${pastAssignments.length})`}
          </button>
        ))}
        {isTeacher && (
          <button onClick={() => setTab('create')} className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${tab === 'create' ? 'bg-primary dark:bg-indigo-600 text-white shadow-md' : 'bg-surface-container-low dark:bg-slate-800 text-outline dark:text-slate-400 hover:text-on-surface dark:hover:text-white'}`}>
            Create
          </button>
        )}
      </div>

      {/* Create Assignment Form */}
      {tab === 'create' && isTeacher && (
        <form onSubmit={handleCreate} className="bg-surface-container-lowest dark:bg-slate-900 p-8 rounded-3xl border border-outline-variant/5 dark:border-slate-800 shadow-lg max-w-2xl space-y-6">
          <h2 className="text-2xl font-black text-on-surface dark:text-white">Create Assignment</h2>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">Title</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="e.g. Research Proposal — AI Ethics" className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm font-medium outline-none border border-outline-variant/10 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">Description</label>
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={4} placeholder="Assignment instructions..." className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm font-medium outline-none border border-outline-variant/10 dark:border-slate-700 resize-none dark:text-white" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">Course</label>
              <input value={newCourse} onChange={e => setNewCourse(e.target.value)} placeholder="Course name" className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm font-medium outline-none border border-outline-variant/10 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">Due Date</label>
              <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} required className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm font-medium outline-none border border-outline-variant/10 dark:border-slate-700 dark:text-white" />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-[2px]">Max Points</label>
              <input type="number" value={newPoints} onChange={e => setNewPoints(e.target.value)} className="w-full px-4 py-3 bg-surface-container-low dark:bg-slate-800 rounded-xl text-sm font-medium outline-none border border-outline-variant/10 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <button type="submit" className="bg-primary dark:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Publish Assignment</button>
        </form>
      )}

      {/* Assignment Cards */}
      {(tab === 'active' || tab === 'past') && !selectedAssignment && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(tab === 'active' ? activeAssignments : pastAssignments).map(a => (
            <div key={a.id} className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-outline-variant/5 dark:border-slate-800 p-6 hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-primary-fixed dark:bg-indigo-900/50 text-on-primary-fixed-variant dark:text-indigo-300">{a.course || 'General'}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${a.status === 'Closed' ? 'text-outline dark:text-slate-500' : getDaysUntil(a.due_date) === 'Overdue' ? 'text-error' : 'text-tertiary dark:text-emerald-400'}`}>
                  {a.status === 'Closed' ? 'Closed' : getDaysUntil(a.due_date)}
                </span>
              </div>
              <h3 className="text-lg font-black text-on-surface dark:text-white mb-2 line-clamp-2 group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors">{a.title}</h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-4 line-clamp-2">{a.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <img src={a.creator_avatar} className="w-6 h-6 rounded-full" alt="" />
                  <span className="text-[10px] font-bold text-outline dark:text-slate-500">{a.creator_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-outline dark:text-slate-500">{a.max_points} pts</span>
                  {isStudent && a.my_submission_id && (
                    <span className="text-[10px] font-black text-tertiary dark:text-emerald-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      {a.my_grade !== null ? `${a.my_grade}/${a.max_points}` : 'Submitted'}
                    </span>
                  )}
                  {isTeacher && (
                    <button onClick={() => viewSubmissions(a)} className="text-primary dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      {a.total_submissions} subs <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Student Submit Area */}
              {isStudent && a.status === 'Active' && !a.my_submission_id && (
                <div className="mt-4 pt-4 border-t border-outline-variant/10 dark:border-slate-800 space-y-3">
                  <input ref={fileRef} type="file" className="w-full text-xs text-on-surface-variant dark:text-slate-400 file:mr-3 file:bg-primary-fixed dark:file:bg-indigo-900/50 file:text-primary dark:file:text-indigo-400 file:border-0 file:rounded-lg file:px-4 file:py-2 file:text-xs file:font-bold file:cursor-pointer" />
                  <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional comment..." className="w-full px-3 py-2 bg-surface-container-low dark:bg-slate-800 rounded-lg text-xs outline-none border border-outline-variant/10 dark:border-slate-700 dark:text-white" />
                  <button onClick={() => handleSubmit(a.id)} disabled={submitting} className="w-full bg-primary dark:bg-indigo-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              )}
              {isStudent && a.my_feedback && (
                <div className="mt-4 pt-3 border-t border-outline-variant/10 dark:border-slate-800">
                  <p className="text-[11px] text-on-surface-variant dark:text-slate-400 bg-surface-container-low dark:bg-slate-800 p-3 rounded-lg border border-outline-variant/5 dark:border-slate-700">
                    <strong className="text-primary dark:text-indigo-400 block mb-1">Teacher Remarks:</strong> 
                    {a.my_feedback}
                  </p>
                </div>
              )}
            </div>
          ))}

          {(tab === 'active' ? activeAssignments : pastAssignments).length === 0 && (
            <div className="col-span-full py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-outline/20 dark:text-slate-700 block mb-4">assignment</span>
              <p className="text-on-surface-variant dark:text-slate-500 font-bold">No {tab} assignments.</p>
            </div>
          )}
        </div>
      )}

      {/* Teacher: Submission Review */}
      {selectedAssignment && isTeacher && (
        <div>
          <button onClick={() => setSelectedAssignment(null)} className="mb-6 text-primary dark:text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Assignments
          </button>

          <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-3xl border border-outline-variant/5 dark:border-slate-800 p-8">
            <h2 className="text-2xl font-black text-on-surface dark:text-white mb-2">{selectedAssignment.title}</h2>
            <p className="text-sm text-on-surface-variant dark:text-slate-400 mb-6">{selectedAssignment.description}</p>

            <h3 className="text-lg font-black text-on-surface dark:text-white mb-4">Submissions ({submissions.length})</h3>

            {loadingSubs && <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto my-12"></div>}

            {!loadingSubs && submissions.length === 0 && (
              <p className="text-center py-12 text-on-surface-variant dark:text-slate-500 font-medium">No submissions yet.</p>
            )}

            <div className="space-y-4">
              {submissions.map(sub => (
                <div key={sub.id} className="bg-surface-container-low dark:bg-slate-800 rounded-2xl p-6 border border-outline-variant/5 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src={sub.student_avatar} className="w-10 h-10 rounded-xl" alt="" />
                      <div>
                        <p className="text-sm font-black text-on-surface dark:text-white">{sub.student_name}</p>
                        <p className="text-[10px] text-outline dark:text-slate-500 font-medium">{sub.student_email} • {new Date(sub.submitted_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {sub.grade !== null ? (
                      <span className="px-4 py-1.5 bg-tertiary-fixed dark:bg-emerald-900/50 text-tertiary dark:text-emerald-400 rounded-full text-sm font-black">{sub.grade}/{selectedAssignment.max_points}</span>
                    ) : (
                      <span className="text-[10px] font-black text-primary dark:text-indigo-400 uppercase tracking-widest">Pending</span>
                    )}
                  </div>

                  {sub.comment && <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-3 italic">"{sub.comment}"</p>}
                  {sub.file_path && (
                    <a href={sub.file_path.startsWith('http') ? sub.file_path : `/uploads/${sub.file_path}`} target="_blank" rel="noreferrer" className="text-primary dark:text-indigo-400 text-xs font-black flex items-center gap-1 mb-3">
                      <span className="material-symbols-outlined text-sm">download</span> Download File
                    </a>
                  )}
                  {sub.feedback && <p className="text-xs text-on-surface-variant dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-lg border border-outline-variant/10 dark:border-slate-700"><strong>Feedback:</strong> {sub.feedback}</p>}

                  {sub.grade === null && (
                    <div className="flex gap-3 mt-4 items-end">
                      <div className="flex-shrink-0">
                        <label className="block text-[9px] font-black text-outline dark:text-slate-500 uppercase tracking-widest mb-1">Grade</label>
                        <input type="number" value={gradeInput} onChange={e => setGradeInput(e.target.value)} placeholder={`/${selectedAssignment.max_points}`} className="w-20 px-3 py-2 bg-white dark:bg-slate-900 rounded-lg text-sm font-bold outline-none border border-outline-variant/10 dark:border-slate-700 dark:text-white" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[9px] font-black text-outline dark:text-slate-500 uppercase tracking-widest mb-1">Feedback</label>
                        <input value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)} placeholder="Optional feedback..." className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-lg text-sm outline-none border border-outline-variant/10 dark:border-slate-700 dark:text-white" />
                      </div>
                      <button onClick={() => handleGrade(selectedAssignment.id, sub.id)} disabled={!gradeInput} className="bg-primary dark:bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40">
                        Grade
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
