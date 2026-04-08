"use client";

import { motion } from "framer-motion";
import { PolicyDecision } from "@/lib/types";

interface PolicyStatusBadgeProps {
  decision: PolicyDecision;
  className?: string;
}

export default function PolicyStatusBadge({
  decision,
  className = "",
}: PolicyStatusBadgeProps) {
  const isAllow = decision === "ALLOW";

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
        isAllow
          ? "bg-green-100 text-green-700 border border-green-300"
          : "bg-red-100 text-red-700 border border-red-300"
      } ${className}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isAllow ? "bg-green-500" : "bg-red-500"
        }`}
      />
      {decision}
    </motion.span>
  );
}
