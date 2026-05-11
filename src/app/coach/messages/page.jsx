'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';

import { Search, Phone, MoreVertical, Send, MessageSquare, Sparkles } from 'lucide-react';

const AvatarCircle = ({ name, avatarUrl, size = 40, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        className={className}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#38bdf8', fontWeight: 700, fontSize: size * 0.38 }}
      className={className}
    >
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
};

export default function MessagesPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef(null);

  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  const generateAiSuggestions = (lastMsg) => {
    if (!lastMsg || lastMsg.sender !== 'candidate') {
      setShowAiSuggestions(false);
      return;
    }
    
    // Coach-specific mock AI suggestions
    const text = lastMsg.text.toLowerCase();
    let suggestions = ["Great!", "Keep it up.", "Happy to help."];

    if (text.includes("available") || text.includes("time") || text.includes("schedule")) {
      suggestions = ["I'm free tomorrow afternoon.", "Does Wednesday work for you?", "Let's sync up on Friday."];
    } else if (text.includes("thanks") || text.includes("thank you")) {
      suggestions = ["You're very welcome!", "Anytime! Happy to help.", "Let me know if you need more."];
    } else if (text.includes("resume") || text.includes("update") || text.includes("profile")) {
      suggestions = ["I'll review it and get back.", "Great progress on the profile.", "Looks much better now."];
    }

    setAiSuggestions(suggestions);
    setShowAiSuggestions(true);
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/coach/messages', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !selectedConvId) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    const id = convId || selectedConvId;
    if (!id) return;
    try {
      const res = await fetch(`/api/coach/messages/${id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        const newMsgs = data.messages || [];
        setMessages(newMsgs);
        
        // Generate AI suggestions for the coach
        if (newMsgs.length > 0) {
          const lastMsg = newMsgs[newMsgs.length - 1];
          generateAiSuggestions(lastMsg);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!authUser || authUser.role !== 'Coach') {
      router.push('/login');
      return;
    }
    fetchConversations();
  }, [authUser, authLoading, authToken, router]);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConvId]);

  const lastMessageCount = useRef(0);
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
      lastMessageCount.current = messages.length;
    }
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : messageInput;
    if (!text.trim() || !selectedConvId || sending) return;
    
    setMessageInput('');
    setSending(true);
    setShowAiSuggestions(false);

    try {
      const res = await fetch('/api/coach/messages', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedConvId, message: text })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.msg]);
        fetchConversations();
      } else {
        setMessageInput(text);
      }
    } catch (err) {
      console.error(err);
      setMessageInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(messageInput);
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const filteredConversations = conversations.filter(c =>
    c.candidateName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedConv = conversations.find(c => c.id === selectedConvId);

  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt || Date.now()).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width: 40, height: 40, border: '1.5px solid rgba(14,165,233,0.15)', borderTop: '1.5px solid #0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-80px)] flex gap-0 animate-in fade-in duration-500">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&display=swap');
        .msg-root { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="msg-root flex w-full h-full rounded-2xl overflow-hidden border border-white/10" style={{ background: 'rgba(6,6,15,0.95)', backdropFilter: 'blur(24px)' }}>
        
        {/* ── SIDEBAR ────────────────────────────────────────────────── */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-white/10">
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-bold text-white">Conversations</h1>
              <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm">
                <Send size={14} />
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 outline-none focus:border-sky-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {filteredConversations.length > 0 ? filteredConversations.map(conv => {
              const isSelected = selectedConvId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-all relative text-left ${isSelected ? 'bg-sky-500/10' : 'hover:bg-white/5'}`}
                >
                  {isSelected && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-sky-400 rounded-full" />}
                  <div className="relative flex-shrink-0">
                    <AvatarCircle name={conv.candidateName} avatarUrl={conv.avatarUrl} size={44} />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#06060f] rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className={`text-sm font-bold truncate ${isSelected ? 'text-sky-400' : conv.unreadCount > 0 ? 'text-white' : 'text-slate-200'}`}>
                        {conv.candidateName}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1 flex-shrink-0">now</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>
                      {conv.lastMessage || 'Start conversation...'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">
                      {conv.unreadCount}
                    </div>
                  )}
                </button>
              );
            }) : (
              <div className="p-8 text-center">
                <p className="text-slate-500 text-sm">No conversations yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── CHAT AREA ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-3">
                  <AvatarCircle name={selectedConv.candidateName} avatarUrl={selectedConv.avatarUrl} size={40} />
                  <div>
                    <h2 className="text-sm font-bold text-white">{selectedConv.candidateName}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm">
                    <Phone size={14} />
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm">
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" style={{ backgroundImage: `radial-gradient(rgba(14,165,233,0.03) 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex justify-center">
                      <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                        {date === new Date().toDateString() ? 'Today' : date}
                      </span>
                    </div>
                    {msgs.map((msg, i) => {
                      const isMe = msg.sender === 'coach';
                      return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2.5 animate-in slide-in-from-bottom-2`}>
                          {!isMe && <AvatarCircle name={selectedConv.candidateName} avatarUrl={selectedConv.avatarUrl} size={28} />}
                          <div className={`max-w-[65%] space-y-1`}>
                            <div className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${isMe ? 'bg-sky-500 text-white rounded-br-sm shadow-lg shadow-sky-500/20' : 'bg-white/8 text-slate-200 border border-white/10 rounded-bl-sm'}`}
                              style={isMe ? {} : { background: 'rgba(255,255,255,0.07)' }}>
                              {msg.text}
                            </div>
                            <div className={`flex items-center gap-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
                                {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && <span className="text-[10px] text-sky-400 font-bold">✓✓</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Input & Suggestions */}
              <div className="p-4 border-t border-white/10" style={{ background: 'rgba(255,255,255,0.02)' }}>
                {showAiSuggestions && aiSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 animate-in slide-in-from-bottom-4 fade-in duration-500 px-2">
                    <div className="w-full flex items-center gap-2 mb-1 px-1">
                      <Sparkles size={12} className="text-sky-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mentor Suggestions</span>
                    </div>
                    {aiSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium hover:bg-sky-500/20 hover:border-sky-500/30 transition-all active:scale-95 shadow-lg"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="flex items-end gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      rows={1}
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(messageInput); }
                      }}
                      placeholder="Type a message..."
                      className="w-full p-4 pr-14 rounded-xl bg-white/5 border border-white/10 outline-none text-white placeholder-slate-500 text-sm focus:border-sky-500/50 transition-all resize-none max-h-32"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || sending}
                      className="absolute right-2 bottom-2 w-10 h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 hover:scale-105 active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', boxShadow: '0 4px 16px rgba(2,132,199,0.3)' }}
                    >
                      <Send size={16} className="text-white" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <MessageSquare size={32} />
              </div>
              <div className="text-center">
                <h2 className="text-white font-bold text-lg">Your Messages</h2>
                <p className="text-slate-500 text-sm mt-1 max-w-xs font-light">Select a candidate from the left panel to view messages.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
