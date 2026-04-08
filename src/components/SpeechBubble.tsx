"use client";

import { motion } from "framer-motion";
import { Bubble } from "@/lib/types";

interface SpeechBubbleProps {
  bubble: Bubble;
  /** Position of the bubble tail: which direction the tail points */
  tailDirection?: "left" | "right" | "bottom" | "top";
}

const typeColor: Record<Bubble["type"], { bg: string; border: string; text: string }> = {
  info: { bg: "bg-white", border: "border-blue-200", text: "text-gray-700" },
  auth: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-800" },
  policy_allow: { bg: "bg-green-50", border: "border-green-300", text: "text-green-800" },
  policy_deny: { bg: "bg-red-50", border: "border-red-300", text: "text-red-800" },
  result: { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-800" },
  error: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700" },
};

export default function SpeechBubble({ bubble, tailDirection = "bottom" }: SpeechBubbleProps) {
  const c = typeColor[bubble.type];

  // Tail CSS — small triangle pointing toward the speaker node
  const tailClass = {
    bottom: "after:absolute after:top-full after:left-4 after:border-8 after:border-transparent after:border-t-white",
    top: "after:absolute after:bottom-full after:left-4 after:border-8 after:border-transparent after:border-b-white",
    left: "after:absolute after:top-3 after:right-full after:border-8 after:border-transparent after:border-r-white",
    right: "after:absolute after:top-3 after:left-full after:border-8 after:border-transparent after:border-l-white",
  }[tailDirection];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -4 }}
      transition={{ duration: 0.25 }}
      className={`relative ${tailClass} max-w-[220px] px-3 py-2 rounded-xl border shadow-sm text-xs leading-relaxed ${c.bg} ${c.border} ${c.text}`}
    >
      {bubble.message}
    </motion.div>
  );
}
