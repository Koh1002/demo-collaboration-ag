"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { EventLogEntry } from "@/lib/types";

interface EventTimelineProps {
  events: EventLogEntry[];
}

const typeStyles: Record<EventLogEntry["type"], string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  auth: "border-yellow-200 bg-yellow-50 text-yellow-800",
  policy_allow: "border-green-200 bg-green-50 text-green-800",
  policy_deny: "border-red-200 bg-red-50 text-red-800",
  result: "border-indigo-200 bg-indigo-50 text-indigo-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

const typeIcons: Record<EventLogEntry["type"], string> = {
  info: "○",
  auth: "🔐",
  policy_allow: "✓",
  policy_deny: "✗",
  result: "📊",
  error: "⚠",
};

export default function EventTimeline({ events }: EventTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  if (events.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto chat-scroll pr-1">
      {events.map((e) => (
        <motion.div
          key={e.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg border text-xs leading-relaxed ${typeStyles[e.type]}`}
        >
          <span className="flex-shrink-0 w-4 text-center">
            {typeIcons[e.type]}
          </span>
          <span>{e.message}</span>
        </motion.div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
