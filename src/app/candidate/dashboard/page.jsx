'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const Icons = {
  VideoCall: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Calendar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Messages: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.348-3.595A7.2 7.2 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Documents: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Announcement: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  Star: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  ArrowRight: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  Agreement: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6M7 4h10l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h2z" /></svg>,
};

// Subtle animated background lines — no orbs, no cartoonish particles
const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    {/* Deep base */}
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#06060f 0%,#090912 50%,#07070e 100%)' }} />
    {/* Faint geometric lines */}
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    {/* Soft gradient pools — large, low-opacity, sophisticated */}
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(14,116,144,0.06) 0%, transparent 70%)', filter:'blur(40px)' }} />
    {/* Animated slow drift accent */}
    <div style={{ position:'absolute', top:'40%', left:'50%', width:'30vw', height:'30vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)', filter:'blur(60px)', animation:'driftSlow 22s ease-in-out infinite alternate' }} />
    <style>{`
      @keyframes driftSlow{0%{transform:translate(-50%,-50%) scale(1)}100%{transform:translate(-42%,-58%) scale(1.15)}}
    `}</style>
  </div>
);

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [recentMessages, setRecentMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user?.email) return;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const emailParam = `?email=${encodeURIComponent(user.email)}`;

        const coachResponse = await fetch(`/api/candidate/get-coach${emailParam}`);
        if (coachResponse.ok) {
          const coachPayload = await coachResponse.json();
          if (coachPayload.success && coachPayload.hasCoach) setCoach(coachPayload.data);
        }

        const wsResponse = await fetch(`/api/candidate/profile${emailParam}`);
        if (wsResponse.ok) {
          const wsData = await wsResponse.json();
          if (wsData.success) setWorkspace(wsData.data);
        }

        const calendarResponse = await fetch(`/api/candidate/calendar${emailParam}`);
        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          const sessions = calendarData.data?.events || [];
          if (sessions.length > 0) {
            const upcoming = sessions
              .filter(s => s.status === 'confirmed' && new Date(s.date) >= new Date().setHours(0,0,0,0))
              .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
            setNextSession(upcoming);
          }
        }

        const messagesResponse = await fetch(`/api/candidate/messages${emailParam}`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setAnnouncements(messagesData.data?.announcements || []);
          const cMessages = messagesData.data?.coachMessages || [];
          const unread = cMessages.filter(m => !m.seen && m.sender !== 'candidate');
          setUnreadMessages(unread.length);
          const sortedMsgs = [...cMessages].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
          setRecentMessages(sortedMsgs.slice(0, 3));
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  const stats = useMemo(() => {
    if (!workspace) return { percentage: 5, sessions: 0, docs: 0 };
    let score = 10;
    if (workspace.profile?.skills?.length > 0) score += 15;
    if (workspace.agreement?.signed) score += 10;
    const completedSessions = workspace.events?.filter(e => e.status === 'confirmed' && new Date(e.date) < new Date()).length || 0;
    score += Math.min(completedSessions * 10, 40);
    const docs = workspace.documents?.length || 0;
    score += Math.min(docs * 5, 25);
    return { percentage: Math.min(score, 100), sessions: completedSessions, docs, totalSessions: 8 };
  }, [workspace]);

  const isWithinOneHour = (sessionDate, sessionTime) => {
    if (!sessionDate || !sessionTime) return false;
    try {
      const [hours, minutes] = sessionTime.split(':');
      const session = new Date(sessionDate);
      session.setHours(parseInt(hours), parseInt(minutes));
      const now = new Date();
      const diff = (session.getTime() - now.getTime()) / (1000 * 60);
      return diff >= -30 && diff <= 60;
    } catch { return false; }
  };

  if (loading && !workspace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(99,102,241,0.15)', borderTop:'1.5px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 88;

  return (
    <div className="relative max-w-7xl mx-auto pb-16 animate-in fade-in duration-500">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        .dash-root { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .card {
          background: rgba(255,255,255,0.028);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .card:hover { border-color: rgba(255,255,255,0.11); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }
        .pill {
          display:inline-flex; align-items:center; gap:6px;
          padding: 5px 12px; border-radius:999px;
          font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase;
        }
        .stat-row {
          display:flex; justify-content:space-between; align-items:center;
          padding:12px 16px; border-radius:12px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.045);
          transition: background 0.2s;
        }
        .stat-row:hover { background: rgba(255,255,255,0.055); }
        .msg-row {
          padding:14px 16px; border-radius:14px;
          background:rgba(255,255,255,0.025);
          border:1px solid transparent;
          transition: background 0.2s, border-color 0.2s;
          cursor:pointer;
        }
        .msg-row:hover { background:rgba(99,102,241,0.07); border-color:rgba(99,102,241,0.15); }
        .shortcut-card {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:28px 20px; border-radius:18px; text-align:center; cursor:pointer;
          background:rgba(255,255,255,0.025);
          border:1px solid rgba(255,255,255,0.06);
          transition: background 0.25s, border-color 0.25s, transform 0.2s;
        }
        .shortcut-card:hover { background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.12); transform:translateY(-2px); }
        .btn-primary {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:13px 20px; border-radius:12px; font-weight:600;
          font-size:13px; letter-spacing:0.01em; cursor:pointer; border:none;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color:#fff; box-shadow: 0 4px 20px rgba(99,102,241,0.25);
          transition: box-shadow 0.25s, transform 0.2s;
        }
        .btn-primary:hover { box-shadow: 0 8px 30px rgba(99,102,241,0.38); transform:translateY(-1px); }
        .btn-ghost {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:13px 20px; border-radius:12px; font-weight:600;
          font-size:13px; cursor:pointer;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.85);
          transition: background 0.2s, border-color 0.2s;
        }
        .btn-ghost:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); }
        .icon-badge {
          width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
        }
        .section-label {
          font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase;
          color:rgba(255,255,255,0.3);
        }
        .divider { border:none; height:1px; background:rgba(255,255,255,0.06); margin:0; }
        /* Stagger fade-in */
        .fade-up { animation: fadeUp 0.5s ease both; }
        .delay-1 { animation-delay:0.07s; }
        .delay-2 { animation-delay:0.14s; }
        .delay-3 { animation-delay:0.21s; }
        .delay-4 { animation-delay:0.28s; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        /* Arc progress glow */
        .arc-glow { filter: drop-shadow(0 0 8px rgba(99,102,241,0.5)); }
      `}</style>

      <div className="dash-root space-y-7">

        {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
        <div className="fade-up card relative overflow-hidden" style={{ padding:'52px 52px 44px', borderRadius:24 }}>
          {/* Subtle corner accent */}
          <div style={{ position:'absolute', top:0, right:0, width:320, height:320, background:'radial-gradient(circle at top right, rgba(99,102,241,0.09) 0%, transparent 65%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:0, left:0, width:200, height:200, background:'radial-gradient(circle at bottom left, rgba(14,116,144,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:1 }}>
            <div className="pill" style={{ background:'rgba(99,102,241,0.1)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.2)', marginBottom:20 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#818cf8', display:'inline-block', animation:'pulse 2s infinite' }}></span>
              Candidate Portal
            </div>
            <h1 className="serif" style={{ fontSize:'clamp(2rem,4vw,3.2rem)', color:'#fff', lineHeight:1.1, marginBottom:12, fontWeight:400, letterSpacing:'-0.01em' }}>
              Welcome back,{' '}
              <span style={{ fontStyle:'italic', background:'linear-gradient(90deg,#a5b4fc,#67e8f9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                {user?.name?.split(' ')[0] || 'Candidate'}
              </span>
            </h1>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:15, lineHeight:1.7, maxWidth:520, margin:0, fontWeight:300 }}>
              Your career acceleration journey is underway.{' '}
              <span style={{ color:'rgba(255,255,255,0.75)', fontWeight:500 }}>{stats.percentage}%</span>
              {' '}of your initial roadmap is complete.
            </p>
          </div>
        </div>

        {/* ── MAIN GRID ────────────────────────────────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:28 }} className="lg:grid-cols-3-custom">
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr)', gap:28, gridColumn:'span 2' }}>

            {/* COACH CARD */}
            <div className="fade-up delay-1 card" style={{ padding:36 }}>
              <p className="section-label" style={{ marginBottom:24 }}>Your Mentor</p>

              <div style={{ display:'flex', gap:28, alignItems:'flex-start', flexWrap:'wrap' }}>
                {/* Avatar */}
                <div style={{ position:'relative', flexShrink:0 }}>
                  <div style={{ width:80, height:80, borderRadius:16, overflow:'hidden', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {coach?.coachAvatar
                      ? <img src={coach.coachAvatar} alt="Coach" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <svg style={{ width:32, height:32, color:'rgba(165,180,252,0.4)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    }
                  </div>
                  <div style={{ position:'absolute', bottom:-4, right:-4, width:14, height:14, borderRadius:'50%', background:'#10b981', border:'2.5px solid #090912', boxShadow:'0 0 8px rgba(16,185,129,0.6)' }} />
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                    <div>
                      <h2 className="serif" style={{ fontSize:26, color:'#fff', fontWeight:400, letterSpacing:'-0.01em', marginBottom:4, lineHeight:1.2 }}>
                        {coach?.coachName || 'Assigning Coach…'}
                      </h2>
                      <p style={{ fontSize:11, color:'rgba(165,180,252,0.7)', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase' }}>
                        {coach?.coachCompany || 'Senior Career Mentor'}
                      </p>
                    </div>
                    {coach && (
                      <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(245,158,11,0.08)', padding:'7px 12px', borderRadius:10, border:'1px solid rgba(245,158,11,0.15)' }}>
                        <span style={{ color:'#f59e0b' }}>{Icons.Star}</span>
                        <span style={{ color:'#fef3c7', fontWeight:700, fontSize:13 }}>{coach.coachRating || 4.9}</span>
                        <span style={{ color:'rgba(245,158,11,0.5)', fontSize:11, fontWeight:500 }}>({coach.coachReviews || 0})</span>
                      </div>
                    )}
                  </div>

                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, lineHeight:1.7, marginTop:14, fontWeight:300, fontStyle:'italic' }}>
                    "{coach?.coachBio || 'Your coach will help you navigate the job market and optimize your professional profile for success.'}"
                  </p>

                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:16 }}>
                    {(coach?.coachExpertise || ['CV Review', 'Interviews', 'Networking']).slice(0, 3).map(tag => (
                      <span key={tag} style={{ padding:'5px 12px', borderRadius:8, background:'rgba(99,102,241,0.07)', color:'rgba(165,180,252,0.8)', fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', border:'1px solid rgba(99,102,241,0.12)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="divider" style={{ margin:'28px 0' }} />

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Link href="/candidate/messages" className="btn-ghost">{Icons.Messages} Message</Link>
                <Link href="/candidate/calendar" className="btn-primary">{Icons.Calendar} Book Session</Link>
              </div>
            </div>

            {/* MESSAGES + ANNOUNCEMENTS ROW */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28 }}>

              {/* Recent Messages */}
              <div className="fade-up delay-2 card" style={{ padding:28, display:'flex', flexDirection:'column' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div className="icon-badge" style={{ background:'rgba(14,116,144,0.1)', border:'1px solid rgba(14,116,144,0.2)', color:'#67e8f9' }}>{Icons.Messages}</div>
                    <h3 style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', margin:0 }}>Messages</h3>
                  </div>
                  {recentMessages.length > 0 && (
                    <Link href="/candidate/messages" style={{ fontSize:10, fontWeight:600, color:'rgba(103,232,249,0.6)', letterSpacing:'0.1em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:4 }}>
                      All {Icons.ArrowRight}
                    </Link>
                  )}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1 }}>
                  {recentMessages.length > 0 ? recentMessages.map((msg, i) => (
                    <Link href="/candidate/messages" key={i}>
                      <div className="msg-row">
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                          <p style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.7)', margin:0 }}>{msg.senderName || 'Coach'}</p>
                          <span style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.25)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:300 }}>{msg.text}</p>
                      </div>
                    </Link>
                  )) : (
                    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 0' }}>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', fontWeight:300 }}>No recent messages.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Announcements */}
              <div className="fade-up delay-3 card" style={{ padding:28, display:'flex', flexDirection:'column' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div className="icon-badge" style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', color:'#a5b4fc' }}>{Icons.Announcement}</div>
                    <h3 style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', margin:0 }}>Announcements</h3>
                  </div>
                  {announcements.length > 0 && (
                    <Link href="/candidate/messages" style={{ fontSize:10, fontWeight:600, color:'rgba(165,180,252,0.5)', letterSpacing:'0.1em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:4 }}>
                      All {Icons.ArrowRight}
                    </Link>
                  )}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1 }}>
                  {announcements.length > 0 ? announcements.slice(0, 3).map((ann, i) => (
                    <div key={i} className="msg-row">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                        <p style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.7)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'65%' }}>{ann.subject || 'Update'}</p>
                        <span style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.25)', letterSpacing:'0.08em', textTransform:'uppercase', flexShrink:0 }}>
                          {new Date(ann.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:300 }}>{ann.text}</p>
                    </div>
                  )) : (
                    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 0' }}>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', fontWeight:300 }}>No announcements.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display:'flex', flexDirection:'column', gap:28 }}>

            {/* Progress Card */}
            <div className="fade-up delay-2 card" style={{ padding:32 }}>
              <p className="section-label" style={{ textAlign:'center', marginBottom:28 }}>Program Progress</p>

              {/* Arc ring */}
              <div style={{ position:'relative', width:160, height:160, margin:'0 auto 28px' }}>
                <svg width="160" height="160" viewBox="0 0 192 192" style={{ transform:'rotate(-90deg)' }}>
                  {/* Track */}
                  <circle cx="96" cy="96" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  {/* Progress arc */}
                  <circle
                    cx="96" cy="96" r="80" fill="none"
                    stroke="url(#arcGrad)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 80}
                    strokeDashoffset={2 * Math.PI * 80 * (1 - stats.percentage / 100)}
                    className="arc-glow"
                    style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
                  />
                  <defs>
                    <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#67e8f9" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <span className="serif" style={{ fontSize:36, color:'#fff', lineHeight:1, fontWeight:400 }}>{stats.percentage}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4, fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase' }}>complete</span>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <div className="stat-row">
                  <span style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>Sessions</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>
                    {stats.sessions} <span style={{ color:'rgba(255,255,255,0.2)', fontWeight:400 }}>/ {stats.totalSessions}</span>
                  </span>
                </div>
                <div className="stat-row">
                  <span style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>Documents</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>
                    {stats.docs} <span style={{ color:'rgba(255,255,255,0.2)', fontWeight:400 }}>shared</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Next Session Card */}
            <div className="fade-up delay-3 card" style={{ padding:28, position:'relative', overflow:'hidden', background:'rgba(79,70,229,0.1)', borderColor:'rgba(99,102,241,0.18)' }}>
              {/* Subtle inner glow */}
              <div style={{ position:'absolute', top:0, right:0, width:180, height:180, background:'radial-gradient(circle at top right, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />

              <p className="section-label" style={{ marginBottom:20, position:'relative', zIndex:1 }}>Upcoming Session</p>

              {nextSession ? (
                <div style={{ position:'relative', zIndex:1 }}>
                  <h3 className="serif" style={{ fontSize:20, color:'#fff', fontWeight:400, lineHeight:1.3, marginBottom:16 }}>
                    {nextSession.title || 'Career Strategy'}
                  </h3>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
                    <span style={{ padding:'5px 12px', borderRadius:8, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:500, border:'1px solid rgba(255,255,255,0.1)' }}>
                      {new Date(nextSession.date).toLocaleDateString()}
                    </span>
                    <span style={{ padding:'5px 12px', borderRadius:8, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.6)', fontSize:11, fontWeight:500, border:'1px solid rgba(255,255,255,0.1)' }}>
                      {nextSession.time}
                    </span>
                  </div>
                  {isWithinOneHour(nextSession.date, nextSession.time) ? (
                    <button className="btn-primary" style={{ background:'linear-gradient(135deg,#4f46e5,#0891b2)' }}>
                      {Icons.VideoCall} Join Call
                    </button>
                  ) : (
                    <Link href="/candidate/calendar" className="btn-ghost">{Icons.Calendar} View Details</Link>
                  )}
                </div>
              ) : (
                <div style={{ textAlign:'center', paddingTop:8, position:'relative', zIndex:1 }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                    <svg style={{ width:22, height:22, color:'rgba(165,180,252,0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginBottom:20, fontWeight:300 }}>Your schedule is clear.</p>
                  <Link href="/candidate/calendar" className="btn-primary">{Icons.Calendar} Book a Session</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── QUICK ACCESS ────────────────────────────────────────────────────── */}
        <div className="fade-up delay-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {[
            { label:'Messages', icon:Icons.Messages, href:'/candidate/messages', accent:'rgba(14,116,144,0.12)', accentBorder:'rgba(14,116,144,0.2)', iconColor:'#67e8f9' },
            { label:'Calendar', icon:Icons.Calendar, href:'/candidate/calendar', accent:'rgba(16,185,129,0.1)', accentBorder:'rgba(16,185,129,0.18)', iconColor:'#34d399' },
            { label:'Documents', icon:Icons.Documents, href:'/candidate/documents', accent:'rgba(245,158,11,0.1)', accentBorder:'rgba(245,158,11,0.18)', iconColor:'#fbbf24' },
            { label:'Agreement', icon:Icons.Agreement, href:'/candidate/agreement', accent:'rgba(239,68,68,0.08)', accentBorder:'rgba(239,68,68,0.15)', iconColor:'#f87171' },
          ].map(item => (
            <Link key={item.label} href={item.href}>
              <div className="shortcut-card">
                <div style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:item.accent, border:`1px solid ${item.accentBorder}`, color:item.iconColor, marginBottom:14, transition:'transform 0.2s' }}>
                  {item.icon}
                </div>
                <p style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.45)', letterSpacing:'0.15em', textTransform:'uppercase', margin:0 }}>{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}