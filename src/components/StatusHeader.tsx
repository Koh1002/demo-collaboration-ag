"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AppPhase, PHASE_LABELS } from "@/lib/types";

interface StatusHeaderProps {
  phase: AppPhase;
}

const phaseColor: Record<string, string> = {
  idle: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-50 text-blue-700",
  planning: "bg-blue-50 text-blue-700",
  authenticating: "bg-yellow-50 text-yellow-700",
  authorizing: "bg-yellow-50 text-yellow-700",
  contacting_a: "bg-green-50 text-green-700",
  contacting_b: "bg-amber-50 text-amber-700",
  local_computing: "bg-indigo-50 text-indigo-700",
  evaluating: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
  denied: "bg-red-50 text-red-700",
  error: "bg-red-50 text-red-700",
};

export default function StatusHeader({ phase }: StatusHeaderProps) {
  const label = PHASE_LABELS[phase];
  const color = phaseColor[phase] ?? "bg-gray-100 text-gray-600";
  const isActive = phase !== "idle" && phase !== "completed" && phase !== "denied" && phase !== "error";

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-white">
      <span className="text-sm font-medium text-gray-500">Status</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={phase}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}
        >
          {isActive && (
            <motion.span
              className="inline-block w-2 h-2 rounded-full bg-current"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
          {label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
