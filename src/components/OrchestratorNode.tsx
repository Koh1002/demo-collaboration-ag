"use client";

import { motion } from "framer-motion";
import { OrchestratorIcon } from "./Icons";

interface OrchestratorNodeProps {
  x: number;
  y: number;
  isActive: boolean;
}

export default function OrchestratorNode({
  x,
  y,
  isActive,
}: OrchestratorNodeProps) {
  return (
    <motion.div
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 80, damping: 18 }}
      className="absolute z-20"
      style={{ left: "50%", top: "40%", marginLeft: -32, marginTop: -32 }}
    >
      {/* Glow ring when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-400/20"
          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ margin: -8 }}
        />
      )}
      <div className="w-16 h-16 rounded-full bg-white border-2 border-blue-400 shadow-lg flex items-center justify-center">
        <div className="text-center">
          <OrchestratorIcon size={24} />
          <div className="text-[8px] font-bold text-blue-600 leading-tight">
            Orchestrator
          </div>
        </div>
      </div>
    </motion.div>
  );
}
