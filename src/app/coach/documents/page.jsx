"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import apiService from '@/services/api';
import { 
  FolderOpen, 
  FileText, 
  Upload, 
  Search, 
  Trash2, 
  Download, 
  Eye, 
  ChevronDown, 
  ChevronRight,
  MoreVertical,
  Plus,
  Shield,
  MessageSquare,
  Users
} from 'lucide-react';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#06060f 0%,#090912 50%,#07070e 100%)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
        <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#0ea5e9" strokeWidth="0.5"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
  </div>
);

export default function DocumentsPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [folders, setFolders] = useState({
    sharedWithAll: [],
    candidateDocuments: [],
    messageDocuments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFolder, setExpandedFolder] = useState('sharedWithAll');
  const [uploadFolder, setUploadFolder] = useState('sharedWithAll');
  const [uploadingFile, setUploadingFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/login');
      return;
    }

    const fetchDocuments = async () => {
      try {
        const data = await apiService.coach.getDocuments();
        setFolders(data.folders || { sharedWithAll: [], candidateDocuments: [], messageDocuments: [] });
      } catch (err) {
        console.error('Documents error:', err);
        if (err.message === 'Unauthorized') {
          router.push('/login');
          return;
        }
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [isAuthenticated, hasRole, authToken, router]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(file.name);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', uploadFolder);

    try {
      const response = await fetch('/api/coach/documents', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      if (data.success) {
        setFolders(data.folders);
        setUploadingFile(null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file');
      setUploadingFile(null);
    }
  };

  const handleDelete = async (fileId, folder) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const response = await fetch('/api/coach/documents', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId, folder }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      const data = await response.json();
      if (data.success) {
        setFolders(data.folders);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete file');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(14,165,233,0.15)', borderTop:'1.5px solid #0ea5e9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const FolderIcon = (key) => {
    switch(key) {
      case 'sharedWithAll': return <Shield className="text-sky-400" size={20} />;
      case 'candidateDocuments': return <Users className="text-indigo-400" size={20} />;
      case 'messageDocuments': return <MessageSquare className="text-emerald-400" size={20} />;
      default: return <FolderOpen className="text-slate-400" size={20} />;
    }
  };

  const FolderTitle = (key) => {
    switch(key) {
      case 'sharedWithAll': return "Public Resources";
      case 'candidateDocuments': return "Candidate Portfolio";
      case 'messageDocuments': return "Conversation Assets";
      default: return key;
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto pb-16 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          border-radius: 28px;
        }
        .btn-premium {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center; gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(2,132,199,0.25);
        }
        .btn-premium:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(2,132,199,0.35);
        }
      `}</style>

      {/* Header */}
      <div className="pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4 sm:px-0">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-bold uppercase tracking-widest mb-4">
            <FolderOpen size={12} />
            Asset Library
          </div>
          <h1 className="serif text-4xl sm:text-5xl text-white font-medium tracking-tight">Documents Hub</h1>
          <p className="text-slate-400 font-light mt-2 max-w-md">Securely manage, share, and organize all mentorship artifacts and resources.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white text-xs font-bold uppercase tracking-widest focus:border-sky-500/50 transition-all appearance-none cursor-pointer sm:min-w-[200px]"
          >
            <option value="sharedWithAll" className="bg-[#0d0c1e]">📁 Public Resources</option>
            <option value="candidateDocuments" className="bg-[#0d0c1e]">📁 Candidate Portfolio</option>
            <option value="messageDocuments" className="bg-[#0d0c1e]">📁 Message Assets</option>
          </select>
          <label className="btn-premium flex-1 sm:flex-none justify-center cursor-pointer">
            {uploadingFile ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </span>
            ) : (
              <><Upload size={18} /> Upload File</>
            )}
            <input type="file" onChange={handleUpload} className="hidden" disabled={!!uploadingFile} />
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-8 mx-4 sm:mx-0 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="mt-8 space-y-6 px-4 sm:px-0">
        {Object.keys(folders).map((folderKey) => (
          <div key={folderKey} className="glass-card overflow-hidden">
            <button
              onClick={() => setExpandedFolder(expandedFolder === folderKey ? '' : folderKey)}
              className="w-full flex items-center justify-between p-6 sm:p-8 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4 sm:gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${expandedFolder === folderKey ? 'bg-sky-500/10 border-sky-500/20' : 'bg-white/5 border-white/10'}`}>
                  {FolderIcon(folderKey)}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white tracking-tight">{FolderTitle(folderKey)}</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">{folders[folderKey].length} Items</p>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 text-slate-500 transition-transform ${expandedFolder === folderKey ? 'rotate-180 bg-white/5' : ''}`}>
                <ChevronDown size={18} />
              </div>
            </button>

            <div className={`transition-all duration-300 ease-in-out ${expandedFolder === folderKey ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="p-6 sm:p-8 pt-0 border-t border-white/5 space-y-3">
                {folders[folderKey].length > 0 ? (
                  folders[folderKey].map((file) => (
                    <div key={file.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all group gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-sky-400 transition-colors">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">{file.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            {file.size || 'Unknown size'} • {file.candidateName || file.conversationName || 'Shared'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all" title="Preview">
                          <Eye size={16} />
                        </button>
                        <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Download">
                          <Download size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(file.id, folderKey); }}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center opacity-30">
                    <FolderOpen size={40} className="mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-500 text-sm font-light">This vault is currently empty.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
