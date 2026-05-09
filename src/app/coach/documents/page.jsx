'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';

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

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/coach/login');
      return;
    }

    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/coach/documents', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/coach/login');
            return;
          }
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setFolders(data.folders || { sharedWithAll: [], candidateDocuments: [], messageDocuments: [] });
        } else {
          setError(data.error || 'Failed to load documents');
        }
      } catch (err) {
        console.error('Documents error:', err);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Documents Hub</h1>
          <div className="flex gap-3">
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="sharedWithAll">📁 Shared with All</option>
              <option value="candidateDocuments">📁 Candidate Documents</option>
              <option value="messageDocuments">📁 Message Documents</option>
            </select>
            <label className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition cursor-pointer">
              {uploadingFile ? `Uploading: ${uploadingFile}` : '📤 Upload'}
              <input
                type="file"
                onChange={handleUpload}
                className="hidden"
                disabled={!!uploadingFile}
              />
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Folders */}
        <div className="space-y-4">
          {/* Shared with All Candidates */}
          <div className="bg-white rounded-lg shadow">
            <button
              onClick={() =>
                setExpandedFolder(expandedFolder === 'sharedWithAll' ? '' : 'sharedWithAll')
              }
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📁</span>
                <h3 className="text-lg font-bold text-gray-900">Shared with All Candidates</h3>
              </div>
              <span className="text-gray-600">
                {expandedFolder === 'sharedWithAll' ? '▼' : '▶'}
              </span>
            </button>

            {expandedFolder === 'sharedWithAll' && (
              <div className="border-t p-6 space-y-3">
                {folders.sharedWithAll.length > 0 ? (
                  folders.sharedWithAll.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Preview
                        </button>
                        <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(file.id, 'sharedWithAll')}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No documents</p>
                )}
              </div>
            )}
          </div>

          {/* Candidate Documents */}
          <div className="bg-white rounded-lg shadow">
            <button
              onClick={() =>
                setExpandedFolder(expandedFolder === 'candidateDocuments' ? '' : 'candidateDocuments')
              }
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📁</span>
                <h3 className="text-lg font-bold text-gray-900">Candidate Documents</h3>
              </div>
              <span className="text-gray-600">
                {expandedFolder === 'candidateDocuments' ? '▼' : '▶'}
              </span>
            </button>

            {expandedFolder === 'candidateDocuments' && (
              <div className="border-t p-6 space-y-3">
                {folders.candidateDocuments.length > 0 ? (
                  folders.candidateDocuments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.candidateName}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Preview
                        </button>
                        <button
                          onClick={() => handleDelete(file.id, 'candidateDocuments')}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No documents</p>
                )}
              </div>
            )}
          </div>

          {/* Message Documents */}
          <div className="bg-white rounded-lg shadow">
            <button
              onClick={() =>
                setExpandedFolder(expandedFolder === 'messageDocuments' ? '' : 'messageDocuments')
              }
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📁</span>
                <h3 className="text-lg font-bold text-gray-900">Message Documents</h3>
              </div>
              <span className="text-gray-600">
                {expandedFolder === 'messageDocuments' ? '▼' : '▶'}
              </span>
            </button>

            {expandedFolder === 'messageDocuments' && (
              <div className="border-t p-6 space-y-3">
                {folders.messageDocuments.length > 0 ? (
                  folders.messageDocuments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">From: {file.conversationName}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Download
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No documents</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
