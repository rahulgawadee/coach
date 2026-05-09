'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function CandidateMessagesPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [coachData, setCoachData] = useState({ name: 'Your Coach', bio: '', company: '' });
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const lastMsgCount = useRef(0);

  const fetchMessages = async () => {
    if (!authUser?.email) return;
    try {
      const res = await fetch(`/api/candidate/messages?email=${authUser.email}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.coachMessages || []);
        if (data.data.coachName) {
          setCoachData({
            name: data.data.coachName,
            bio: data.data.coachBio || 'Professional Mentor',
            company: data.data.coachCompany || 'Coach Mentorship'
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push('/login');
      return;
    }
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); 
    return () => clearInterval(interval);
  }, [authUser, authLoading]);

  useEffect(() => {
    if (messages.length > lastMsgCount.current) {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
      lastMsgCount.current = messages.length;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || sending) return;

    const text = messageInput;
    setMessageInput('');
    setSending(true);
    
    try {
      const res = await fetch('/api/candidate/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authUser.email,
          conversation: 'coach',
          text: text
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.msg]);
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

  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt || Date.now()).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-0 bg-white md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/20 h-[calc(100vh-140px)] border border-slate-100">
      {/* Mentor Sidebar */}
      <div className="hidden lg:flex w-80 flex-col bg-slate-50/50 border-r border-slate-100">
        <div className="p-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Conversations</h1>
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Assigned Coach</p>
            <button className="w-full p-4 rounded-3xl bg-white border-2 border-blue-100 flex items-center gap-4 text-left shadow-sm">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                {coachData.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 truncate text-sm">{coachData.name}</h3>
                <p className="text-[10px] font-bold text-blue-600 truncate uppercase">{coachData.company}</p>
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-lg lg:hidden">
              {coachData.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-base leading-none mb-1">{coachData.name}</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Now</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
             <button className="w-9 h-9 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-all">❓</button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth bg-slate-50/30"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}
        >
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="space-y-6">
              <div className="flex justify-center">
                <span className="px-4 py-1.5 bg-white text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-100 shadow-sm">
                  {date === new Date().toDateString() ? 'Today' : date}
                </span>
              </div>
              
              {msgs.map((msg, i) => {
                const isMe = msg.sender === 'candidate';
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] space-y-1.5`}>
                      <div className={`px-5 py-3.5 rounded-[1.8rem] shadow-sm font-medium text-sm leading-relaxed ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <span className="text-blue-300 text-[9px]">✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Input Area - ALWAYS VISIBLE AT BOTTOM */}
        <div className="p-5 md:p-8 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <form onSubmit={handleSendMessage} className="flex gap-4 items-end max-w-4xl mx-auto">
            <button type="button" className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all text-xl">📎</button>
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
                placeholder={`Type a message to ${coachData.name}...`}
                className="w-full p-4 pr-16 rounded-2xl bg-slate-50 border-none outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none max-h-32 overflow-y-auto"
              />
              <button 
                type="submit"
                disabled={!messageInput.trim() || sending}
                className="absolute right-2 bottom-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className="text-xl">→</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
