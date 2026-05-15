'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Folder, FileText, Image as ImageIcon, File, UploadCloud, 
  Download, Trash2, LayoutGrid, List, X, Search, ChevronRight, FileArchive, CheckCircle2
} from 'lucide-react';
import SafeDate from '@/components/ui/SafeDate';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

const FOLDER_CONFIG = [
  { key: 'coach-shared', label: 'Coach Shared', icon: Folder, color: 'text-indigo-400', readOnly: true },
  { key: 'my-uploads', label: 'My Uploads', icon: Folder, color: 'text-cyan-400', readOnly: false },
  { key: 'message-docs', label: 'Message Attachments', icon: Folder, color: 'text-emerald-400', readOnly: true },
  { key: 'signed-agreements', label: 'Agreements', icon: Folder, color: 'text-amber-400', readOnly: true },
];

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type) {
  if (type?.includes('pdf')) return <FileText className="text-rose-400" size={24} />;
  if (type?.includes('image')) return <ImageIcon className="text-indigo-400" size={24} />;
  if (type?.includes('word')) return <FileText className="text-blue-400" size={24} />;
  return <File className="text-slate-400" size={24} />;
}

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

export default function CandidateDocumentsPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [activeFolder, setActiveFolder] = useState('my-uploads');
  const [viewMode, setViewMode] = useState('grid');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDestination, setUploadDestination] = useState('my-uploads');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setEmail(parsed?.email || '');
    } catch {
      setEmail('');
    }
  }, []);

  useEffect(() => {
    if (!email) return;

    const loadDocuments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/candidate/documents?email=${encodeURIComponent(email)}`);
        const payload = await response.json();
        if (payload?.success) {
          setDocuments(payload.data || []);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [email]);

  const activeItems = useMemo(() => {
    return documents.filter((doc) => doc.folder === activeFolder);
  }, [documents, activeFolder]);

  const activeFolderConfig = FOLDER_CONFIG.find((folder) => folder.key === activeFolder);
  const activeFolderIsReadOnly = activeFolderConfig?.readOnly;

  const uploadDocument = async () => {
    if (!uploadFile || !email) return;
    if (!ALLOWED_TYPES.includes(uploadFile.type)) {
      alert('Invalid file type. Allowed: PDF, DOCX, JPG, PNG');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(30);

      const fileData = await uploadFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(fileData).reduce((acc, byte) => acc + String.fromCharCode(byte), '')
      );

      setUploadProgress(70);

      const response = await fetch('/api/candidate/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          folder: uploadDestination,
          fileName: uploadFile.name,
          fileType: uploadFile.type,
          fileSize: uploadFile.size,
          fileData: base64,
        }),
      });

      const payload = await response.json();
      setUploadProgress(100);

      if (payload?.success) {
        setDocuments((prev) => [
          {
            id: `temp-${Date.now()}`,
            folder: uploadDestination,
            fileName: uploadFile.name,
            fileType: uploadFile.type,
            fileSize: uploadFile.size,
            uploadedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setTimeout(() => {
          setUploadOpen(false);
          setUploadFile(null);
          setUploadProgress(0);
        }, 500);
      }
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id) => {
    const response = await fetch(`/api/candidate/documents?email=${encodeURIComponent(email)}&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const payload = await response.json();
    if (payload?.success) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
      <BackgroundGrid />
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-panel {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          backdrop-filter: blur(24px);
          border-radius: 24px;
        }
        .btn-primary {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 20px; border-radius: 12px;
          font-size: 13px; font-weight: 600; cursor: pointer; border: none;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: #fff; box-shadow: 0 4px 16px rgba(99,102,241,0.25);
          transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.35); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease; padding: 20px;
        }
        .modal-content {
          background: var(--background); border: 1px solid var(--card-border);
          box-shadow: 0 24px 50px rgba(0,0,0,0.4);
          border-radius: 24px; width: 100%; max-width: 520px;
          animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

      {/* Header Area */}
      <div className="glass-panel p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-black/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-var(--primary-glow) border border-var(--primary) border-opacity-20 text-[10px] font-bold text-var(--primary) uppercase tracking-widest mb-4">
            <FileArchive size={12} />
            Document Center
          </div>
          <h1 className="serif text-3xl md:text-4xl text-var(--text-primary) leading-tight mb-2">My Files</h1>
          <p className="text-var(--text-muted) font-light text-sm">Securely upload, view, and manage your program documents.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-var(--input-bg) border border-var(--card-border) p-1 rounded-xl flex">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-var(--primary) text-white shadow-md' : 'text-var(--text-muted) hover:text-var(--text-primary)'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-var(--primary) text-white shadow-md' : 'text-var(--text-muted) hover:text-var(--text-primary)'}`}
            >
              <List size={16} />
            </button>
          </div>
          <button className="btn-primary" onClick={() => setUploadOpen(true)}>
            <UploadCloud size={16} /> Upload File
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="glass-panel p-6 h-fit shadow-lg shadow-black/10">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Folders</h3>
          <div className="space-y-1.5">
            {FOLDER_CONFIG.map((folder) => {
              const isActive = activeFolder === folder.key;
              const Icon = folder.icon;
              return (
                <button
                  key={folder.key}
                  onClick={() => setActiveFolder(folder.key)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-var(--primary-glow) border border-var(--primary) border-opacity-30 shadow-inner' 
                      : 'bg-transparent border border-transparent hover:bg-var(--input-bg)'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-var(--primary)' : 'text-var(--text-muted)'} />
                    <span className={`text-[13px] font-bold ${isActive ? 'text-var(--text-primary)' : 'text-var(--text-muted)'}`}>
                      {folder.label}
                    </span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-var(--primary)" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="glass-panel p-8 shadow-xl shadow-black/10 min-h-[500px] flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-slate-500 text-sm font-medium">My Documents</span>
            <ChevronRight size={14} className="text-slate-600" />
            <span className="text-indigo-300 font-bold text-sm">{activeFolderConfig?.label}</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div style={{ width:40, height:40, border:'1.5px solid var(--primary-glow)', borderTop:'1.5px solid var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            </div>
          ) : activeItems.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
              {activeItems.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`group bg-var(--input-bg) border border-var(--card-border) rounded-2xl hover:bg-var(--card-bg) hover:border-var(--primary) border-opacity-30 transition-all ${
                    viewMode === 'list' ? 'flex items-center justify-between p-4' : 'p-5 flex flex-col h-full'
                  }`}
                >
                  <div className={`flex items-start gap-4 ${viewMode === 'grid' ? 'mb-6' : ''}`}>
                    <div className="w-12 h-12 rounded-xl bg-var(--card-bg) border border-var(--card-border) flex items-center justify-center shrink-0">
                      {getFileIcon(doc.fileType || doc.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-var(--text-primary) truncate mb-1" title={doc.fileName || doc.name}>
                        {doc.fileName || doc.name || 'Document'}
                      </p>
                      <p className="text-[10px] text-var(--text-muted) uppercase tracking-widest font-bold">
                        {formatBytes(doc.fileSize || 0)}
                      </p>
                    </div>
                  </div>

                  <div className={`${viewMode === 'grid' ? 'mt-auto' : 'flex items-center gap-6'}`}>
                    <div className={`${viewMode === 'grid' ? 'mb-4 border-t border-white/5 pt-4' : ''}`}>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                        Uploaded {doc.uploadedAt ? <SafeDate date={doc.uploadedAt} format="toLocaleDateString" /> : 'Unknown date'}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 px-3 bg-var(--card-bg) border border-var(--card-border) hover:bg-var(--primary-glow) text-var(--text-primary) text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2">
                        <Download size={14} /> {viewMode === 'grid' ? 'Download' : ''}
                      </button>
                      {!activeFolderIsReadOnly && (
                        <button 
                          onClick={() => deleteDocument(doc.id)}
                          className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 space-y-4">
              <Folder size={64} className="text-slate-600" strokeWidth={1} />
              <p className="text-slate-400 text-sm font-light">This folder is empty.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between p-6 border-b border-var(--card-border) bg-white/[0.01]">
              <div>
                <h3 className="text-lg font-bold text-var(--text-primary) flex items-center gap-2">
                  <UploadCloud size={18} className="text-var(--primary)" />
                  Upload Document
                </h3>
                <p className="text-xs text-var(--text-muted) mt-1">Add a new file to your workspace.</p>
              </div>
              <button 
                onClick={() => !uploading && setUploadOpen(false)}
                className="w-8 h-8 rounded-full bg-var(--card-bg) flex items-center justify-center text-var(--text-muted) hover:bg-var(--primary-glow) hover:text-var(--text-primary) transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <label className="block w-full border-2 border-dashed border-var(--primary) border-opacity-30 hover:border-opacity-50 hover:bg-var(--primary-glow) transition-colors rounded-[1.5rem] p-10 text-center cursor-pointer group">
                <div className="w-16 h-16 rounded-full bg-var(--primary-glow) flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={28} className="text-var(--primary)" />
                </div>
                <p className="text-sm font-bold text-var(--text-primary) mb-1">Click to browse or drag and drop</p>
                <p className="text-xs text-var(--text-muted)">PDF, DOCX, JPG, or PNG (Max 5MB)</p>
                <input
                  type="file"
                  className="hidden"
                  accept={ALLOWED_TYPES.join(',')}
                  onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                />
              </label>

              {uploadFile && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-var(--input-bg) border border-var(--card-border)">
                  <div className="w-10 h-10 rounded-lg bg-var(--primary-glow) flex items-center justify-center shrink-0">
                    {getFileIcon(uploadFile.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-var(--text-primary) truncate">{uploadFile.name}</p>
                    <p className="text-[10px] text-var(--text-muted) uppercase tracking-widest">{formatBytes(uploadFile.size)}</p>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest pl-1">Destination Folder</label>
                <select
                  value={uploadDestination}
                  onChange={(event) => setUploadDestination(event.target.value)}
                  className="w-full bg-var(--input-bg) border border-var(--card-border) rounded-xl px-4 py-3 text-var(--text-primary) text-sm outline-none focus:border-var(--primary)"
                >
                  {FOLDER_CONFIG.filter(f => !f.readOnly).map((folder) => (
                    <option key={folder.key} value={folder.key} className="bg-var(--background)">{folder.label}</option>
                  ))}
                </select>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-var(--primary)">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-var(--card-border) rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-var(--primary) transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-var(--card-border) bg-white/[0.01] flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setUploadOpen(false)} 
                disabled={uploading}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-var(--text-muted) hover:text-var(--text-primary) transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={uploadDocument}
                disabled={!uploadFile || uploading}
                className="btn-primary"
              >
                {uploading ? 'Uploading...' : 'Confirm Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
