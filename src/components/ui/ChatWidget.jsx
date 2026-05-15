'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot } from 'lucide-react';

const BOT_KNOWLEDGE = [
  { k: ['hello','hi','hey','start'],
    a: "👋 Hi there! I'm **Elevate Assistant**. I can help you with:\n• Finding & connecting with coaches\n• Understanding your onboarding steps\n• Navigating your dashboard\n• Managing sessions & messages\n\nWhat would you like help with?" },
  { k: ['coach','mentor','find','match','matching'],
    a: "🎯 **Finding Your Coach**\n\nOur AI matches you with the best coach based on your goals & skills. Here's how:\n1. Complete your profile (Step 1–3)\n2. Our system reviews your goals\n3. You'll be matched within 48 hours\n\nGo to **My Coach** in the sidebar to see your match!" },
  { k: ['session','schedule','book','meeting','call'],
    a: "📅 **Booking a Session**\n\nYou can book coaching sessions from:\n• **Calendar** → pick an available slot\n• **My Coach** page → tap 'Schedule'\n\nYour coach sets availability and you choose a time that works for both." },
  { k: ['message','chat','contact'],
    a: "💬 **Messaging Your Coach**\n\nHead to **Messages** in your sidebar to chat directly with your coach in real time. All messages are private and secure." },
  { k: ['document','upload','file','agreement'],
    a: "📄 **Documents & Agreements**\n\nYou can upload and manage documents under the **Documents** section. Agreements with your coach are also stored there for easy access." },
  { k: ['profile','account','settings','photo','update'],
    a: "👤 **Your Profile**\n\nUpdate your profile info, photo, and preferences from the **Profile** page. Click your avatar (top-right) → Profile." },
  { k: ['dashboard','home','overview'],
    a: "🏠 **Your Dashboard**\n\nThe Dashboard gives you a quick overview of:\n• Your active coaching sessions\n• Upcoming meetings\n• Recent messages\n• Progress milestones" },
  { k: ['notification','alert','update'],
    a: "🔔 **Notifications**\n\nYou'll receive real-time notifications for:\n• New messages from your coach\n• Session reminders\n• Platform updates\n\nCheck the bell icon in the top-right corner." },
  { k: ['password','login','logout','access','auth'],
    a: "🔐 **Account & Access**\n\nIf you have login issues, try:\n1. Reset your password on the login page\n2. Clear browser cache\n3. Contact support via WhatsApp below\n\nTo logout, click your avatar → Logout." },
  { k: ['job','career','opportunity'],
    a: "💼 **Jobs & Opportunities**\n\nThe Jobs section (coming soon!) will surface curated opportunities matched to your profile and coaching progress. Stay tuned!" },
  { k: ['thank','thanks','great','awesome','perfect'],
    a: "😊 You're welcome! Is there anything else I can help you with?" },
  { k: ['bye','goodbye','exit','done'],
    a: "👋 Goodbye! Feel free to come back anytime. Best of luck on your Elevate journey! 🚀" },
];

function getBotReply(input) {
  const lower = input.toLowerCase();
  for (const entry of BOT_KNOWLEDGE) {
    if (entry.k.some(k => lower.includes(k))) return entry.a;
  }
  return "🤔 I'm not sure about that. You can try asking about:\n• Coaches & matching\n• Sessions & scheduling\n• Messages & documents\n• Your profile & dashboard";
}

function renderText(text) {
  return text.split('\n').map((line, i) => {
    let cleanLine = line.replace(/^#+\s/, '**'); // convert markdown headers to bold if any
    if (cleanLine !== line && !cleanLine.endsWith('**')) cleanLine += '**';
    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i} style={{ display: 'block', marginBottom: cleanLine === '' ? 6 : 2 }}>
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : p
        )}
      </span>
    );
  });
}

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: "👋 Hi! I'm **Elevate Assistant**. How can I help you today?" }
  ]);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pulse, setPulse]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setPulse(p => !p), 3000);
      return () => clearTimeout(t);
    }
  }, [open, pulse]);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, typing]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async () => {
    const txt = input.trim();
    if (!txt) return;
    setInput('');
    const newMessages = [...messages, { from: 'user', text: txt }];
    setMessages(newMessages);
    setTyping(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      const data = await res.json();
      setTyping(false);
      if (data.reply) {
        setMessages(prev => [...prev, { from: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { from: 'bot', text: getBotReply(txt) }]);
      }
    } catch (e) {
      setTyping(false);
      setMessages(prev => [...prev, { from: 'bot', text: getBotReply(txt) }]);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        .cw-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          left: auto;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          pointer-events: none;
        }
        .cw-panel {
          width: 360px;
          max-height: 520px;
          background: var(--glass-bg, rgba(13,12,30,0.95));
          border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
          border-radius: 22px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04);
          backdrop-filter: blur(28px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          pointer-events: all;
          animation: cwSlideUp 0.28s cubic-bezier(0.23,1,0.32,1);
          transform-origin: bottom right;
        }
        @keyframes cwSlideUp {
          from { opacity:0; transform: scale(0.9) translateY(16px); }
          to   { opacity:1; transform: scale(1)  translateY(0); }
        }
        .cw-header {
          padding: 16px 18px 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(56,189,248,0.06));
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .cw-header-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .cw-avatar {
          width: 36px; height: 36px; border-radius: 11px;
          background: linear-gradient(135deg,#4f46e5,#0891b2);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(79,70,229,0.4);
        }
        .cw-header-info { flex: 1; min-width: 0; }
        .cw-header-name { font-size: 13px; font-weight: 700; color: var(--text-primary, #fff); }
        .cw-header-status { font-size: 11px; color: #6ee7b7; display: flex; align-items: center; gap: 5px; margin-top: 1px; }
        .cw-wa-head-btn {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(37,211,102,0.15); border: 1px solid rgba(37,211,102,0.3);
          color: #25D366; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; pointer-events: all;
          margin-right: -2px; text-decoration: none;
        }
        .cw-wa-head-btn:hover { background: rgba(37,211,102,0.25); transform: scale(1.05); }
        .cw-close {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(148,163,184,0.8); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; transition: background 0.15s;
          pointer-events: all;
        }
        .cw-close:hover { background: rgba(239,68,68,0.12); color: #f87171; transform: none !important; box-shadow: none !important; }
        .cw-tabs {
          display: flex; gap: 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .cw-tab {
          flex: 1; padding: 10px 0; font-size: 12px; font-weight: 600;
          color: var(--text-muted, #64748b); cursor: pointer;
          border: none; background: none; border-bottom: 2px solid transparent;
          transition: all 0.2s; letter-spacing: 0.03em;
        }
        .cw-tab:hover { color: var(--text-primary, #fff); transform: none !important; box-shadow: none !important; }
        .cw-tab.active { color: #818cf8; border-bottom-color: #818cf8; }
        .cw-messages {
          flex: 1; overflow-y: auto; padding: 16px 14px;
          display: flex; flex-direction: column; gap: 10px;
          scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.3) transparent;
        }
        .cw-messages::-webkit-scrollbar { width: 3px; }
        .cw-messages::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 2px; }
        .cw-bubble-wrap { display: flex; align-items: flex-end; gap: 7px; }
        .cw-bubble-wrap.user { flex-direction: row-reverse; }
        .cw-bubble {
          max-width: 80%; padding: 10px 13px; border-radius: 16px;
          font-size: 13px; line-height: 1.6; color: var(--text-primary, #f1f5f9);
          animation: cwBubble 0.22s ease;
        }
        @keyframes cwBubble { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .cw-bubble.bot {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-bottom-left-radius: 4px;
        }
        .cw-bubble.user {
          background: linear-gradient(135deg,#4f46e5,#0891b2);
          border-bottom-right-radius: 4px;
          color: #fff;
        }
        .cw-typing {
          display: flex; align-items: center; gap: 4px;
          padding: 10px 13px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; border-bottom-left-radius: 4px;
          width: fit-content;
        }
        .cw-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #818cf8; animation: cwDot 1.2s infinite;
        }
        .cw-dot:nth-child(2) { animation-delay: 0.2s; }
        .cw-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes cwDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        .cw-input-row {
          display: flex; gap: 8px; padding: 12px 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.15);
          flex-shrink: 0;
        }
        .cw-input {
          flex: 1; padding: 9px 13px; border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-primary, #f1f5f9);
          font-size: 13px; font-family: inherit; outline: none;
          transition: border-color 0.18s;
          resize: none;
        }
        .cw-input::placeholder { color: rgba(148,163,184,0.5); }
        .cw-input:focus { border-color: rgba(99,102,241,0.4); }
        .cw-send {
          width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0;
          background: linear-gradient(135deg,#4f46e5,#0891b2);
          border: none; color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; align-self: flex-end;
          transition: transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 4px 14px rgba(79,70,229,0.35);
        }
        .cw-send:hover { transform: translateY(-1px) scale(1.05) !important; box-shadow: 0 6px 20px rgba(79,70,229,0.5) !important; }
        .cw-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

        /* WhatsApp tab */
        .cw-wa-body {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 28px 24px; gap: 16px; text-align: center;
        }
        .cw-wa-icon {
          width: 72px; height: 72px; border-radius: 22px;
          background: linear-gradient(135deg,#25d366,#128c7e);
          display: flex; align-items: center; justify-content: center;
          font-size: 36px;
          box-shadow: 0 8px 28px rgba(37,211,102,0.35);
          animation: cwPulseGreen 2.5s infinite;
        }
        @keyframes cwPulseGreen {
          0%,100% { box-shadow: 0 8px 28px rgba(37,211,102,0.35); }
          50%      { box-shadow: 0 8px 40px rgba(37,211,102,0.6); }
        }
        .cw-wa-title { font-size: 16px; font-weight: 700; color: var(--text-primary,#fff); }
        .cw-wa-sub { font-size: 13px; color: var(--text-secondary,#cbd5e1); line-height: 1.65; }
        .cw-wa-btn {
          padding: 13px 28px; border-radius: 14px;
          background: linear-gradient(135deg,#25d366,#128c7e);
          color: #fff; font-weight: 700; font-size: 14px;
          border: none; cursor: pointer; text-decoration: none;
          display: inline-flex; align-items: center; gap: 9px;
          box-shadow: 0 6px 20px rgba(37,211,102,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .cw-wa-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 28px rgba(37,211,102,0.45) !important; }
        .cw-wa-note { font-size: 11px; color: rgba(148,163,184,0.45); }

        /* FAB buttons */
        .cw-main-btn {
          width: 56px; height: 56px; border-radius: 18px;
          background: linear-gradient(135deg,#4f46e5,#0891b2);
          border: none; color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; flex-shrink: 0;
          box-shadow: 0 8px 28px rgba(79,70,229,0.45);
          transition: transform 0.25s, box-shadow 0.25s;
          pointer-events: all;
          position: relative;
        }
        .cw-main-btn:hover { transform: translateY(-2px) scale(1.06) !important; box-shadow: 0 12px 36px rgba(79,70,229,0.6) !important; }
        .cw-main-btn.open { background: linear-gradient(135deg,#334155,#1e293b); }
        .cw-pulse-ring {
          position: absolute; inset: -6px; border-radius: 24px;
          border: 2px solid rgba(99,102,241,0.5);
          animation: cwRing 2s infinite;
          pointer-events: none;
        }
        @keyframes cwRing {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.28); opacity: 0; }
        }
        .cw-wa-fab {
          width: 44px; height: 44px; border-radius: 14px;
          background: linear-gradient(135deg,#25d366,#128c7e);
          border: none; color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          box-shadow: 0 6px 20px rgba(37,211,102,0.4);
          transition: transform 0.22s, box-shadow 0.22s;
          pointer-events: all;
          text-decoration: none;
        }
        .cw-wa-fab:hover { transform: translateY(-2px) scale(1.08) !important; box-shadow: 0 10px 28px rgba(37,211,102,0.55) !important; }
        .cw-tooltip {
          position: absolute; right: 66px; top: 50%;
          transform: translateY(-50%);
          background: var(--glass-bg, rgba(13,12,30,0.95));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9px; padding: 5px 11px;
          font-size: 12px; font-weight: 600; white-space: nowrap;
          color: var(--text-primary,#fff);
          pointer-events: none;
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
          backdrop-filter: blur(12px);
        }
        .cw-btn-wrap {
          position: relative; display: flex; align-items: center;
        }

        /* Light mode overrides */
        :root:not(.dark) .cw-bubble.bot {
          background: rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.08);
          color: #1e293b;
        }
        :root:not(.dark) .cw-input {
          background: rgba(0,0,0,0.03);
          border-color: rgba(0,0,0,0.1);
          color: #020617;
        }
        :root:not(.dark) .cw-input-row { background: rgba(0,0,0,0.03); }
        :root:not(.dark) .cw-typing {
          background: rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.08);
        }

        @media (max-width: 480px) {
          .cw-panel {
            width: calc(100vw - 16px);
            max-height: calc(100vh - 100px);
            left: auto; right: 0; bottom: 0;
            border-radius: 22px 22px 0 0;
          }
          .cw-fab { bottom: 16px; right: 12px; left: auto; align-items: flex-end; }
        }
      `}</style>

      <div className="cw-fab">
        {/* Chat panel */}
        {open && (
          <div className="cw-panel">
            {/* Header */}
            <div className="cw-header">
              <div className="cw-header-top">
                <div className="cw-avatar"><Bot size={20} color="#fff" /></div>
                <div className="cw-header-info">
                  <div className="cw-header-name">Elevate Assistant</div>
                  <div className="cw-header-status">
                    <span style={{ width:7, height:7, borderRadius:'50%', background:'#6ee7b7', display:'inline-block', boxShadow:'0 0 6px #6ee7b7' }} />
                    Online · Platform support
                  </div>
                </div>
                <a href="https://wa.me/9172694190?text=Hi!%20I%20need%20help%20with%20the%20Elevate%20platform." target="_blank" rel="noopener noreferrer" className="cw-wa-head-btn" title="Chat on WhatsApp">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                </a>
                <button className="cw-close" onClick={() => setOpen(false)} aria-label="Close chat"><X size={18} /></button>
              </div>
            </div>

            {/* Chat content */}
            <div className="cw-messages">
                  {messages.map((msg, i) => (
                    <div key={i} className={`cw-bubble-wrap ${msg.from}`}>
                      {msg.from === 'bot' && (
                        <div style={{ width:24, height:24, borderRadius:8, background:'linear-gradient(135deg,#4f46e5,#0891b2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}><Bot size={14} /></div>
                      )}
                      <div className={`cw-bubble ${msg.from}`}>
                        {renderText(msg.text)}
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="cw-bubble-wrap bot">
                      <div style={{ width:24, height:24, borderRadius:8, background:'linear-gradient(135deg,#4f46e5,#0891b2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}><Bot size={14} /></div>
                      <div className="cw-typing">
                        <div className="cw-dot" />
                        <div className="cw-dot" />
                        <div className="cw-dot" />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Quick replies */}
                <div style={{ padding:'0 14px 10px', display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 }}>
                  {['Find my coach', 'Book a session', 'Messages', 'My profile'].map(q => (
                    <button key={q}
                      onClick={async () => {
                        const newMessages = [...messages, { from: 'user', text: q }];
                        setMessages(newMessages);
                        setTyping(true);
                        try {
                          const res = await fetch('/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messages: newMessages })
                          });
                          const data = await res.json();
                          setTyping(false);
                          if (data.reply) {
                            setMessages(prev => [...prev, { from: 'bot', text: data.reply }]);
                          } else {
                            setMessages(prev => [...prev, { from: 'bot', text: getBotReply(q) }]);
                          }
                        } catch(e) {
                          setTyping(false);
                          setMessages(prev => [...prev, { from: 'bot', text: getBotReply(q) }]);
                        }
                      }}
                      style={{ padding:'5px 11px', borderRadius:100, background:'var(--primary-glow,rgba(99,102,241,0.1))', border:'1px solid rgba(99,102,241,0.2)', color:'#818cf8', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s' }}
                    >{q}</button>
                  ))}
                </div>

                <div className="cw-input-row">
                  <textarea
                    ref={inputRef}
                    className="cw-input"
                    rows={1}
                    placeholder="Ask me anything about Elevate…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    style={{ maxHeight:80 }}
                  />
                  <button className="cw-send" onClick={sendMessage} disabled={!input.trim()} aria-label="Send">
                    <Send size={15} style={{ marginLeft: -2 }} />
                  </button>
                </div>
          </div>
        )}

        {/* FAB row */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexDirection:'row-reverse' }}>
          {/* Main chat button */}
          <div className="cw-btn-wrap">
            <button
              className={`cw-main-btn ${open ? 'open' : ''}`}
              onClick={() => setOpen(p => !p)}
              aria-label={open ? 'Close chat' : 'Open chat'}
            >
              {!open && <div className="cw-pulse-ring" />}
              <span style={{ transition: 'transform 0.3s', transform: open ? 'rotate(90deg)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {open ? <X size={26} /> : <Bot size={26} />}
              </span>
            </button>
            {!open && <span className="cw-tooltip">Chat with us</span>}
          </div>
        </div>
      </div>
    </>
  );
}
