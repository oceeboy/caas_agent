"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { io, type Socket } from "socket.io-client";

// Server configuration (use env with safe fallbacks)
const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN 
// Validation
const formSchema = z.object({
  toUserId: z.string().min(1, "Recipient is required"),
  message: z.string().trim().min(2, "Message is too short").max(100, "Message is too long"),
});

// Types
type FormData = z.infer<typeof formSchema>;

export default function Home() {
  // Chat message state
  const [messages, setMessages] = useState<string[]>([]);

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
    const socket = io(SERVER_URL, {
      auth: { token: AUTH_TOKEN },
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      logEvent("socket", "connect", { id: socket.id });
    });

    socket.on("connect_error", (err) => {
      logEvent("socket", "connect_error", { message: err.message });
    });

    socket.on("disconnect", (reason) => {
      logEvent("socket", "disconnect", { reason });
    });

    socket.on("chat.dm.received", (payload: unknown) => {
      logEvent("socket", "chat.dm.received", payload);
      const text = typeof payload === "string" ? payload : (payload as any)?.message;
      if (typeof text === "string") setMessages((prev) => [...prev, text]);
    });

    socket.on("chat.test", (payload: unknown) => {
      logEvent("socket", "chat.test", payload);
      const text = typeof payload === "string" ? payload : (payload as any)?.content;
      if (typeof text === "string") setMessages((prev) => [...prev, text]);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("chat.dm.received");
      socket.off("chat.test");
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Submit handler
  const handleSend = (data: FormData) => {
    logEvent("form", "submit", data);
    socketRef.current?.emit("chat.dm.send", {
      toUserId: data.toUserId,
      message: data.message,
    });
    reset({ message: "" });
  };

  return (
    <section className="bg-amber-100 h-screen mx-auto p-4">
      <h1 className="text-4xl font-bold text-black">Agent Chat Dashboard</h1>
      <p className="text-sm text-black/60">Server: {SERVER_URL}</p>

      {/* Visitor messages UI */}
      <div className="mt-4 p-3 border border-gray-300 rounded bg-white/60">
        <h2 className="text-2xl font-bold text-black mb-2">Visitor Messages</h2>
        {messages.length === 0 ? (
          <p className="text-black/70">No messages yet.</p>
        ) : (
          <ul className="space-y-1 list-disc list-inside">
            {messages.map((text, idx) => (
              <li key={idx} className="text-black wrap-break-word">{text}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit(handleSend)} className="mt-4">
        {/* recipient field */}
        <div>
          <input
            type="text"
            placeholder="Recipient User ID"
            autoComplete="off"
            className="w-full p-2 border border-gray-300 text-black rounded mb-2"
            {...register("toUserId")}
          />
          {errors.toUserId && (
            <p className="text-red-600 text-sm mb-2">{errors.toUserId.message}</p>
          )}
        </div>
        <input
          type="text"
          placeholder="Type your message..."
          autoComplete="off"
          className="w-full p-2 border border-gray-300 text-black rounded"
          {...register("message")}
        />
        {errors.message && (
          <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}
