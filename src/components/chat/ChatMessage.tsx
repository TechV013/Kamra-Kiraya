"use client";

import { motion } from "framer-motion";

interface ChatMessageProps {
  content: string;
  senderName: string;
  senderAvatar?: string;
  isOwn: boolean;
  timestamp: string;
  type?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ChatMessage({
  content,
  senderName,
  senderAvatar,
  isOwn,
  timestamp,
  type = "text",
}: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
          isOwn
            ? "bg-gradient-to-br from-maroon-600 to-coral-500"
            : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        {senderAvatar ? (
          <img
            src={senderAvatar}
            alt={senderName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span
            className={`text-xs font-semibold ${
              isOwn ? "text-white" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            {getInitials(senderName)}
          </span>
        )}
      </div>

      {/* Message content */}
      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name */}
        {!isOwn && (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-1">
            {senderName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? "bg-gradient-to-r from-maroon-600 to-coral-500 text-white rounded-2xl rounded-tr-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-md"
          }`}
        >
          {type === "image" ? (
            <img src={content} alt="Shared image" className="rounded-lg max-w-full" />
          ) : (
            content
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
          {formatTime(timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
