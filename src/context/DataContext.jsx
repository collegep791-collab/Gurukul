/**
 * DataContext.jsx
 * 
 * Technical Component: Global State Manager & API Controller
 * Description: This context provider is the backbone of the frontend.
 * It manages the global application state (user session, resources, chat messages, etc.)
 * and wraps all REST API calls to the Express/Vercel backend using Axios.
 * It also manages the Supabase Realtime WebSocket connections for live chat and notifications.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api.js';
import { supabase } from '../lib/supabase.js';
import { useTheme } from './ThemeContext.jsx';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { syncFromServer } = useTheme();

  // ─── Auth State ───
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Data State ───
  const [resources, setResources] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState({});

  // Realtime subscriptions ref
  const realtimeSubscriptions = useRef([]);

  // ─── Auth ───
  const checkAuth = useCallback(async () => {
    try {
      const userData = await api.get('/auth/me');
      try {
        const checkin = await api.post('/streaks/checkin');
        userData.streak = checkin.streak;
        userData.credits = checkin.credits;
      } catch {}
      
      setUser(userData);
      if (userData.settings?.theme) {
        syncFromServer(userData.settings.theme);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, [syncFromServer]);

  const handleAuthSuccess = async (userData) => {
    try {
      const checkin = await api.post('/streaks/checkin');
      userData.streak = checkin.streak;
      userData.credits = checkin.credits;
    } catch {}
    setUser(userData);
    try {
      const settings = await api.get('/settings');
      if (settings?.theme) syncFromServer(settings.theme);
    } catch {}
    return userData;
  };

  const login = useCallback(async (email, password, roleStr) => {
    const userData = await api.post('/auth/login', { email, password, role: roleStr || 'STUDENT' });
    return handleAuthSuccess(userData);
  }, []);

  const register = useCallback(async (name, email, password, usn, studentClass, section) => {
    const userData = await api.post('/auth/register', { name, email, password, usn, class: studentClass, section });
    return handleAuthSuccess(userData);
  }, []);

  const createUser = useCallback(async (payload) => {
    return await api.post('/users', payload);
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const userData = await api.post('/auth/google', { credential });
    return handleAuthSuccess(userData);
  }, []);

  const cleanupRealtime = useCallback(() => {
    realtimeSubscriptions.current.forEach(sub => supabase.removeChannel(sub));
    realtimeSubscriptions.current = [];
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
    setResources([]);
    setMessages([]);
    setChannels([]);
    setNotes([]);
    setAssignments([]);
    setNotifications([]);
    setUnreadCount(0);
    cleanupRealtime();
  }, [cleanupRealtime]);

  // ─── Resources ───
  const fetchResources = useCallback(async () => {
    try { setResources(await api.get('/resources')); } catch {}
  }, []);

  const addResource = useCallback(async (resource, file) => {
    let newRes;
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(resource).forEach(([k, v]) => formData.append(k, v));
      newRes = await api.upload('/resources', formData);
    } else {
      newRes = await api.post('/resources', resource);
    }
    setResources(prev => [newRes, ...prev]);
    return newRes;
  }, []);

  const deleteResource = useCallback(async (id) => {
    await api.delete(`/resources/${id}`);
    setResources(prev => prev.filter(r => r.id !== id));
  }, []);

  // ─── Users ───
  const fetchUsers = useCallback(async () => {
    try { setUsers(await api.get('/users')); } catch {}
  }, []);

  const updateUserRole = useCallback(async (id, role) => {
    const updated = await api.patch(`/users/${id}/role`, { role });
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    return updated;
  }, []);

  const toggleUserSuspend = useCallback(async (id) => {
    const updated = await api.patch(`/users/${id}/suspend`);
    setUsers(prev => prev.map(u => u.id === id ? updated : u));
    return updated;
  }, []);

  // ─── Chat ───
  const fetchChannels = useCallback(async () => {
    try {
      const data = await api.get('/chat/channels');
      setChannels(data);
      if (data.length > 0 && !activeChannelId) {
        setActiveChannelId(data[0].id);
      }
    } catch {}
  }, [activeChannelId]);

  const createChannel = useCallback(async (payload) => {
    const channel = await api.post('/chat/channels', payload);
    setChannels(prev => [...prev, channel]);
    return channel;
  }, []);

  const fetchMessages = useCallback(async (channelId) => {
    if (!channelId) return;
    try { setMessages(await api.get(`/chat/channels/${channelId}/messages`)); } catch {}
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!activeChannelId) return;
    const newMsg = await api.post(`/chat/channels/${activeChannelId}/messages`, { text });
    setMessages(prev => {
      if (prev.some(m => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  }, [activeChannelId]);

  const switchChannel = useCallback(async (channelId) => {
    setActiveChannelId(channelId);
    setTypingUsers({});
    await fetchMessages(channelId);
  }, [fetchMessages]);

  const broadcastTyping = useCallback(() => {
    if (activeChannelId && user) {
      const typingChannel = supabase.channel(`typing:${activeChannelId}`);
      typingChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, userName: user.name }
      });
    }
  }, [activeChannelId, user]);

  // ─── Notes ───
  const fetchNotes = useCallback(async () => {
    try { setNotes(await api.get('/notes')); } catch {}
  }, []);

  const createNote = useCallback(async (note) => {
    const newNote = await api.post('/notes', note);
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, []);

  const updateNote = useCallback(async (id, updates) => {
    const updated = await api.put(`/notes/${id}`, updates);
    setNotes(prev => prev.map(n => n.id === id ? updated : n));
    return updated;
  }, []);

  const deleteNote = useCallback(async (id) => {
    await api.delete(`/notes/${id}`);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // ─── Assignments ───
  const fetchAssignments = useCallback(async () => {
    try { setAssignments(await api.get('/assignments')); } catch {}
  }, []);

  const createAssignment = useCallback(async (data) => {
    const a = await api.post('/assignments', data);
    setAssignments(prev => [a, ...prev]);
    return a;
  }, []);

  const submitAssignment = useCallback(async (assignmentId, file, comment) => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (comment) formData.append('comment', comment);
    const sub = await api.upload(`/assignments/${assignmentId}/submit`, formData);
    return sub;
  }, []);

  const fetchSubmissions = useCallback(async (assignmentId) => {
    return await api.get(`/assignments/${assignmentId}/submissions`);
  }, []);

  const gradeSubmission = useCallback(async (assignmentId, subId, grade, feedback) => {
    return await api.patch(`/assignments/${assignmentId}/submissions/${subId}/grade`, { grade, feedback });
  }, []);

  // ─── Notifications ───
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
    } catch {}
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api.get('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch {}
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.post('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
    setUnreadCount(0);
  }, []);

  // ─── Moderation ───
  const fetchModeration = useCallback(async () => {
    try { setModerationQueue(await api.get('/moderation')); } catch {}
  }, []);

  const approveModeration = useCallback(async (id) => {
    await api.patch(`/moderation/${id}`, { status: 'Approved' });
    setModerationQueue(prev => prev.filter(m => m.id !== id));
  }, []);

  const rejectModeration = useCallback(async (id) => {
    await api.patch(`/moderation/${id}`, { status: 'Rejected' });
    setModerationQueue(prev => prev.filter(m => m.id !== id));
  }, []);

  // ─── Metrics ───
  const fetchMetrics = useCallback(async () => {
    try { setMetrics(await api.get('/metrics')); } catch {}
  }, []);

  // ─── Supabase Realtime Integration (Vercel Replacement for WebSockets) ───
  const connectRealtime = useCallback(() => {
    if (!user) return;
    cleanupRealtime();

    // 1. Listen for new chat messages
    const messagesSub = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const newMsg = payload.new;
        // Check if message belongs to active channel
        if (newMsg.channel_id === activeChannelId) {
          // Fetch sender details manually since Realtime payload doesn't do JOINs automatically
          const { data: sender } = await supabase.from('users').select('name, avatar').eq('id', newMsg.sender_id).single();
          const enrichedMsg = { ...newMsg, sender_name: sender?.name, sender_avatar: sender?.avatar };
          setMessages(prev => {
            if (prev.some(m => m.id === enrichedMsg.id)) return prev;
            return [...prev, enrichedMsg];
          });
        }
      })
      .subscribe();

    // 2. Listen for notifications
    const notificationsSub = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    // 3. Setup Typing Broadcaster (using Supabase Presence/Broadcast)
    const typingSub = supabase.channel(`typing:${activeChannelId}`);
    if (activeChannelId) {
      typingSub
        .on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload.userId !== user.id) {
            setTypingUsers(prev => ({ 
              ...prev, 
              [payload.payload.userId]: { name: payload.payload.userName, time: Date.now() } 
            }));
          }
        })
        .subscribe();
    }

    realtimeSubscriptions.current = [messagesSub, notificationsSub, typingSub];
  }, [user, activeChannelId, cleanupRealtime]);

  // ─── Effects ───
  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (user) {
      fetchResources();
      fetchChannels();
      fetchUsers();
      fetchNotes();
      fetchAssignments();
      fetchNotifications();
      fetchUnreadCount();
      if (user.role === 'ADMIN') {
        fetchModeration();
        fetchMetrics();
      }
    }
  }, [user, fetchResources, fetchChannels, fetchUsers, fetchNotes, fetchAssignments, fetchNotifications, fetchUnreadCount, fetchModeration, fetchMetrics]);

  useEffect(() => {
    if (activeChannelId) fetchMessages(activeChannelId);
  }, [activeChannelId, fetchMessages]);

  useEffect(() => {
    if (user) connectRealtime();
    return () => cleanupRealtime();
  }, [user, activeChannelId, connectRealtime, cleanupRealtime]);

  return (
    <DataContext.Provider value={{
      searchQuery, setSearchQuery,
      user, setUser, authLoading, login, register, googleLogin, logout, checkAuth,
      resources, addResource, deleteResource, fetchResources,
      users, fetchUsers, updateUserRole, toggleUserSuspend, createUser,
      channels, activeChannelId, messages, sendMessage, switchChannel, fetchChannels, createChannel, broadcastTyping, typingUsers,
      notes, createNote, updateNote, deleteNote, fetchNotes,
      assignments, createAssignment, submitAssignment, fetchAssignments, fetchSubmissions, gradeSubmission,
      notifications, unreadCount, fetchNotifications, fetchUnreadCount, markNotificationRead, markAllRead,
      moderationQueue, approveModeration, rejectModeration,
      metrics, fetchMetrics,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}
