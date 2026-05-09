'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

import SafeDate from '@/components/ui/SafeDate';

const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

function formatTime(value) {
  if (!value) return 'Now';
  return new Date(value).toLocaleString();
}

export default function CandidateMessagesPage() {
  const fileRef = useRef(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [coachMessages, setCoachMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState('coach');
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

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

    let mounted = true;
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/candidate/messages?email=${encodeURIComponent(email)}`);
        const payload = await response.json();
        if (!mounted || !payload?.success) return;
        setAnnouncements(payload.data?.announcements || []);
        setCoachMessages(payload.data?.coachMessages || []);
      } catch {
        // Keep existing UI on temporary errors.
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMessages();

    const polling = setInterval(loadMessages, 5000);
    return () => {
      mounted = false;
      clearInterval(polling);
    };
  }, [email]);

  const unreadCount = useMemo(
    () => coachMessages.filter((message) => !message.seen && message.sender !== 'candidate').length,
    [coachMessages]
  );

  useEffect(() => {
    if (!draft) {
      setTyping(false);
      return;
    }

    setTyping(true);
    const timeout = setTimeout(() => setTyping(false), 900);
    return () => clearTimeout(timeout);
  }, [draft]);

  const conversations = useMemo(() => {
    const list = [
      {
        id: 'announcements',
        label: 'Announcements',
        subtitle: announcements[0]?.text || 'Pinned posts from coach',
        unread: 0,
        pinned: true,
      },
      {
        id: 'coach',
        label: 'Chat with Coach',
        subtitle: coachMessages.at(-1)?.text || 'Direct conversation thread',
        unread: unreadCount,
      },
    ];

    return list.filter((item) => {
      const searchText = `${item.label} ${item.subtitle}`.toLowerCase();
      return searchText.includes(search.toLowerCase());
    });
  }, [announcements, coachMessages, unreadCount, search]);

  const selectedMessages = selectedConversation === 'announcements' ? announcements : coachMessages;

  const sendMessage = async () => {
    const file = fileRef.current?.files?.[0] || null;
    if (!draft.trim() && !file) return;
    if (selectedConversation === 'announcements') return;

    if (file && !allowedTypes.includes(file.type)) {
      alert('Only PDF, DOCX, JPG, PNG are allowed.');
      return;
    }

    const attachments = file
      ? [{ id: `att-${Date.now()}`, name: file.name, type: file.type, size: file.size }]
      : [];

    const response = await fetch('/api/candidate/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        conversation: 'coach',
        text: draft.trim() || `Attachment: ${file.name}`,
        attachments,
      }),
    });

    const payload = await response.json();
    if (payload?.success) {
      setDraft('');
      if (fileRef.current) fileRef.current.value = '';
      const refresh = await fetch(`/api/candidate/messages?email=${encodeURIComponent(email)}`);
      const refreshedPayload = await refresh.json();
      if (refreshedPayload?.success) {
        setCoachMessages(refreshedPayload.data?.coachMessages || []);
      }
    }
  };

  if (loading) {
    return <div className="h-[60vh] animate-pulse rounded-lg border border-gray-200 bg-white" />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <div className="space-y-4">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Conversations</p>
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left ${
                    selectedConversation === conversation.id
                      ? 'border-blue-300 bg-blue-50'
                      : conversation.pinned
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {conversation.pinned ? '📢 ' : ''}
                        {conversation.label}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">{conversation.subtitle}</p>
                    </div>
                    {conversation.unread > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex h-[70vh] flex-col">
          <div className="border-b border-gray-200 pb-3">
            <p className="text-lg font-semibold text-gray-900">
              {selectedConversation === 'announcements' ? 'Announcements' : 'Chat with Coach'}
            </p>
            <p className="text-xs text-gray-500">
              {selectedConversation === 'announcements'
                ? 'Broadcast messages from coach'
                : 'Direct conversation thread'}
            </p>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {selectedMessages.length ? (
              selectedMessages.map((message, idx) => {
                const mine = message.sender === 'candidate';
                return (
                  <div key={`${message.createdAt || idx}-${idx}`} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${mine ? 'ml-auto bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p className="text-[11px] font-semibold opacity-80">{mine ? 'You' : 'Coach'}</p>
                    <p className="mt-1 break-words">{message.text}</p>
                    {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((file) => (
                          <button
                            key={file.id || file.name}
                            type="button"
                            onClick={() => setAttachmentPreview(file)}
                            className={`flex w-full items-center justify-between rounded border px-2 py-1 text-xs ${mine ? 'border-blue-300 bg-blue-500 text-white' : 'border-gray-300 bg-white text-gray-700'}`}
                          >
                            <span className="truncate">📎 {file.name}</span>
                            <span>⬇</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="mt-1 text-[10px] opacity-70">
                      {message.createdAt ? <SafeDate date={message.createdAt} /> : 'Now'}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-600">No messages yet.</p>
            )}
          </div>

          {selectedConversation === 'coach' && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              {typing && <p className="mb-2 text-xs text-gray-500">Coach is typing...</p>}
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button type="button" className="rounded-lg border border-gray-300 px-2 py-2 text-sm" title="Emoji">
                  🙂
                </button>
                <label className="cursor-pointer rounded-lg border border-gray-300 px-2 py-2 text-sm" title="Attach File">
                  📎
                  <input ref={fileRef} type="file" className="hidden" accept={allowedTypes.join(',')} />
                </label>
                <Button size="sm" onClick={sendMessage}>Send</Button>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">Supports PDF, DOCX, JPG, PNG up to 10MB.</p>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={Boolean(attachmentPreview)}
        onClose={() => setAttachmentPreview(null)}
        title="Attachment"
        actions={[{ label: 'Close', variant: 'outline', onClick: () => setAttachmentPreview(null) }]}
      >
        {attachmentPreview && (
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold">File:</span> {attachmentPreview.name}</p>
            <p><span className="font-semibold">Type:</span> {attachmentPreview.type || 'Unknown'}</p>
            <p><span className="font-semibold">Size:</span> {attachmentPreview.size || 0} bytes</p>
            <p className="text-xs text-gray-500">Preview/download integration can be connected to object storage URLs.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
