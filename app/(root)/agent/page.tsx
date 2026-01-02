'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { io, type Socket } from 'socket.io-client';
import { useAgentAuthenticationStore } from '@/store/agent-authentication.store';

// Server configuration (use env with safe fallbacks)
const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4123';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN;
// Validation
const formSchema = z.object({
  toUserId: z.string().min(1, 'Recipient is required'),
  message: z.string().trim().min(2, 'Message is too short').max(300, 'Message is too long'),
});

// Types
type FormData = z.infer<typeof formSchema>;

type Message = {
  _id: string;
  content: string;
  senderId: string;
  senderType: 'visitor' | 'agent' | 'system';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  __v: number;
};

export default function AgentPage() {
  // agent token
  const { token } = useAgentAuthenticationStore();

  // Chat message state (store full Message for richer UI)
  const [messages, setMessages] = useState<Message[]>([]);

  // Socket instance (single connection)
  const socketRef = useRef<Socket | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) });

  // Utility logger
  function logEvent(source: string, event: string, data: unknown) {
    console.log({ source, event, data });
  }

  // Initialize socket and listeners once
  useEffect(() => {
    const socket = io(SERVER_URL, { auth: { token: token }, autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      logEvent('socket', 'connect', { id: socket.id });
    });
    socket.on('connect_error', (err) => {
      logEvent('socket', 'connect_error', { message: err.message });
    });
    socket.on('disconnect', (reason) => {
      logEvent('socket', 'disconnect', { reason });
    });

    socket.on('chat.dm.received', (payload: unknown) => {
      logEvent('socket', 'chat.dm.received', payload);
      const msg = normalizePayload(payload);
      if (msg) setMessages((prev) => [...prev, msg]);
    });

    socket.on('chat.test', (payload: unknown) => {
      logEvent('socket', 'chat.test', payload);
      const msg = normalizePayload(payload);
      if (msg) setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('chat.dm.received');
      socket.off('chat.test');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Convert server payload to Message shape
  function normalizePayload(payload: unknown): Message | null {
    if (typeof payload === 'string') {
      return {
        _id: crypto.randomUUID(),
        content: payload,
        senderId: 'system',
        senderType: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0,
      };
    }
    const p = payload as Partial<Message>;
    if (p && typeof p.content === 'string') {
      return {
        _id: p._id ?? crypto.randomUUID(),
        content: p.content,
        senderId: p.senderId ?? 'unknown',
        senderType: p.senderType ?? 'system',
        createdAt: p.createdAt ?? new Date().toISOString(),
        updatedAt: p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
        __v: p.__v ?? 0,
      };
    }
    return null;
  }

  // Submit handler
  const handleSend = (data: FormData) => {
    logEvent('form', 'submit', data);
    socketRef.current?.emit('chat.dm.send', { toUserId: data.toUserId, message: data.message });
    reset({ message: '' });
    // Optimistic UI (optional): add agent message locally
    const optimistic: Message = {
      _id: crypto.randomUUID(),
      content: data.message,
      senderId: 'agent:self',
      senderType: 'agent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0,
    };
    setMessages((prev) => [...prev, optimistic]);
  };

  return (
    <section className="min-h-screen bg-white text-black p-4">
      <div className="mx-auto max-w-3xl">
        <header className="mb-4">
          <h1 className="text-3xl font-bold">Agent Chat</h1>
          <p className="text-sm text-black/60">Server: {SERVER_URL}</p>
        </header>

        {/* Chat container */}
        <div className="border border-black/10 rounded-lg bg-white/70 h-[60vh] overflow-y-auto p-4 flex flex-col gap-2">
          {messages.length === 0 ? (
            <p className="text-black/70">No messages yet.</p>
          ) : (
            messages.map((m) => <ChatBubble key={m._id} message={m} />)
          )}
        </div>

        {/* Composer */}
        <form onSubmit={handleSubmit(handleSend)} className="mt-4 space-y-2">
          <div>
            <input
              type="text"
              placeholder="Recipient User ID"
              autoComplete="off"
              className="w-full p-2 border border-black/20 rounded"
              {...register('toUserId')}
            />
            {errors.toUserId && (
              <p className="text-red-600 text-sm mt-1">{errors.toUserId.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              autoComplete="off"
              className="flex-1 p-2 border border-black/20 rounded"
              {...register('message')}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 rounded bg-black text-white disabled:opacity-50"
            >
              Send
            </button>
          </div>
          {errors.message && <p className="text-red-600 text-sm">{errors.message.message}</p>}
        </form>
      </div>
    </section>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isAgent = message.senderType === 'agent';
  const isSystem = message.senderType === 'system';
  const align = isSystem ? 'items-center' : isAgent ? 'items-end' : 'items-start';
  const bubbleClasses = isSystem
    ? 'bg-black text-white'
    : isAgent
    ? 'bg-black text-white'
    : 'bg-white text-black border border-black/20';

  return (
    <div className={`flex ${align}`}>
      <div className={`max-w-[80%] rounded px-3 py-2 ${bubbleClasses}`}>
        <p className="wrap-break-word">{message.content}</p>
        <p className="text-xs opacity-70 mt-1">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
