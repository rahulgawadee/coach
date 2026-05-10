'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Send, Paperclip, CheckCheck, MoreVertical, MessageSquare, Circle } from 'lucide-react';

const BackgroundGrid = () => (
  <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#06060f 0%,#090912 50%,#07070e 100%)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(14,116,144,0.06) 0%, transparent 70%)', filter:'blur(40px)' }} />
  </div>
);

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(99,102,241,0.15)', borderTop:'1.5px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="relative w-full h-[calc(100vh-68px)] animate-in fade-in duration-500 font-['DM_Sans',sans-serif] -mt-px">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>

      <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden">
        <BackgroundGrid />

        {/* Mentor Sidebar */}
        <div className="hidden lg:flex w-80 flex-col bg-white/[0.01] border-r border-white/5 relative z-10">
          <div className="p-8">
            <h1 className="serif text-3xl text-white mb-8">Conversations</h1>
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Assigned Coach</p>
              <button className="w-full p-4 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-4 text-left shadow-lg transition-all hover:bg-indigo-500/15">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-[0_4px_12px_rgba(99,102,241,0.4)]">
                  {coachData.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate text-sm">{coachData.name}</h3>
                  <p className="text-[10px] font-bold text-indigo-300 truncate uppercase tracking-widest">{coachData.company}</p>
                </div>
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative z-10 bg-white/[0.01]">
          {/* Header */}
          <div className="p-5 md:p-6 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-xl flex items-center justify-center font-bold text-lg lg:hidden shadow-[0_4px_12px_rgba(99,102,241,0.4)]">
                {coachData.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-white text-lg leading-none mb-1.5">{coachData.name}</h2>
                <div className="flex items-center gap-1.5">
                  <Circle size={8} fill="#10b981" color="#10b981" className="animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Active Now</span>
                </div>
              </div>
            </div>
            <button className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors text-slate-400 hover:text-white border border-white/5">
              <MoreVertical size={18} />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 chat-scroll"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z' fill='rgba(255,255,255,0.05)' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
          >
            {Object.keys(groupedMessages).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                <MessageSquare size={48} className="text-slate-500" strokeWidth={1} />
                <p className="text-slate-400 text-sm font-light">Send a message to start the conversation.</p>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date} className="space-y-6">
                  <div className="flex justify-center">
                    <span className="px-4 py-1.5 bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-white/10 backdrop-blur-md">
                      {date === new Date().toDateString() ? 'Today' : date}
                    </span>
                  </div>
                  
                  {msgs.map((msg, i) => {
                    const isMe = msg.sender === 'candidate';
                    return (
                      <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[85%] space-y-1.5`}>
                          <div className={`px-5 py-3.5 shadow-lg font-medium text-[13.5px] leading-relaxed backdrop-blur-sm ${
                            isMe 
                              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-[1.5rem] rounded-br-sm border border-indigo-400/30' 
                              : 'bg-white/10 text-slate-200 border border-white/10 rounded-[1.5rem] rounded-bl-sm'
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-1.5 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${isMe ? 'text-indigo-300' : 'text-slate-500'}`}>
                              {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <CheckCheck size={12} className="text-indigo-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="p-5 md:p-6 border-t border-white/5 backdrop-blur-xl">
            <form onSubmit={handleSendMessage} className="flex gap-4 items-end max-w-4xl mx-auto w-full relative">
              <button type="button" className="w-12 h-12 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/5 shadow-inner">
                <Paperclip size={20} strokeWidth={1.5} />
              </button>
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
                  placeholder={`Message ${coachData.name}...`}
                  className="w-full p-4 pl-5 pr-16 rounded-[1.25rem] bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none font-medium text-sm focus:border-indigo-500/50 focus:bg-white/10 transition-all resize-none max-h-32 overflow-y-auto"
                />
                <button 
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="absolute right-2 bottom-2 w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  <Send size={16} className={messageInput.trim() && !sending ? 'translate-x-[1px] -translate-y-[1px]' : ''} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
