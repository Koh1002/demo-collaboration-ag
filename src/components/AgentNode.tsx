"use client";

import { motion } from "framer-motion";

interface AgentNodeProps {
  label: string;
  envLabel: string;
  isComputing: boolean;
  color: "green" | "amber";
}

const colorMap = {
  green: {
    border: "border-green-400",
    bg: "bg-green-50",
    text: "text-green-700",
    glow: "bg-green-400/20",
  },
  amber: {
    border: "border-amber-400",
    bg: "bg-amber-50",
    text: "text-amber-700",
    glow: "bg-amber-400/20",
  },
};

export default function AgentNode({
  label,
  envLabel,
  isComputing,
  color,
}: AgentNodeProps) {
  const c = colorMap[color];

  return (
    <div className="relative flex flex-col items-center">
      {isComputing && (
        <motion.div
          className={`absolute w-14 h-14 rounded-full ${c.glow}`}
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ top: -3, left: "50%", marginLeft: -28 }}
        />
      )}
      <div
        className={`w-12 h-12 rounded-full bg-white border-2 ${c.border} shadow-md flex items-center justify-center`}
      >
        <span className="text-base">🛡️</span>
      </div>
      <span className={`mt-1 text-[10px] font-bold ${c.text}`}>{label}</span>
      <span className="text-[9px] text-gray-400">{envLabel}</span>
    </div>
  );
}
