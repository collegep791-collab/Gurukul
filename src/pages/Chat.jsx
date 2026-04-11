import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useData } from '../context/DataContext';
import api from '../lib/api';

export default function Chat() {
  const { user, channels, activeChannelId, messages, sendMessage, switchChannel, fetchChannels, broadcastTyping, typingUsers } = useData();
  const [inputMsg, setInputMsg] = useState('');
  const [channelMembers, setChannelMembers] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Fetch channel context when channel changes
  useEffect(() => {
    if (!activeChannelId) return;
    api.get(`/chat/channels/${activeChannelId}/members`).then(setChannelMembers).catch(() => {});
    api.get(`/chat/channels/${activeChannelId}/pinned`).then(setPinnedMessages).catch(() => {});
  }, [activeChannelId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    await sendMessage(inputMsg);
    setInputMsg('');
  };

  const handleStartDM = async (targetUserId) => {
    try {
      const channel = await api.post('/chat/dm', { targetUserId });
      await fetchChannels();
      switchChannel(channel.id);
    } catch (err) {
      console.error('Failed to start DM:', err);
    }
  };

  const loadOlderMessages = async () => {
    if (loadingOlder || !activeChannelId || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldestId = messages[0]?.id;
      const older = await api.get(`/chat/channels/${activeChannelId}/messages?before=${oldestId}&limit=30`);
      if (older.length === 0) { setHasMoreMessages(false); }
    } catch {} 
    setLoadingOlder(false);
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const publicChannels = channels.filter(c => c.type === 'channel');
  const dmChannels = channels.filter(c => c.type === 'dm');

  const typingUserList = Object.values(typingUsers || {}).filter(u => Date.now() - u.time < 3000);
  let typingText = '';
  if (typingUserList.length === 1) typingText = `${typingUserList[0].name} is typing...`;
  else if (typingUserList.length > 1) typingText = 'Several people are typing...';

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-160px)] bg-surface-container-lowest dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/10 dark:border-slate-800">
        
        {/* Channel Sidebar */}
        <aside className="hidden md:flex w-64 bg-surface-container-low dark:bg-slate-900/80 border-r border-outline-variant/10 dark:border-slate-800 flex-col flex-shrink-0">
          <div className="p-6">
            <h2 className="text-xl font-black text-on-surface dark:text-white tracking-tight mb-6">Channels</h2>
            <div className="space-y-1">
              {publicChannels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => switchChannel(ch.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${
                    activeChannelId === ch.id
                      ? 'bg-white dark:bg-slate-800 text-primary dark:text-indigo-400 shadow-sm'
                      : 'text-outline dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">tag</span>
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>

            {/* Direct Messages */}
            <h3 className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest mt-8 mb-4">Direct Messages</h3>
            <div className="space-y-1">
              {dmChannels.length === 0 && (
                <p className="text-[10px] text-outline dark:text-slate-600 font-medium px-4">No DMs yet. Click a member to start.</p>
              )}
              {dmChannels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => switchChannel(ch.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${
                    activeChannelId === ch.id
                      ? 'bg-white dark:bg-slate-800 text-primary dark:text-indigo-400 shadow-sm'
                      : 'text-outline dark:text-slate-400 hover:text-on-surface dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">chat_bubble</span>
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 pt-0 flex-1 overflow-y-auto scrollbar-hide">
            <h3 className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest mb-4">Members • {channelMembers.length}</h3>
            <div className="space-y-3">
              {channelMembers.slice(0, 8).map(m => (
                <button
                  key={m.id}
                  onClick={() => m.id !== user?.id && handleStartDM(m.id)}
                  className="flex items-center gap-3 w-full text-left group hover:bg-white/50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-all"
                  title={m.id === user?.id ? 'You' : `DM ${m.name}`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={m.avatar} className="w-8 h-8 rounded-full" alt="" />
                    <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-surface-container-low dark:border-slate-900 ${m.status === 'Active' ? 'bg-tertiary-fixed' : 'bg-outline'}`}></span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface dark:text-white truncate group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors">
                      {m.name}{m.id === user?.id ? ' (You)' : ''}
                    </p>
                    <p className="text-[9px] text-outline dark:text-slate-500 font-medium uppercase">{m.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat Feed */}
        <main className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden relative">
          
          <header className="h-16 border-b border-outline-variant/10 dark:border-slate-800 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-primary-fixed dark:bg-primary/20 text-primary dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">{activeChannel?.type === 'dm' ? 'chat_bubble' : 'tag'}</span>
              </div>
              <div>
                <h3 className="text-sm font-black text-on-surface dark:text-white leading-tight">{activeChannel?.name || 'Select a channel'}</h3>
                <p className="text-[10px] text-outline dark:text-slate-500 font-bold tracking-wide uppercase">
                  {activeChannel?.type === 'dm' ? 'Direct Message' : `${activeChannel?.member_count || 0} Members`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-outline dark:text-slate-400 hover:text-on-surface dark:hover:text-white transition-colors rounded-lg"><span className="material-symbols-outlined">search</span></button>
              <button className="p-2 text-outline dark:text-slate-400 hover:text-on-surface dark:hover:text-white transition-colors rounded-lg"><span className="material-symbols-outlined">info</span></button>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {/* Load older messages */}
            {messages.length >= 30 && hasMoreMessages && (
              <div className="text-center">
                <button 
                  onClick={loadOlderMessages}
                  disabled={loadingOlder}
                  className="text-[10px] font-black text-primary dark:text-indigo-400 uppercase tracking-widest hover:underline disabled:opacity-50"
                >
                  {loadingOlder ? 'Loading...' : '↑ Load Older Messages'}
                </button>
              </div>
            )}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-outline-variant/10 dark:bg-slate-800"></div>
              <span className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest">Messages</span>
              <div className="flex-1 h-px bg-outline-variant/10 dark:bg-slate-800"></div>
            </div>

            {messages.length === 0 && (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-5xl text-outline/20 dark:text-slate-700 block mb-4">chat</span>
                <p className="text-sm text-on-surface-variant dark:text-slate-500 font-bold">No messages yet.</p>
                <p className="text-xs text-outline dark:text-slate-600 mt-1">Be the first to share your insights!</p>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex gap-4 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  {!isMe && <img src={msg.sender_avatar} className="w-10 h-10 rounded-2xl flex-shrink-0 border-2 border-surface-container-low dark:border-slate-800" alt="" />}
                  <div className={`flex flex-col ${isMe ? 'items-end' : ''}`}>
                    {!isMe && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-black text-on-surface dark:text-white">{msg.sender_name}</span>
                        <span className="text-[10px] text-outline dark:text-slate-500 font-bold">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    <div className={`p-4 text-sm leading-relaxed font-medium ${
                      isMe
                        ? 'bg-primary dark:bg-indigo-600 text-white rounded-2xl rounded-tr-none shadow-lg shadow-primary/10'
                        : 'bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-slate-200 rounded-2xl rounded-tl-none border border-outline-variant/10 dark:border-slate-700'
                    }`}>
                      {msg.text}
                    </div>
                    {isMe && (
                      <span className="text-[9px] text-outline dark:text-slate-600 font-black uppercase tracking-widest mt-2">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Sent
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <footer className="p-6 bg-white dark:bg-slate-950 border-t border-outline-variant/10 dark:border-slate-800 flex-shrink-0 relative">
            {typingText && (
              <div className="absolute -top-6 left-8 text-[10px] font-black text-primary dark:text-indigo-400 uppercase tracking-widest animate-pulse">
                {typingText}
              </div>
            )}
            <form onSubmit={handleSend} className="bg-surface-container-low dark:bg-slate-800 p-2 rounded-2xl flex items-center gap-2 border border-outline-variant/10 dark:border-slate-700 shadow-inner">
              <button type="button" className="p-2 text-outline dark:text-slate-500 hover:text-primary dark:hover:text-indigo-400 transition-colors"><span className="material-symbols-outlined">add_circle</span></button>
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => {
                  setInputMsg(e.target.value);
                  broadcastTyping();
                }}
                placeholder="Share your insights..."
                className="flex-1 bg-transparent border-none text-sm font-medium outline-none px-2 dark:text-white dark:placeholder-slate-500"
              />
              <button type="submit" className="h-10 w-10 bg-primary dark:bg-indigo-600 text-white rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>send</span>
              </button>
            </form>
          </footer>
        </main>

        {/* Context Sidebar */}
        <aside className="hidden lg:flex w-72 bg-surface-container-low dark:bg-slate-900/80 border-l border-outline-variant/10 dark:border-slate-800 flex-col p-6 flex-shrink-0">
          <h4 className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest mb-6">Channel Info</h4>

          {pinnedMessages.length > 0 && (
            <div className="glass-effect p-5 rounded-2xl border border-white/20 dark:border-slate-700 bg-primary/5 dark:bg-primary/10 mb-6 relative overflow-hidden">
              <p className="text-xs font-black text-primary dark:text-indigo-400 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">push_pin</span>
                PINNED
              </p>
              <p className="text-sm font-medium text-on-surface dark:text-slate-200 leading-loose italic">
                "{pinnedMessages[0]?.text}"
              </p>
            </div>
          )}

          <h4 className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest mb-4">Active Scholars</h4>
          <div className="flex gap-2 mb-8 flex-wrap">
            {channelMembers.filter(m => m.status === 'Active').slice(0, 6).map(m => (
              <img
                key={m.id}
                onClick={() => m.id !== user?.id && handleStartDM(m.id)}
                src={m.avatar}
                className="w-10 h-10 rounded-xl border-2 border-white dark:border-slate-800 shadow-sm hover:scale-110 transition-all cursor-pointer"
                alt={m.name}
                title={`DM ${m.name}`}
              />
            ))}
          </div>

          <h4 className="text-[10px] font-black text-outline dark:text-slate-500 uppercase tracking-widest mb-4">About</h4>
          <p className="text-xs text-on-surface-variant dark:text-slate-400 leading-relaxed font-medium">
            {activeChannel?.description || 'No description available.'}
          </p>

          <div className="mt-auto pt-6">
            <div className="bg-primary dark:bg-indigo-900 p-6 rounded-3xl text-white relative overflow-hidden group shadow-lg cursor-pointer">
              <h5 className="text-sm font-black mb-2 z-10 relative">Need help?</h5>
              <p className="text-[10px] text-primary-fixed/80 dark:text-indigo-200 z-10 relative font-medium">Faculty leads available for guidance.</p>
              <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-7xl text-white/10 group-hover:rotate-12 transition-transform">support_agent</span>
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
