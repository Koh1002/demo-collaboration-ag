"use client";

import { motion } from "framer-motion";

interface EnvironmentZoneProps {
  label: string;
  envId: "A" | "B";
  ballCount: number;
  isActive: boolean;
  isComputing: boolean;
  children: React.ReactNode;
}

const envColors = {
  A: {
    border: "border-green-200",
    bg: "bg-green-50/60",
    headerBg: "bg-green-100",
    headerText: "text-green-700",
    ballBg: "bg-green-200",
    ballText: "text-green-600",
    activeBorder: "border-green-400",
  },
  B: {
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    headerBg: "bg-amber-100",
    headerText: "text-amber-700",
    ballBg: "bg-amber-200",
    ballText: "text-amber-600",
    activeBorder: "border-amber-400",
  },
};

export default function EnvironmentZone({
  label,
  envId,
  ballCount,
  isActive,
  isComputing,
  children,
}: EnvironmentZoneProps) {
  const c = envColors[envId];

  return (
    <div
      className={`relative rounded-2xl border-2 ${
        isActive ? c.activeBorder : c.border
      } ${c.bg} p-4 transition-colors duration-300`}
      style={{ backdropFilter: "blur(2px)" }}
    >
      {/* Header */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${c.headerBg} mb-3`}
      >
        <span className={`text-xs font-bold ${c.headerText}`}>{label}</span>
        <span className={`text-[10px] ${c.headerText} opacity-60`}>
          Secure Zone
        </span>
      </div>

      {/* Balls visualization (abstract — no values shown) */}
      <div className="flex items-center gap-1.5 mb-3">
        {Array.from({ length: ballCount }).map((_, i) => (
          <motion.div
            key={i}
            animate={
              isComputing
                ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
                : { scale: 1, opacity: 0.7 }
            }
            transition={
              isComputing
                ? { duration: 0.8, repeat: Infinity, delay: i * 0.15 }
                : { duration: 0.3 }
            }
            className={`w-5 h-5 rounded-full ${c.ballBg} flex items-center justify-center`}
          >
            <span className={`text-[8px] font-bold ${c.ballText}`}>?</span>
          </motion.div>
        ))}
        <span className="text-[9px] text-gray-400 ml-1">
          {ballCount} balls
        </span>
      </div>

      {/* Agent node */}
      <div className="flex justify-center">{children}</div>

      {/* Labels */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <span className="text-[9px] text-gray-500">
            Raw data remains local
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <span className="text-[9px] text-gray-500">Summary only</span>
        </div>
      </div>
    </div>
  );
}
