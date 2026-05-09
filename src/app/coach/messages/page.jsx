'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

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
        setMessages(data.messages || []);
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
      const interval = setInterval(fetchMessages, 2000); // 2s for near-realtime feel
      return () => clearInterval(interval);
    }
  }, [selectedConvId]);

  const lastMessageCount = useRef(0);
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
      lastMessageCount.current = messages.length;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConvId || sending) return;

    const text = messageInput;
    setMessageInput('');
    setSending(true);
    try {
      const res = await fetch('/api/coach/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: selectedConvId,
          message: text
        })
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

  const filteredConversations = conversations.filter(c => 
    c.candidateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt || Date.now()).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex gap-0 p-0 md:p-6 animate-in fade-in duration-500">
      {/* Sidebar */}
      <div className="w-full md:w-96 flex flex-col bg-white border-r border-slate-100 md:rounded-l-[2rem] overflow-hidden shadow-2xl shadow-slate-200/20">
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Chats</h1>
            <div className="flex gap-2">
              <button className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">📢</button>
            </div>
          </div>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
          {filteredConversations.length > 0 ? filteredConversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelectedConvId(conv.id)}
              className={`w-full p-4 px-6 flex items-center gap-4 transition-all relative ${
                selectedConvId === conv.id 
                  ? 'bg-blue-50/50' 
                  : 'hover:bg-slate-50'
              }`}
            >
              {selectedConvId === conv.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
              )}
              <div className="relative">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black text-xl shadow-sm group-hover:scale-105 transition-transform">
                  {conv.candidateName.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className={`font-black text-slate-900 truncate text-sm ${conv.unreadCount > 0 ? 'text-blue-600' : ''}`}>
                    {conv.candidateName}
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    {conv.lastMessageTime || '12:45'}
                  </span>
                </div>
                <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                  {conv.lastMessage || 'Start a new conversation'}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-blue-200">
                  {conv.unreadCount}
                </div>
              )}
            </button>
          )) : (
            <div className="p-10 text-center space-y-2">
              <p className="text-slate-300 font-black uppercase text-xs tracking-widest">No chats found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 hidden md:flex flex-col bg-slate-50 md:rounded-r-[2rem] overflow-hidden relative shadow-2xl shadow-slate-200/20">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between z-20 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl">
                  {selectedConv.candidateName.charAt(0)}
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-lg leading-none mb-1.5">{selectedConv.candidateName}</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                 <button className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all">🔍</button>
                 <button className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all">📞</button>
                 <button className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all">⋮</button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}
            >
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date} className="space-y-6">
                  <div className="flex justify-center">
                    <span className="px-4 py-1.5 bg-slate-200/50 backdrop-blur-sm text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {date === new Date().toDateString() ? 'Today' : date}
                    </span>
                  </div>
                  {msgs.map((msg, i) => {
                    const isMe = msg.sender === 'coach';
                    return (
                      <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[75%] space-y-1`}>
                          <div className={`relative px-6 py-4 rounded-[2rem] shadow-md shadow-slate-200/20 text-sm font-medium ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-2 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                              {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <span className="text-blue-400 text-[10px]">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-8 bg-white border-t border-slate-100 z-20">
              <form onSubmit={handleSendMessage} className="flex gap-4 items-end">
                <button type="button" className="w-14 h-14 bg-slate-50 text-slate-400 rounded-[1.2rem] flex items-center justify-center hover:bg-slate-100 transition-all text-xl">📎</button>
                <div className="flex-1 relative">
                  <textarea 
                    rows={1}
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full p-5 pr-20 rounded-[1.5rem] bg-slate-50 border-none outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none max-h-32 overflow-y-auto"
                  />
                  <button 
                    type="submit"
                    disabled={!messageInput.trim() || sending}
                    className="absolute right-2 bottom-2 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <span className="text-xl">→</span>
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white">
            <div className="w-32 h-32 bg-blue-50 rounded-[3rem] flex items-center justify-center text-5xl mb-8 animate-bounce">💬</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Your Conversations</h2>
            <p className="text-slate-400 font-bold max-w-xs text-center uppercase text-[10px] tracking-widest leading-loose">
              Select a candidate from the left sidebar to view your message history and start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
