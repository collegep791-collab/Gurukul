import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api.js';
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

  // WebSocket ref
  const wsRef = useRef(null);

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

  const login = useCallback(async (email, password) => {
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

  const login = useCallback(async (email, password) => {
    const userData = await api.post('/auth/login', { email, password });
    return handleAuthSuccess(userData);
  }, []);

  const register = useCallback(async (name, email, password, roleStr) => {
    const userData = await api.post('/auth/register', { name, email, password, role: roleStr || 'STUDENT' });
    return handleAuthSuccess(userData);
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const userData = await api.post('/auth/google', { credential });
    return handleAuthSuccess(userData);
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
    if (wsRef.current) wsRef.current.close();
  }, []);

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

  const fetchMessages = useCallback(async (channelId) => {
    if (!channelId) return;
    try { setMessages(await api.get(`/chat/channels/${channelId}/messages`)); } catch {}
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!activeChannelId) return;
    await api.post(`/chat/channels/${activeChannelId}/messages`, { text });
  }, [activeChannelId]);

  const switchChannel = useCallback(async (channelId) => {
    setActiveChannelId(channelId);
    setTypingUsers({});
    await fetchMessages(channelId);
  }, [fetchMessages]);

  const broadcastTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && activeChannelId) {
      wsRef.current.send(JSON.stringify({ type: 'typing', channelId: activeChannelId }));
    }
  }, [activeChannelId]);

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

  // ─── WebSocket ───
  const connectWebSocket = useCallback(() => {
    if (!user) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', userId: user.id }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message' && data.channelId === activeChannelId) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
        if (data.type === 'notification') {
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
        if (data.type === 'typing' && data.channelId === activeChannelId) {
          setTypingUsers(prev => ({ ...prev, [data.userId]: { name: data.userName, time: Date.now() } }));
        }
      } catch {}
    };

    ws.onclose = () => {
      setTimeout(() => connectWebSocket(), 3000);
    };

    wsRef.current = ws;
  }, [user, activeChannelId]);

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
    if (user) connectWebSocket();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [user, connectWebSocket]);

  return (
    <DataContext.Provider value={{
      // Search
      searchQuery, setSearchQuery,
      // Auth
      user, setUser, authLoading, login, register, googleLogin, logout, checkAuth,
      // Resources
      resources, addResource, deleteResource, fetchResources,
      // Users
      users, fetchUsers, updateUserRole, toggleUserSuspend,
      // Chat
      channels, activeChannelId, messages, sendMessage, switchChannel, fetchChannels, broadcastTyping, typingUsers,
      // Notes
      notes, createNote, updateNote, deleteNote, fetchNotes,
      // Assignments
      assignments, createAssignment, submitAssignment, fetchAssignments, fetchSubmissions, gradeSubmission,
      // Notifications
      notifications, unreadCount, fetchNotifications, fetchUnreadCount, markNotificationRead, markAllRead,
      // Moderation
      moderationQueue, approveModeration, rejectModeration,
      // Metrics
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
