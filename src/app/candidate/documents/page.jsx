'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';
import SafeDate from '@/components/ui/SafeDate';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

const FOLDER_CONFIG = [
  { key: 'coach-shared', label: '📁 Coach Shared', readOnly: true },
  { key: 'my-uploads', label: '📁 My Uploads', readOnly: false },
  { key: 'message-docs', label: '📁 Message Documents', readOnly: true },
  { key: 'signed-agreements', label: '📁 Signed Agreements', readOnly: true },
];

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

  const folderLabel = FOLDER_CONFIG.find((folder) => folder.key === activeFolder)?.label || 'Documents';
  const activeFolderIsReadOnly = FOLDER_CONFIG.find((folder) => folder.key === activeFolder)?.readOnly;

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
        setUploadOpen(false);
        setUploadFile(null);
        setUploadProgress(0);
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
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <p className="text-sm font-semibold text-gray-900">Folders</p>
        <div className="mt-3 space-y-2">
          {FOLDER_CONFIG.map((folder) => (
            <button
              key={folder.key}
              type="button"
              onClick={() => setActiveFolder(folder.key)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                activeFolder === folder.key
                  ? 'bg-blue-50 font-semibold text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {folder.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Breadcrumb</p>
              <p className="text-sm font-semibold text-gray-900">My Documents / {folderLabel.replace('📁 ', '')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded border px-3 py-2 text-xs ${viewMode === 'grid' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'}`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded border px-3 py-2 text-xs ${viewMode === 'list' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'}`}
              >
                List
              </button>
              <Button size="sm" onClick={() => setUploadOpen(true)}>Upload Document</Button>
            </div>
          </div>

          {loading ? (
            <div className="h-40 animate-pulse rounded-lg bg-gray-100" />
          ) : activeItems.length ? (
            <div className={viewMode === 'grid' ? 'grid gap-3 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
              {activeItems.map((doc) => (
                <div key={doc.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-sm font-semibold text-gray-900">{doc.fileName || doc.name || 'Document'}</p>
                  <p className="mt-1 text-xs text-gray-500">{doc.fileType || doc.type || 'Unknown type'}</p>
                  <p className="text-xs text-gray-500">
                    {doc.uploadedAt ? <SafeDate date={doc.uploadedAt} format="toLocaleDateString" /> : 'Unknown date'}
                  </p>
                  <p className="text-xs text-gray-500">{formatBytes(doc.fileSize || 0)}</p>

                  {activeFolder === 'message-docs' && (
                    <p className="mt-2 text-[11px] text-blue-700">Linked to conversation: Chat with Coach</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700">
                      Download
                    </button>
                    {!activeFolderIsReadOnly && (
                      <button
                        type="button"
                        onClick={() => deleteDocument(doc.id)}
                        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No files found in this folder.</p>
          )}
        </div>
      </Card>

      <Modal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Document"
        size="lg"
        actions={[
          { label: 'Cancel', variant: 'outline', onClick: () => setUploadOpen(false) },
          {
            label: uploading ? 'Uploading...' : 'Upload',
            variant: 'primary',
            onClick: uploadDocument,
          },
        ]}
      >
        <div className="space-y-4">
          <label className="block rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-600">
            Drag and drop file here or click to browse
            <input
              type="file"
              className="hidden"
              accept={ALLOWED_TYPES.join(',')}
              onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
            />
          </label>

          {uploadFile && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              Selected: {uploadFile.name} ({formatBytes(uploadFile.size)})
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Destination Folder</label>
            <select
              value={uploadDestination}
              onChange={(event) => setUploadDestination(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {FOLDER_CONFIG.map((folder) => (
                <option key={folder.key} value={folder.key}>{folder.label.replace('📁 ', '')}</option>
              ))}
            </select>
          </div>

          {uploading && <ProgressBar progress={uploadProgress} label="Uploading" />}
          <p className="text-xs text-gray-500">Allowed types: PDF, DOCX, JPG, PNG</p>
        </div>
      </Modal>
    </div>
  );
}
