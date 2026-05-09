'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/coach/login');
      return;
    }

    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/coach/messages', {
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
          setConversations(data.conversations || []);
          if (data.conversations && data.conversations.length > 0) {
            setSelectedConversation(data.conversations[0].id);
          }
        } else {
          setError(data.error || 'Failed to load messages');
        }
      } catch (err) {
        console.error('Messages error:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [isAuthenticated, hasRole, authToken, router]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedConversation) return;

    try {
      const response = await fetch('/api/coach/messages', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation,
          message: messageInput,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data.success) {
        setMessages([...messages, data.message]);
        setMessageInput('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/coach/broadcast', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(broadcastData),
      });

      if (!response.ok) {
        throw new Error('Failed to send broadcast');
      }

      const data = await response.json();
      if (data.success) {
        setShowBroadcastModal(false);
        setBroadcastData({ subject: '', message: '' });
      }
    } catch (err) {
      console.error('Error broadcasting:', err);
      setError('Failed to send broadcast');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading messages...</p>
        </div>
      </div>
    );
  }

  const currentConversation = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen bg-gray-100">
        {/* Left Panel - Conversations */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition text-sm"
            >
              📢 Broadcast to All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                    selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{conversation.candidateName}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{conversation.lastMessage}</p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No conversations yet</div>
            )}
          </div>
        </div>

        {/* Right Panel - Messages */}
        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              <div className="bg-white border-b border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900">{currentConversation.candidateName}</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'coach' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-lg max-w-xs ${
                        message.sender === 'coach'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="text-xs mt-1 opacity-70">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <button
                    type="button"
                    className="text-2xl hover:opacity-70 transition"
                    title="Attach file"
                  >
                    📎
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Broadcast to All Candidates</h2>
            </div>

            <form onSubmit={handleBroadcast} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={broadcastData.subject}
                  onChange={(e) => setBroadcastData({ ...broadcastData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Important Update"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                  rows="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Type your message..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Send to All
                </button>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
