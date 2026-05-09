'use client';

import { useState, useEffect, useRef } from "react";

const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return [ref, vis];
};

const useCount = (target, dur = 2200, go = false) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!go) return;
    let s = null;
    const fn = (t) => {
      if (!s) s = t;
      const p = Math.min((t - s) / dur, 1);
      setV(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(fn);
    };
    requestAnimationFrame(fn);
  }, [go, target, dur]);
  return v;
};

const pts = Array.from({ length: 22 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  sz: Math.random() * 2.5 + 1, dur: Math.random() * 14 + 8,
  delay: Math.random() * 8, op: Math.random() * 0.3 + 0.07,
  c: i % 3 === 0 ? "56,189,248" : i % 3 === 1 ? "129,140,248" : "167,139,250",
}));

const Orb = ({ color, sz, style }) => (
  <div style={{ position:"absolute", width:sz, height:sz, borderRadius:"50%", background:color, filter:`blur(${sz*.22}px)`, pointerEvents:"none", ...style }} />
);

const StatPill = ({ n, suf, label, go }) => {
  const v = useCount(n, 2200, go);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ flex:1, minWidth:130, textAlign:"center", padding:"26px 16px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20 }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:34, fontWeight:800, letterSpacing:"-0.04em", background:"linear-gradient(135deg,#38bdf8,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
        {mounted ? (suf === "+" ? `${v.toLocaleString()}+` : `${v}${suf}`) : (suf === "+" ? `${v}+` : `${v}${suf}`)}
      </div>
      <div style={{ fontSize:11, color:"rgba(148,163,184,.65)", marginTop:6, fontWeight:700, letterSpacing:".09em", textTransform:"uppercase" }}>{label}</div>
    </div>
  );
};

const Feat = ({ icon, title, desc, grad, delay }) => {
  const [ref, vis] = useInView();
  const [hov, setHov] = useState(false);
  return (
    <div ref={ref}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.03)",
        border:`1px solid ${hov ? "rgba(99,102,241,.35)" : "rgba(255,255,255,.07)"}`,
        borderRadius:26, padding:"30px 26px",
        transition:"all .45s cubic-bezier(.23,1,.32,1)",
        transform: vis ? (hov ? "translateY(-7px)" : "translateY(0)") : "translateY(26px)",
        opacity: vis ? 1 : 0, transitionDelay: vis ? `${delay}ms` : "0ms",
        position:"relative", overflow:"hidden",
      }}>
      {hov && <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 25% 25%,${grad}16,transparent 65%)`, pointerEvents:"none" }} />}
      <div style={{ width:48, height:48, borderRadius:14, background:grad, marginBottom:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:`0 6px 20px ${grad}35` }}>{icon}</div>
      <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:"#f1f5f9", marginBottom:9 }}>{title}</h3>
      <p style={{ fontSize:14, color:"rgba(148,163,184,.8)", lineHeight:1.75, margin:0 }}>{desc}</p>
    </div>
  );
};

const MCard = ({ name, role, spec, rating }) => {
  const grads = ["linear-gradient(135deg,#6366f1,#8b5cf6)","linear-gradient(135deg,#0ea5e9,#6366f1)","linear-gradient(135deg,#10b981,#0ea5e9)"];
  const g = grads[name.charCodeAt(0) % 3];
  return (
    <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:20, padding:"20px 18px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
        <div style={{ width:42, height:42, borderRadius:13, background:g, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:16, color:"#fff" }}>{name[0]}</div>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:"#f1f5f9" }}>{name}</div>
          <div style={{ fontSize:12, color:"rgba(148,163,184,.6)", marginTop:2 }}>{role}</div>
        </div>
      </div>
      <div style={{ display:"inline-block", padding:"4px 11px", borderRadius:100, background:"rgba(99,102,241,.12)", border:"1px solid rgba(99,102,241,.28)", fontSize:11, color:"#818cf8", fontWeight:700, letterSpacing:".04em", marginBottom:11 }}>{spec}</div>
      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
        {"★★★★★".split("").map((s,i)=><span key={i} style={{color:"#fbbf24",fontSize:12}}>{s}</span>)}
        <span style={{ fontSize:11, color:"rgba(148,163,184,.55)", marginLeft:5 }}>{rating}</span>
      </div>
    </div>
  );
};

const Faq = ({ q, a, open, toggle }) => (
  <div style={{ background: open?"rgba(99,102,241,.06)":"rgba(255,255,255,.03)", border:`1px solid ${open?"rgba(99,102,241,.28)":"rgba(255,255,255,.07)"}`, borderRadius:17, overflow:"hidden", marginBottom:9, transition:"all .3s ease" }}>
    <button onClick={toggle} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 22px", background:"none", border:"none", cursor:"pointer", color:"#f1f5f9", textAlign:"left" }}>
      <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:14 }}>{q}</span>
      <span style={{ width:25, height:25, borderRadius:"50%", background: open?"linear-gradient(135deg,#6366f1,#38bdf8)":"rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, marginLeft:12, transition:"all .3s ease", transform: open?"rotate(45deg)":"none", color:"#fff" }}>+</span>
    </button>
    <div style={{ maxHeight: open?200:0, overflow:"hidden", transition:"max-height .45s cubic-bezier(.23,1,.32,1)" }}>
      <p style={{ padding:"0 22px 18px", margin:0, color:"rgba(148,163,184,.8)", lineHeight:1.75, fontSize:13 }}>{a}</p>
    </div>
  </div>
);

const Chip = ({ children, color="#6366f1" }) => (
  <div style={{ display:"inline-block", padding:"5px 15px", borderRadius:100, background:`${color}18`, border:`1px solid ${color}35`, fontSize:11, color, fontWeight:700, letterSpacing:".09em", textTransform:"uppercase", marginBottom:20 }}>{children}</div>
);

const SHead = ({ chip, cc, h, sub, center=true }) => (
  <div style={{ textAlign:center?"center":"left", marginBottom:52 }}>
    {chip && <Chip color={cc}>{chip}</Chip>}
    <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:800, letterSpacing:"-0.035em", lineHeight:1.1, color:"#f8fafc", margin:"0 0 16px" }} dangerouslySetInnerHTML={{__html:h}} />
    {sub && <p style={{ fontSize:15, color:"rgba(148,163,184,.75)", maxWidth:500, margin:center?"0 auto":"0", lineHeight:1.8 }}>{sub}</p>}
  </div>
);

const W = { maxWidth:1060, margin:"0 auto", padding:"0 32px" };

export default function CoachLanding() {
  const [mounted, setMounted] = useState(false);
  const [faq, setFaq] = useState(null);
  const [email, setEmail] = useState("");
  const [heroVis, setHeroVis] = useState(false);
  const [sRef, sVis] = useInView(0.3);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setHeroVis(true), 80);
  }, []);

  const fade = (d=0) => ({
    opacity: heroVis ? 1 : 0,
    transform: heroVis ? "translateY(0)" : "translateY(22px)",
    transition: `opacity .7s ease ${d}ms, transform .7s cubic-bezier(.23,1,.32,1) ${d}ms`,
  });

  const features = [
    { icon:"🎯", title:"Expert Mentors", desc:"Seasoned professionals with real, battle-tested knowledge tailored to your exact goals.", grad:"linear-gradient(135deg,#6366f1,#8b5cf6)", delay:0 },
    { icon:"✦",  title:"AI Smart Matching", desc:"Our engine surfaces your top 3 mentor matches within 48 hours based on goals and learning style.", grad:"linear-gradient(135deg,#0ea5e9,#38bdf8)", delay:80 },
    { icon:"🚀", title:"Career Acceleration", desc:"Structured 90-day growth sprints that compress years of trial-and-error into focused sessions.", grad:"linear-gradient(135deg,#10b981,#6ee7b7)", delay:160 },
    { icon:"🛡", title:"Trusted Platform", desc:"Hand-verified mentors. A safe, structured environment for meaningful long-term relationships.", grad:"linear-gradient(135deg,#f59e0b,#fbbf24)", delay:240 },
  ];

  const mentors = [
    { name:"Priya S.",  role:"Senior PM @ Google",         spec:"Product Strategy",      rating:"4.98" },
    { name:"Marcus L.", role:"CTO @ Series B Startup",      spec:"Engineering Leadership", rating:"4.96" },
    { name:"Ayesha K.", role:"Partner @ a16z",              spec:"Fundraising & Growth",   rating:"5.0" },
  ];

  const faqs = [
    { q:"How does mentor matching work?",     a:"Our AI analyses your career goals, skills, and learning style to surface your top 3 matches. Most users find their ideal mentor within 48 hours of signing up." },
    { q:"Can I switch mentors?",              a:"Yes — your growth comes first. Request a new match any time, no questions asked. We handle the transition and re-matching thoughtfully." },
    { q:"Is the platform free to join?",      a:"Mentees join and get matched for free. Mentors can give back freely or unlock premium tools with optional plans. No hidden fees." },
    { q:"What industries do you cover?",      a:"120+ countries, virtually every professional domain — from fintech and healthcare to deep tech, creative industries, and climate." },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#08080f;overflow-x:hidden}
        @keyframes float{0%{transform:translateY(0) scale(1)}100%{transform:translateY(-20px) scale(1.07)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulse{0%,100%{opacity:.45}50%{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .bp{background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#6366f1 100%);background-size:200% auto;animation:shimmer 3.5s linear infinite;border:none;border-radius:13px;padding:13px 30px;font-size:14px;font-weight:700;color:#fff;cursor:pointer;font-family:'Syne',sans-serif;letter-spacing:.03em;transition:transform .25s ease,box-shadow .25s ease;box-shadow:0 0 26px rgba(99,102,241,.38),0 4px 14px rgba(99,102,241,.25)}
        .bp:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 0 42px rgba(99,102,241,.55),0 8px 22px rgba(99,102,241,.38)}
        .bg{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:13px;padding:13px 28px;font-size:14px;font-weight:600;color:#e2e8f0;cursor:pointer;font-family:'Syne',sans-serif;transition:all .3s ease;backdrop-filter:blur(10px)}
        .bg:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.22);transform:translateY(-2px)}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#08080f}::-webkit-scrollbar-thumb{background:rgba(99,102,241,.4);border-radius:2px}
      `}</style>

      <div style={{ background:"#08080f", fontFamily:"'DM Sans',sans-serif", color:"#f1f5f9" }}>

        {/* ── HERO ── */}
        <section style={{ position:"relative", minHeight:"100vh", display:"flex", alignItems:"center", overflow:"hidden" }}>
          <Orb color="radial-gradient(circle,#4f46e5,transparent)" sz={580} style={{ top:-110, left:-110, opacity:.22 }} />
          <Orb color="radial-gradient(circle,#0284c7,transparent)" sz={460} style={{ bottom:-60, right:-80, opacity:.18 }} />
          <Orb color="radial-gradient(circle,#7c3aed,transparent)" sz={260} style={{ top:"55%", left:"46%", opacity:.1 }} />
          {/* grid */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(148,163,184,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.04) 1px,transparent 1px)", backgroundSize:"56px 56px", pointerEvents:"none" }} />
          {/* particles */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
            {mounted && pts.map(p => <div key={p.id} style={{ position:"absolute", left:`${p.x}%`, top:`${p.y}%`, width:p.sz, height:p.sz, borderRadius:"50%", background:`rgba(${p.c},${p.op})`, animation:`float ${p.dur}s ease-in-out ${p.delay}s infinite alternate` }} />)}
          </div>
          {/* rings */}
          <div style={{ position:"absolute", right:-30, top:"50%", transform:"translateY(-50%)", width:540, height:540, borderRadius:"50%", border:"1px solid rgba(99,102,241,.1)", animation:"spin 40s linear infinite", pointerEvents:"none" }}>
            <div style={{ position:"absolute", top:22, left:"50%", width:9, height:9, borderRadius:"50%", background:"#6366f1", transform:"translateX(-50%)", boxShadow:"0 0 16px #6366f1" }} />
          </div>
          <div style={{ position:"absolute", right:80, top:"50%", transform:"translateY(-50%)", width:360, height:360, borderRadius:"50%", border:"1px solid rgba(56,189,248,.07)", animation:"spin 24s linear infinite reverse", pointerEvents:"none" }} />

          <div style={{ ...W, position:"relative", zIndex:10, paddingTop:100, paddingBottom:80, width:"100%" }}>
            <div style={{ maxWidth:660 }}>

              {/* badge */}
              <div style={{ ...fade(80), display:"inline-flex", alignItems:"center", gap:8, padding:"7px 16px", borderRadius:100, background:"rgba(99,102,241,.1)", border:"1px solid rgba(99,102,241,.25)", marginBottom:30 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:"#6ee7b7", boxShadow:"0 0 8px #6ee7b7", animation:"pulse 2s infinite" }} />
                <span style={{ fontSize:11, color:"#a5b4fc", fontWeight:700, letterSpacing:".07em" }}>✦ AI-POWERED MENTORSHIP PLATFORM</span>
              </div>

              {/* headline */}
              <div style={fade(180)}>
                <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(42px,7vw,72px)", fontWeight:800, lineHeight:1.04, letterSpacing:"-0.045em", color:"#f8fafc" }}>
                  Accelerate Your
                  <span style={{ display:"block", background:"linear-gradient(125deg,#38bdf8 0%,#818cf8 45%,#c084fc 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundSize:"200% auto", animation:"shimmer 4s linear infinite" }}>Dream Career</span>
                  with AI Mentors.
                </h1>
              </div>

              {/* sub */}
              <p style={{ ...fade(290), fontSize:16, lineHeight:1.8, color:"rgba(148,163,184,.85)", maxWidth:520, marginTop:22, marginBottom:38 }}>
                Connect with world-class mentors handpicked for your goals. Unlock personalised guidance, structured growth plans, and the network that opens every door.
              </p>

              {/* CTAs */}
              <div style={{ ...fade(380), display:"flex", gap:12, flexWrap:"wrap" }}>
                <button className="bp" style={{ fontSize:15, padding:"15px 36px" }}>Start for free →</button>
                <button className="bg" style={{ fontSize:15, padding:"15px 32px", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#38bdf8)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>▶</span>
                  Watch demo
                </button>
              </div>

              {/* social proof */}
              <div style={{ ...fade(470), display:"flex", alignItems:"center", gap:18, marginTop:44, paddingTop:26, borderTop:"1px solid rgba(255,255,255,.06)" }}>
                <div style={{ display:"flex" }}>
                  {["#6366f1","#38bdf8","#10b981","#f59e0b","#ec4899"].map((c,i)=>(
                    <div key={i} style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${c},${c}88)`, border:"2px solid #08080f", marginLeft:i?-10:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, fontFamily:"'Syne',sans-serif", color:"#fff" }}>
                      {["P","M","A","S","R"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#f1f5f9" }}>50,000+ professionals growing with Coach.</div>
                  <div style={{ fontSize:12, color:"rgba(148,163,184,.6)", marginTop:3 }}>
                    <span style={{ color:"#fbbf24" }}>★★★★★</span>&nbsp; 4.9 / 5.0 · 12,000+ reviews
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAND ── */}
        <div ref={sRef} style={{ background:"rgba(255,255,255,.025)", borderTop:"1px solid rgba(255,255,255,.05)", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
          <div style={{ ...W, paddingTop:36, paddingBottom:36 }}>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              {[{n:50000,s:"+",l:"Active Members"},{n:15000,s:"+",l:"Expert Mentors"},{n:98,s:"%",l:"Satisfaction"},{n:120,s:"+",l:"Countries"}].map((d,i)=>(
                <StatPill key={i} n={d.n} suf={d.s} label={d.l} go={sVis} />
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section style={{ padding:"90px 0" }}>
          <div style={W}>
            <SHead chip="Why Coach." cc="#38bdf8"
              h={`Built for Modern <span style="background:linear-gradient(135deg,#38bdf8,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Career Growth</span>`}
              sub="Every feature reduces friction between you and the guidance that changes your trajectory."
            />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))", gap:16 }}>
              {features.map((f,i) => <Feat key={i} {...f} />)}
            </div>
          </div>
        </section>

        {/* ── MENTORS ── */}
        <section style={{ padding:"0 0 90px" }}>
          <div style={W}>
            <div style={{ background:"linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.02))", border:"1px solid rgba(255,255,255,.07)", borderRadius:34, padding:"52px 48px", position:"relative", overflow:"hidden" }}>
              <Orb color="radial-gradient(circle,#6366f1,transparent)" sz={360} style={{ top:-90, right:-70, opacity:.14 }} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center", position:"relative", zIndex:1 }}>
                <div>
                  <Chip color="#818cf8">Meet the mentors</Chip>
                  <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(26px,3.5vw,38px)", fontWeight:800, letterSpacing:"-0.035em", lineHeight:1.1, marginBottom:16 }}>
                    World-class experts,
                    <span style={{ display:"block", background:"linear-gradient(135deg,#818cf8,#38bdf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>ready for you.</span>
                  </h2>
                  <p style={{ fontSize:14, color:"rgba(148,163,184,.8)", lineHeight:1.8, marginBottom:28 }}>
                    Every mentor on Coach. is hand-vetted — real credentials, real experience, real commitment to your success.
                  </p>
                  <button className="bp">Browse all mentors →</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
                  {mentors.map((m,i) => <MCard key={i} {...m} />)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding:"0 0 90px" }}>
          <div style={W}>
            <SHead chip="The process" cc="#10b981"
              h={`Three steps to your <span style="background:linear-gradient(135deg,#10b981,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent">ideal mentor</span>`}
              sub="From sign-up to first session in under 48 hours."
            />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18, position:"relative" }}>
              <div style={{ position:"absolute", top:34, left:"18%", right:"18%", height:1, background:"linear-gradient(90deg,rgba(99,102,241,.35),rgba(56,189,248,.35))", zIndex:0 }} />
              {[
                { n:"01", title:"Create your profile",  desc:"Tell us about your goals, experience level, and the kind of mentor you're looking for.", col:"#6366f1" },
                { n:"02", title:"Get matched by AI",    desc:"Our algorithm surfaces your top 3 mentor matches within 48 hours. Browse profiles and pick your fit.", col:"#38bdf8" },
                { n:"03", title:"Start growing",        desc:"Book your first session, set goals together, and begin your structured 90-day mentorship sprint.", col:"#10b981" },
              ].map((s,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:22, padding:"30px 24px", position:"relative", zIndex:1 }}>
                  <div style={{ width:46, height:46, borderRadius:13, marginBottom:18, background:`${s.col}1e`, border:`1px solid ${s.col}35`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, color:s.col }}>{s.n}</div>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#f1f5f9", marginBottom:9 }}>{s.title}</h3>
                  <p style={{ fontSize:13, color:"rgba(148,163,184,.75)", lineHeight:1.75, margin:0 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ padding:"0 0 90px" }}>
          <div style={{ maxWidth:700, margin:"0 auto", padding:"0 32px" }}>
            <SHead chip="FAQ" cc="#f59e0b" h="Got questions?" sub="Everything you need to know, right here." />
            {faqs.map((f,i) => <Faq key={i} q={f.q} a={f.a} open={faq===i} toggle={()=>setFaq(faq===i?null:i)} />)}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding:"0 0 90px" }}>
          <div style={W}>
            <div style={{ background:"linear-gradient(145deg,#0c0b18,#101020)", border:"1px solid rgba(99,102,241,.2)", borderRadius:38, padding:"68px 52px", textAlign:"center", position:"relative", overflow:"hidden" }}>
              <Orb color="radial-gradient(circle,#6366f1,transparent)" sz={460} style={{ top:-70, left:"50%", transform:"translateX(-50%)", opacity:.22 }} />
              <Orb color="radial-gradient(circle,#38bdf8,transparent)" sz={300} style={{ bottom:-80, right:-60, opacity:.14 }} />
              <div style={{ position:"relative", zIndex:1 }}>
                <Chip color="#a5b4fc">✦ Join 50k+ professionals</Chip>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(32px,5vw,54px)", fontWeight:800, letterSpacing:"-0.04em", lineHeight:1.07, marginBottom:16 }}>
                  Your next big move
                  <span style={{ display:"block", background:"linear-gradient(135deg,#38bdf8,#a78bfa,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>starts here.</span>
                </h2>
                <p style={{ fontSize:15, color:"rgba(148,163,184,.75)", maxWidth:440, margin:"0 auto 36px", lineHeight:1.78 }}>
                  Get matched with your ideal mentor in under 48 hours. No commitments, no risk — just momentum.
                </p>
                <div style={{ display:"flex", gap:10, justifyContent:"center", maxWidth:440, margin:"0 auto" }}>
                  <input type="email" placeholder="Enter your work email" value={email} onChange={e=>setEmail(e.target.value)}
                    style={{ flex:1, padding:"13px 17px", borderRadius:13, fontSize:14, background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", color:"#f1f5f9", outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
                  <button className="bp" style={{ flexShrink:0, padding:"13px 22px" }}>Get matched</button>
                </div>
                <p style={{ fontSize:11, color:"rgba(148,163,184,.3)", marginTop:13 }}>Free forever · No credit card required · Cancel anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop:"1px solid rgba(255,255,255,.06)", padding:"36px 32px" }}>
          <div style={{ ...W, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:18 }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:21, background:"linear-gradient(135deg,#38bdf8,#818cf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Coach.</div>
              <div style={{ fontSize:11, color:"rgba(148,163,184,.4)", marginTop:5 }}>AI-powered mentorship for modern careers.</div>
            </div>
            <div style={{ display:"flex", gap:26, flexWrap:"wrap" }}>
              {["Home","About","Blog","Contact","Privacy"].map(l=>(
                <a key={l} href="#" style={{ fontSize:13, color:"rgba(148,163,184,.65)", textDecoration:"none", transition:"color .2s" }}
                  onMouseEnter={e=>e.target.style.color="#f1f5f9"} onMouseLeave={e=>e.target.style.color="rgba(148,163,184,.65)"}>{l}</a>
              ))}
            </div>
            <div style={{ fontSize:11, color:"rgba(148,163,184,.3)" }}>© 2025 Coach. All rights reserved.</div>
          </div>
        </footer>
      </div>
    </>
  );
}