"use client";

import dynamic from "next/dynamic";

const Chatbot = dynamic(() => import("@/components/ai/Chatbot"), { ssr: false });

export default function ChatbotWrapper() {
  return <Chatbot />;
}
