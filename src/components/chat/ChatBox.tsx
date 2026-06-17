"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import ChatMessage from "./ChatMessage";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  bookingId: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatBoxProps {
  bookingId: string;
  currentUserId: string;
}

export default function ChatBox({ bookingId, currentUserId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { token } = useAuthStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/messages?bookingId=${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  }, [bookingId, token]);

  const markAsRead = useCallback(async () => {
    if (!token) return;
    try {
      await axios.post(
        "/api/messages/read",
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }, [bookingId, token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!token) return;

    const eventSource = new EventSource(
      `/api/messages/stream?bookingId=${bookingId}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const newMessage = JSON.parse(event.data) as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [bookingId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages, markAsRead]);

  const sendMessage = async () => {
    if (!input.trim() || sending || !token) return;

    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      await axios.post(
        "/api/messages",
        { bookingId, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-maroon-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-maroon-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-maroon-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              content={msg.content}
              senderName={msg.senderName}
              senderAvatar={msg.senderAvatar}
              isOwn={msg.senderId === currentUserId}
              timestamp={msg.createdAt}
              type={msg.type}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={sending}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="p-2 rounded-lg bg-gradient-to-r from-maroon-600 to-coral-500 text-white disabled:opacity-40 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
