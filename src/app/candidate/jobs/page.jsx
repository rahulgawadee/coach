'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  DollarSign, 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  X, 
  Upload, 
  Link as LinkIcon,
  Briefcase,
  Zap,
  Globe,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'var(--background)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="var(--primary)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter:'blur(40px)' }} />
  </div>
);

const DUMMY_JOBS = [
  {
    id: 1,
    title: "Senior Full Stack Engineer",
    company: "TechVance AI",
    location: "Remote / San Francisco",
    type: "Full-time",
    salary: "$140k - $190k",
    posted: "2 days ago",
    tags: ["React", "Node.js", "Python"],
    description: "Lead the development of our core AI-powered learning platform. You'll work with Next.js and distributed systems."
  },
  {
    id: 2,
    title: "Product Designer",
    company: "CreativeFlow",
    location: "Remote / London",
    type: "Full-time",
    salary: "$90k - $130k",
    posted: "5 hours ago",
    tags: ["Figma", "UI/UX", "System Design"],
    description: "Craft beautiful, intuitive experiences for our global user base. Focus on glassmorphic aesthetics and motion design."
  },
  {
    id: 3,
    title: "Marketing Manager",
    company: "GrowthLabs",
    location: "New York, NY",
    type: "Hybrid",
    salary: "$110k - $150k",
    posted: "1 day ago",
    tags: ["SEO", "Content", "Ads"],
    description: "Scale our user acquisition channels and build a world-class brand identity for a fast-growing startup."
  },
  {
    id: 4,
    title: "Data Scientist (AI)",
    company: "NeuralNet Systems",
    location: "Remote / Austin",
    type: "Full-time",
    salary: "$160k - $210k",
    posted: "3 days ago",
    tags: ["PyTorch", "MLOps", "NLP"],
    description: "Implement cutting-edge LLM architectures and optimize our internal matching algorithms."
  },
  {
    id: 5,
    title: "Frontend Developer",
    company: "PixelPerfect",
    location: "Berlin, DE",
    type: "Contract",
    salary: "$80 - $120 / hr",
    posted: "1 week ago",
    tags: ["Tailwind", "TypeScript", "Three.js"],
    description: "Build immersive 3D web experiences using modern frontend technologies and high-performance animations."
  }
];

export default function CandidateJobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(null); // 'quick' | 'custom'
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleQuickApply = (jobId) => {
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setApplying(null);
      setSelectedJob(null);
    }, 3000);
  };

  const handleCustomApply = (e) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setApplying(null);
      setSelectedJob(null);
    }, 3000);
  };

  const filteredJobs = DUMMY_JOBS.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen font-['DM_Sans',sans-serif] text-var(--text-secondary) pb-20">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          backdrop-filter: blur(24px);
          border-radius: 24px;
        }
        .job-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .job-card:hover {
          background: var(--card-bg);
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        .btn-primary {
          background: var(--primary);
          box-shadow: 0 4px 15px var(--primary-glow);
          transition: all 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px var(--primary-glow);
          filter: brightness(1.1);
        }
        .modal-overlay {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(12px);
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-content {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        input, select, textarea {
          background: var(--input-bg);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 12px 16px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus {
          border-color: var(--primary);
        }
        @media (max-width: 640px) {
          .serif { font-size: 2.2rem !important; }
          .glass-card { border-radius: 20px; }
          .hero-padding { padding: 2.5rem 1.5rem !important; }
        }
      `}</style>

      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 pt-12 mb-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-var(--primary-glow) border border-var(--primary) text-[10px] font-bold text-var(--primary) uppercase tracking-widest">
              <Sparkles size={12} className="text-var(--primary)" />
              Opportunities
            </div>
            <h1 className="serif text-4xl md:text-5xl lg:text-6xl text-var(--text-primary) tracking-tight leading-[1.1]">
              Find Your Next <br className="hidden sm:block" />
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-var(--primary) to-var(--accent)">Career Leap</span>
            </h1>
            <p className="text-var(--text-muted) font-light max-w-xl text-sm sm:text-base">
              Curated roles from world-class tech companies and startups. Applied directly via Coach AI.
            </p>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-var(--text-muted)" size={18} />
              <input 
                type="text" 
                placeholder="Search jobs, skills..." 
                className="w-full pl-12 pr-4 py-3.5 bg-var(--input-bg) border border-var(--card-border) rounded-2xl text-sm focus:bg-var(--card-bg)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-3.5 bg-var(--card-bg) border border-var(--card-border) rounded-2xl hover:bg-var(--primary-glow) transition-all text-var(--text-muted)">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="glass-card job-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-var(--primary-glow) border border-var(--primary) flex items-center justify-center text-var(--primary)">
                    <Building2 size={24} />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    {job.type}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-var(--text-primary) mb-1">{job.title}</h3>
                <p className="text-var(--primary) font-medium text-sm mb-4">{job.company}</p>
                
                <div className="flex flex-wrap gap-4 text-xs text-var(--text-muted) mb-6">
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-var(--text-muted)" /> {job.location}</span>
                  <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-var(--text-muted)" /> {job.salary}</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-var(--text-muted)" /> {job.posted}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {job.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-var(--card-bg) border border-var(--card-border) text-[10px] font-semibold text-var(--text-secondary)">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-var(--card-border)">
                <button 
                  onClick={() => setSelectedJob(job)}
                  className="text-var(--primary) text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all"
                >
                  View Details <ChevronRight size={16} />
                </button>
                <button 
                  onClick={() => { setSelectedJob(job); setApplying('options'); }}
                  className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="glass-card py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-var(--card-bg) border border-var(--card-border) flex items-center justify-center mx-auto text-var(--text-muted)">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-var(--text-primary)">No jobs found</h3>
            <p className="text-var(--text-muted)">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>

      {/* Application Success State */}
      {isSuccess && (
        <div className="fixed inset-0 z-[120] modal-overlay flex items-center justify-center">
          <div className="glass-card p-12 text-center space-y-6 max-w-md modal-content" style={{ background: 'var(--background)' }}>
            <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-var(--text-primary) serif">Application Sent!</h2>
              <p className="text-var(--text-muted)">We've submitted your details to {selectedJob?.company}. Good luck!</p>
            </div>
          </div>
        </div>
      )}

      {/* Apply Options Modal */}
      {applying === 'options' && (
        <div className="fixed inset-0 z-[120] modal-overlay flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-lg overflow-hidden modal-content" style={{ background: 'var(--background)' }}>
            <div className="p-8 border-b border-var(--card-border) flex justify-between items-center" style={{ background: 'var(--background)' }}>
              <div>
                <h3 className="text-2xl font-bold text-var(--text-primary) serif">Apply to {selectedJob?.company}</h3>
                <p className="text-var(--text-muted) text-sm">{selectedJob?.title}</p>
              </div>
              <button onClick={() => setApplying(null)} className="p-2 hover:bg-var(--card-bg) rounded-full text-var(--text-muted)"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-4">
              <button 
                onClick={() => handleQuickApply(selectedJob.id)}
                className="w-full p-6 text-left glass-card transition-all group"
                style={{ border: '1px solid var(--primary)', background: 'var(--primary-glow)' }}
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="text-var(--text-primary) font-bold flex items-center gap-2">
                      <Zap size={16} className="text-amber-400 fill-amber-400" />
                      Quick Apply
                    </h4>
                    <p className="text-var(--text-muted) text-xs">Apply instantly using your Coach profile and uploaded resume.</p>
                  </div>
                  <ArrowRight size={20} className="text-var(--text-muted) group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <button 
                onClick={() => setApplying('custom')}
                className="w-full p-6 text-left glass-card transition-all group"
                style={{ border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="text-var(--text-primary) font-bold flex items-center gap-2">
                      <Sparkles size={16} className="text-var(--primary)" />
                      Custom Apply
                    </h4>
                    <p className="text-var(--text-muted) text-xs">Customize your application for this specific role.</p>
                  </div>
                  <ArrowRight size={20} className="text-var(--text-muted) group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Apply Form Modal */}
      {applying === 'custom' && (
        <div className="fixed inset-0 z-[120] modal-overlay flex items-center justify-center p-6 overflow-y-auto">
          <div className="glass-card w-full max-w-2xl my-auto modal-content" style={{ background: 'var(--background)' }}>
            <div className="p-8 border-b flex justify-between items-center sticky top-0 backdrop-blur-xl z-10" style={{ borderColor: 'var(--card-border)', background: 'var(--background)' }}>
              <div>
                <h3 className="text-2xl font-bold text-var(--text-primary) serif">Application Details</h3>
                <p className="text-var(--text-muted) text-sm">Applying for {selectedJob?.title} at {selectedJob?.company}</p>
              </div>
              <button onClick={() => setApplying('options')} className="p-2 hover:bg-var(--card-bg) rounded-full text-var(--text-muted)"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCustomApply} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest pl-1">Full Name</label>
                  <input type="text" placeholder="John Doe" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest pl-1">Email Address</label>
                  <input type="email" placeholder="john@example.com" required />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest pl-1">Phone Number</label>
                <input type="tel" placeholder="+1 (555) 000-0000" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest pl-1">Resume / CV</label>
                <div className="border-2 border-dashed border-var(--card-border) rounded-2xl p-8 text-center space-y-2 hover:border-var(--primary) transition-all cursor-pointer bg-var(--card-bg)">
                  <Upload size={24} className="mx-auto text-var(--text-muted) mb-2" />
                  <p className="text-sm text-var(--text-primary) font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-var(--text-muted)">PDF, DOCX (Max 10MB)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 text-var(--text-secondary)">
                  <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest pl-1">LinkedIn URL</label>
                  <div className="relative">
                    <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-var(--text-muted)" />
                    <input type="url" placeholder="linkedin.com/in/..." className="pl-10 w-full" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-var(--text-secondary)">
                  <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest pl-1">Portfolio / Github</label>
                  <div className="relative">
                    <LinkIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-var(--text-muted)" />
                    <input type="url" placeholder="github.com/..." className="pl-10 w-full" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest pl-1">Why do you want to join?</label>
                <textarea rows={4} placeholder="Tell us what excites you about this role..." required />
              </div>

              <button type="submit" className="w-full btn-primary py-4 rounded-2xl font-bold text-base mt-4">
                Submit Application
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Job Detail Modal (Optional Sidebar/Overlay) */}
      {selectedJob && !applying && (
        <div className="fixed inset-0 z-[120] modal-overlay flex justify-end p-0 md:p-4">
          <div className="glass-card w-full max-w-2xl h-full overflow-y-auto modal-content rounded-none md:rounded-3xl" style={{ background: 'var(--background)' }}>
            <div className="p-8 border-b flex justify-between items-start sticky top-0 backdrop-blur-xl z-10" style={{ borderColor: 'var(--card-border)', background: 'var(--background)' }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-var(--primary)" style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)' }}>
                  <Building2 size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-var(--text-primary) serif">{selectedJob.title}</h2>
                  <p className="text-var(--primary) font-medium">{selectedJob.company}</p>
                </div>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-var(--card-bg) rounded-full text-var(--text-muted)"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest">Salary Range</p>
                  <p className="text-sm font-semibold text-var(--text-primary)">{selectedJob.salary}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest">Location</p>
                  <p className="text-sm font-semibold text-var(--text-primary)">{selectedJob.location}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest">Commitment</p>
                  <p className="text-sm font-semibold text-var(--text-primary)">{selectedJob.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest">Posted</p>
                  <p className="text-sm font-semibold text-var(--text-primary)">{selectedJob.posted}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-var(--text-primary) font-bold uppercase text-xs tracking-widest">Role Description</h4>
                <p className="text-var(--text-secondary) leading-relaxed">
                  {selectedJob.description}
                  <br /><br />
                  As a {selectedJob.title} at {selectedJob.company}, you will be part of a dynamic team pushing the boundaries of technology. We look for individuals who are passionate about their craft and eager to make a global impact.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-var(--text-primary) font-bold uppercase text-xs tracking-widest">Key Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.tags.map(tag => (
                    <span key={tag} className="px-4 py-2 rounded-xl bg-var(--card-bg) border border-var(--card-border) text-xs font-semibold text-var(--primary)">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  onClick={() => setApplying('options')}
                  className="flex-1 btn-primary py-4 rounded-2xl font-bold"
                >
                  Apply for this position
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
