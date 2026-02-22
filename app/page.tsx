'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { io, type Socket } from 'socket.io-client';

// Configuration
const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN;

// Validation
const formSchema = z.object({
  toUserId: z.string().min(1, 'Recipient ID required'),
  message: z.string().trim().min(1, 'Message cannot be empty').max(500, 'Message too long'),
});

type FormData = z.infer<typeof formSchema>;

// Enhanced message type
interface ChatMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: number;
  type: 'sent' | 'received' | 'system';
  status: 'pending' | 'delivered' | 'failed';
}

export default function ChatDashboard() {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  const toUserId = watch('toUserId');

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Utility: Add message to state
  const addMessage = useCallback(
    (
      sender: string,
      recipient: string,
      content: string,
      type: 'sent' | 'received' | 'system' = 'received',
      status: 'pending' | 'delivered' | 'failed' = 'delivered',
    ) => {
      const newMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        sender,
        recipient,
        content,
        timestamp: Date.now(),
        type,
        status,
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    [],
  );

  // Initialize socket
  useEffect(() => {
    if (socketRef.current?.connected) return;

    const socket = io(SERVER_URL, {
      auth: { token: AUTH_TOKEN },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection established
    socket.on('connect', () => {
      setConnectionStatus('connected');
      setConnectionError(null);
      setCurrentUserId(socket.id ?? null);
      addMessage('system', 'system', 'Connected to server', 'system');
    });

    // Connection error
    socket.on('connect_error', (err: any) => {
      setConnectionStatus('error');
      setConnectionError(err.message || 'Connection failed');
      addMessage('system', 'system', `Error: ${err.message}`, 'system');
    });

    // Disconnected
    socket.on('disconnect', (reason: string) => {
      setConnectionStatus('disconnected');
      addMessage('system', 'system', `Disconnected: ${reason}`, 'system');
    });

    // Receive direct message
    socket.on('chat.dm.received', (payload: unknown) => {
      const message = typeof payload === 'string' ? payload : (payload as any)?.message;
      const sender = (payload as any)?.fromUserId || 'Unknown';
      const recipient = (payload as any)?.toUserId || 'You';

      if (typeof message === 'string') {
        addMessage(sender, recipient, message, 'received');
      }
    });

    // Test messages (for debugging)
    socket.on('chat.test', (payload: unknown) => {
      const content = typeof payload === 'string' ? payload : (payload as any)?.content;

      if (typeof content === 'string') {
        addMessage('Server', 'You', content, 'received');
      }
    });

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('chat.dm.received');
      socket.off('chat.test');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addMessage]);

  // Submit handler
  const handleSend = useCallback(
    (data: FormData) => {
      if (!socketRef.current?.connected) {
        setConnectionError('Not connected to server');
        return;
      }

      // Optimistic update
      addMessage(currentUserId || 'You', data.toUserId, data.message, 'sent', 'pending');

      // Emit event
      socketRef.current.emit('chat.dm.send', {
        toUserId: data.toUserId,
        message: data.message,
      });

      // Clear form
      reset({ message: '' });
    },
    [currentUserId, addMessage, reset],
  );

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format date header
  const getDateGroup = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups, msg, idx) => {
      const dateKey = getDateGroup(msg.timestamp);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
      return groups;
    },
    {} as Record<string, ChatMessage[]>,
  );

  return (
    <div className="flex flex-col h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-gray-300 px-6 py-4 bg-white">
        <h1 className="text-2xl font-light tracking-tight">Chat Dashboard</h1>
        <div className="flex items-center gap-3 mt-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-black'
                : connectionStatus === 'error'
                  ? 'bg-red-600'
                  : 'bg-gray-400'
            }`}
          />
          <p className="text-xs text-gray-600 font-mono">
            {connectionStatus === 'connected'
              ? `Connected • ${currentUserId?.slice(0, 8)}...`
              : connectionStatus.toUpperCase()}
          </p>
        </div>
      </header>

      {/* Messages Container */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-sm">No messages yet</p>
              <p className="text-gray-400 text-xs mt-1">Start a conversation below</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
            <div key={dateKey}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-500 font-mono">{dateKey}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {dateMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 animate-fadeIn ${
                      msg.type === 'sent' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Message bubble */}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-lg border ${
                        msg.type === 'system'
                          ? 'bg-gray-50 border-gray-200 text-gray-600'
                          : msg.type === 'sent'
                            ? 'bg-black text-white border-black'
                            : 'bg-gray-100 border-gray-300'
                      }`}
                    >
                      {msg.type !== 'system' && (
                        <p className="text-xs font-mono opacity-60 mb-1">
                          {msg.type === 'sent' ? `→ ${msg.recipient}` : `← ${msg.sender}`}
                        </p>
                      )}
                      <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                      <p
                        className={`text-xs mt-1.5 font-mono ${
                          msg.type === 'sent' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                        {msg.type === 'sent' && msg.status === 'pending' && ' ◦'}
                        {msg.type === 'sent' && msg.status === 'failed' && ' ✗'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Error banner */}
      {connectionError && connectionStatus === 'error' && (
        <div className="bg-red-50 border-t border-red-200 px-6 py-3">
          <p className="text-sm text-red-700">{connectionError}</p>
        </div>
      )}

      {/* Input Area */}
      <footer className="border-t border-gray-300 px-6 py-4 bg-white">
        <form onSubmit={handleSubmit(handleSend)} className="space-y-3">
          {/* Recipient field */}
          <div>
            <input
              type="text"
              placeholder="Recipient User ID"
              autoComplete="off"
              maxLength={50}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition ${
                errors.toUserId ? 'border-red-300' : 'border-gray-300'
              }`}
              {...register('toUserId')}
              disabled={connectionStatus !== 'connected' || isSubmitting}
            />
            {errors.toUserId && (
              <p className="text-xs text-red-600 mt-1">{errors.toUserId.message}</p>
            )}
          </div>

          {/* Message field */}
          <div>
            <textarea
              placeholder="Type your message..."
              autoComplete="off"
              maxLength={500}
              rows={2}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition resize-none ${
                errors.message ? 'border-red-300' : 'border-gray-300'
              }`}
              {...register('message')}
              disabled={connectionStatus !== 'connected' || isSubmitting}
            />
            <div className="flex justify-between items-start mt-1">
              {errors.message ? (
                <p className="text-xs text-red-600">{errors.message.message}</p>
              ) : (
                <p className="text-xs text-gray-400"></p>
              )}
              <p className="text-xs text-gray-400">{watch('message')?.length || 0}/500</p>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              connectionStatus !== 'connected' ||
              !toUserId ||
              !watch('message')?.trim()
            }
            className="w-full px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </form>
      </footer>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
