'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Send, Paperclip, CheckCheck, MoreVertical, MessageSquare, Circle, Sparkles, ArrowLeft, Phone, Video } from 'lucide-react';

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
  const textareaRef = useRef(null);
  const lastMsgCount = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => setMounted(true), []);

  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  const generateAiSuggestions = (lastMsg) => {
    if (!lastMsg || lastMsg.sender !== 'coach') {
      setShowAiSuggestions(false);
      return;
    }
    const text = lastMsg.text.toLowerCase();
    let suggestions = ["Thanks!", "Understood.", "I'll check it."];
    if (text.includes("available") || text.includes("call") || text.includes("meeting")) {
      suggestions = ["I'm available tomorrow.", "Let's schedule a call.", "What time works?"];
    } else if (text.includes("resume") || text.includes("profile") || text.includes("document")) {
      suggestions = ["I'll update it now.", "I've uploaded the file.", "Does it look good?"];
    } else if (text.includes("good luck") || text.includes("congrats")) {
      suggestions = ["Thank you!", "Much appreciated.", "I'm excited!"];
    }
    setAiSuggestions(suggestions);
    setShowAiSuggestions(true);
  };

  const fetchMessages = async () => {
    if (!authUser?.email) return;
    try {
      const res = await fetch(`/api/candidate/messages?email=${authUser.email}`);
      const data = await res.json();
      if (data.success) {
        const newMsgs = data.data.coachMessages || [];
        setMessages(newMsgs);
        if (newMsgs.length > 0) {
          generateAiSuggestions(newMsgs[newMsgs.length - 1]);
        }
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

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || sending) return;
    const text = textToSend;
    setMessageInput('');
    setSending(true);
    setShowAiSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    try {
      const res = await fetch('/api/candidate/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authUser.email, conversation: 'coach', text })
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(messageInput);
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleTextareaInput = (e) => {
    setMessageInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
  };

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) { router.push('/login'); return; }
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [authUser, authLoading]);

  useEffect(() => {
    if (messages.length > lastMsgCount.current) {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }
      lastMsgCount.current = messages.length;
    }
  }, [messages]);

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
    <div className="relative w-full animate-in fade-in duration-500 font-['DM_Sans',sans-serif]" style={{ height: 'calc(100vh - 68px)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .msg-bubble { word-break: break-word; }
        @media (max-width: 480px) {
          .msg-bubble { font-size: 13px !important; }
          .msg-time { font-size: 8px !important; }
        }
      `}</style>

      <div className="flex h-full w-full overflow-hidden relative">
        <BackgroundGrid />

        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-72 sm:w-80 lg:w-80
          flex flex-col
          bg-[#0a0b16] lg:bg-white/[0.01]
          border-r border-white/5
          transition-transform duration-300 ease-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="serif text-2xl sm:text-3xl text-white">Conversations</h1>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Assigned Coach</p>
              <button className="w-full p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3 text-left transition-all hover:bg-indigo-500/15 active:scale-[0.98]">
                <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-[0_4px_12px_rgba(99,102,241,0.4)] shrink-0">
                  {coachData.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate text-sm">{coachData.name}</h3>
                  <p className="text-[10px] font-bold text-indigo-300 truncate uppercase tracking-widest">{coachData.company}</p>
                </div>
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)] shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-white/[0.01]">
          {/* Header */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 flex items-center justify-between backdrop-blur-md bg-black/10">
            <div className="flex items-center gap-3">
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setShowSidebar(true)}
                className="lg:hidden w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors text-slate-400 hover:text-white border border-white/5"
              >
                <span className="text-lg leading-none">☰</span>
              </button>

              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-xl flex items-center justify-center font-bold text-base lg:hidden shadow-[0_4px_12px_rgba(99,102,241,0.4)] shrink-0">
                {coachData.name.charAt(0)}
              </div>

              <div>
                <h2 className="font-bold text-white text-sm sm:text-base leading-none mb-1">{coachData.name}</h2>
                <div className="flex items-center gap-1.5">
                  <Circle size={7} fill="#10b981" color="#10b981" className="animate-pulse" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Active Now</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="hidden sm:flex w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl items-center justify-center transition-colors text-slate-400 hover:text-white border border-white/5">
                <Phone size={16} strokeWidth={1.5} />
              </button>
              <button className="hidden sm:flex w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl items-center justify-center transition-colors text-slate-400 hover:text-white border border-white/5">
                <Video size={16} strokeWidth={1.5} />
              </button>
              <button className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-colors text-slate-400 hover:text-white border border-white/5">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto chat-scroll px-3 sm:px-5 md:px-8 lg:px-10 py-5 sm:py-6 space-y-6"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z' fill='rgba(255,255,255,0.04)' fill-rule='evenodd'/%3E%3C/svg%3E")` }}
          >
            {Object.keys(groupedMessages).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4 py-20">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <MessageSquare size={32} className="text-slate-500" strokeWidth={1} />
                </div>
                <div className="text-center">
                  <p className="text-slate-300 text-sm font-medium mb-1">No messages yet</p>
                  <p className="text-slate-500 text-xs font-light">Send a message to start the conversation.</p>
                </div>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date} className="space-y-4 sm:space-y-5">
                  <div className="flex justify-center">
                    <span className="px-3 py-1 bg-white/5 text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] rounded-full border border-white/10 backdrop-blur-md">
                      {date === new Date().toDateString() ? 'Today' : date}
                    </span>
                  </div>

                  {msgs.map((msg, i) => {
                    const isMe = msg.sender === 'candidate';
                    return (
                      <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                        {!isMe && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mr-2 mt-auto mb-5">
                            {coachData.name.charAt(0)}
                          </div>
                        )}
                        <div className="max-w-[78%] sm:max-w-[70%] space-y-1">
                          <div className={`msg-bubble px-3.5 sm:px-5 py-2.5 sm:py-3.5 shadow-md font-medium text-[13px] sm:text-[13.5px] leading-relaxed backdrop-blur-sm ${
                            isMe
                              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-[1.25rem] rounded-br-sm border border-indigo-400/30'
                              : 'bg-white/10 text-slate-200 border border-white/10 rounded-[1.25rem] rounded-bl-sm'
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-1 px-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className={`msg-time text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${isMe ? 'text-indigo-300/70' : 'text-slate-600'}`}>
                              {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <CheckCheck size={11} className="text-indigo-400/70" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* AI Suggestions & Input Area */}
          <div className="flex-shrink-0 px-3 sm:px-5 md:px-6 py-3 sm:py-4 border-t border-white/5 backdrop-blur-xl bg-black/10">
            {showAiSuggestions && aiSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="w-full flex items-center gap-1.5 mb-0.5">
                  <Sparkles size={10} className="text-indigo-400" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Suggested Replies</span>
                </div>
                {aiSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] sm:text-xs font-medium hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all active:scale-95 shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex gap-2 sm:gap-3 items-end w-full max-w-4xl mx-auto">
              <button type="button" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl flex items-center justify-center transition-all border border-white/5 shrink-0">
                <Paperclip size={17} strokeWidth={1.5} />
              </button>
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={messageInput}
                  onChange={handleTextareaInput}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(messageInput);
                    }
                  }}
                  placeholder={`Message ${coachData.name}...`}
                  className="w-full p-3 sm:p-4 pl-4 sm:pl-5 pr-12 sm:pr-14 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 outline-none font-medium text-sm focus:border-indigo-500/50 focus:bg-white/10 transition-all resize-none overflow-hidden"
                  style={{ maxHeight: '128px', overflowY: 'auto' }}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="absolute right-2 bottom-1.5 sm:bottom-2 w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  <Send size={14} className={messageInput.trim() && !sending ? 'translate-x-[1px] -translate-y-[1px]' : ''} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
