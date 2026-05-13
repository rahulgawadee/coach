"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import apiService from '@/services/api';
import { 
  Building2, 
  Mail, 
  Phone, 
  User, 
  Award, 
  TrendingUp, 
  Users, 
  Star, 
  Globe,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink
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

export default function CompanyInfoPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/login');
      return;
    }

    const fetchCompanyInfo = async () => {
      try {
        const data = await apiService.coach.getCompanyInfo();
        setCompanyInfo(data.companyInfo);
      } catch (err) {
        console.error('Company info error:', err);
        if (err.message === 'Unauthorized') {
          router.push('/login');
          return;
        }
        setError('Failed to load company information');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [isAuthenticated, hasRole, authToken, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(14,165,233,0.15)', borderTop:'1.5px solid #0ea5e9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, colorClass }) => (
    <div className="glass-card p-6 flex flex-col items-center text-center shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-var(--primary-glow) border border-transparent ${colorClass}`}>
        <Icon size={24} />
      </div>
      <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-var(--text-primary)">{value}</p>
    </div>
  );

  return (
    <div className="relative max-w-5xl mx-auto pb-16 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          backdrop-filter: blur(24px);
          border-radius: 32px;
        }
        .btn-premium {
          background: var(--primary);
          color: white;
          padding: 14px 28px;
          border-radius: 18px;
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: center; gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 25px var(--primary-glow);
          border: none;
        }
        .btn-premium:hover { transform: translateY(-2px); box-shadow: 0 12px 35px var(--primary-glow); filter: brightness(1.1); }
      `}</style>

      {/* Header */}
      <div className="pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4 sm:px-0 relative z-10">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-var(--primary-glow) border border-var(--primary) text-var(--primary) text-[10px] font-bold uppercase tracking-widest mb-4">
            <Building2 size={12} />
            Enterprise Identity
          </div>
          <h1 className="serif text-4xl sm:text-5xl text-var(--text-primary) font-medium tracking-tight">Organization Profile</h1>
          <p className="text-var(--text-secondary) font-light mt-2 max-w-md">Overview of your parent organization, performance metrics, and professional network.</p>
        </div>
        <button className="btn-premium w-full sm:w-auto justify-center">
          <ExternalLink size={18} /> Request Edit
        </button>
      </div>

      {error && (
        <div className="mt-8 mx-4 sm:mx-0 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {companyInfo ? (
        <div className="mt-10 space-y-8 px-4 sm:px-0">
          {/* Main Info */}
          <div className="glass-card overflow-hidden shadow-sm">
            <div className="relative p-8 sm:p-12 border-b border-var(--card-border)" style={{ background:'linear-gradient(135deg, var(--primary-glow) 0%,transparent 100%)' }}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-var(--primary-glow) border border-var(--primary) border-opacity-20 flex items-center justify-center text-var(--primary) shadow-2xl">
                  <Building2 size={48} strokeWidth={1.5} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="serif text-3xl sm:text-4xl text-var(--text-primary) font-medium tracking-tight mb-2">{companyInfo.name}</h2>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-var(--text-secondary) font-medium text-sm">
                    <span className="flex items-center gap-2"><Globe size={16} className="text-var(--primary)" /> Professional Services</span>
                    <span className="flex items-center gap-2"><MapPin size={16} className="text-var(--primary)" /> Enterprise Headquarters</span>
                  </div>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-var(--primary-glow) flex items-center justify-center text-var(--text-muted)"><FileText size={16} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-var(--text-muted) uppercase tracking-widest">Reg No.</p>
                        <p className="text-sm font-bold text-var(--text-primary) tracking-wide">{companyInfo.registrationNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-var(--primary-glow) flex items-center justify-center text-var(--text-muted)"><User size={16} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-var(--text-muted) uppercase tracking-widest">Contact</p>
                        <p className="text-sm font-bold text-var(--text-primary) tracking-wide">{companyInfo.contactPerson}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-var(--primary-glow) flex items-center justify-center text-var(--text-muted)"><Mail size={16} /></div>
                      <div>
                        <p className="text-[9px] font-bold text-var(--text-muted) uppercase tracking-widest">Inquiries</p>
                        <p className="text-sm font-bold text-var(--text-primary) tracking-wide">{companyInfo.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard icon={Star} label="Avg Rating" value={`${companyInfo.rating} / 5`} colorClass="text-amber-400" />
            <StatCard icon={TrendingUp} label="Success Rate" value={`${companyInfo.successRate}%`} colorClass="text-emerald-400" />
            <StatCard icon={Users} label="Active Program" value={companyInfo.activeCandidates || 0} colorClass="text-sky-400" />
          </div>

          {/* Testimonials */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="glass-card p-8 sm:p-10 shadow-sm">
              <h3 className="serif text-2xl text-var(--text-primary) mb-8 flex items-center gap-3">
                <Award size={24} className="text-var(--primary)" />
                Mentee Voices
              </h3>
              <div className="space-y-6">
                {companyInfo.testimonials && companyInfo.testimonials.length > 0 ? (
                  companyInfo.testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="p-6 rounded-2xl bg-var(--primary-glow) border border-var(--card-border) border-opacity-50 relative group transition-all hover:bg-var(--card-bg) shadow-sm">
                      <div className="absolute top-4 right-4 text-var(--primary) opacity-10 group-hover:opacity-30 transition-opacity">
                        <Star size={32} fill="currentColor" />
                      </div>
                      <p className="text-var(--text-secondary) italic font-light leading-relaxed">"{testimonial.text}"</p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-var(--primary-glow) border border-var(--primary) flex items-center justify-center text-var(--primary) font-black text-xs">
                          {testimonial.candidateName.charAt(0)}
                        </div>
                        <p className="text-xs font-bold text-var(--text-primary) tracking-wide">— {testimonial.candidateName}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center opacity-30 italic font-light text-slate-400">No testimonials captured yet.</div>
                )}
              </div>
            </div>

            {/* Coaches List */}
            <div className="glass-card p-8 sm:p-10 shadow-sm">
              <h3 className="serif text-2xl text-var(--text-primary) mb-8 flex items-center gap-3">
                <Users size={24} className="text-var(--primary)" />
                Expert Faculty
              </h3>
              <div className="space-y-4">
                {companyInfo.coaches && companyInfo.coaches.length > 0 ? (
                  companyInfo.coaches.map((coach) => (
                    <div key={coach.id} className="flex items-center justify-between p-4 bg-var(--primary-glow) border border-var(--card-border) rounded-2xl hover:bg-var(--card-bg) transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-var(--primary-glow) border border-var(--primary) flex items-center justify-center text-var(--primary) font-bold">
                          {coach.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-var(--text-primary) text-sm">{coach.name}</p>
                          <p className="text-[10px] text-var(--text-muted) font-medium uppercase mt-0.5">{coach.assignedCandidates} Active Mentees</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center opacity-30 italic text-slate-400">No coaches listed.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-12 glass-card p-12 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-rose-500/50" />
          <p className="text-slate-400 font-light">Unable to retrieve organization profile at this moment.</p>
        </div>
      )}
    </div>
  );
}
