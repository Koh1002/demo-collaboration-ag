"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppPhase,
  AuthStep,
  Bubble,
  SecureRequest,
  StatResult,
} from "@/lib/types";
import { environmentAValues, environmentBValues } from "@/lib/data";
import StatusHeader from "./StatusHeader";
import PolicyStatusBadge from "./PolicyStatusBadge";
import SpeechBubble from "./SpeechBubble";

// ============================================================
// Layout: percentage-based positions for the graph nodes
// ============================================================

const NODE = {
  pf:           { x: 50, y: 7 },
  orchestrator: { x: 50, y: 32 },
  envA:         { x: 22, y: 75 },
  envB:         { x: 78, y: 75 },
} as const;

/** Map orchestrator target name to percentage position */
function getOrchestratorPos(target: string): { x: number; y: number } {
  switch (target) {
    case "A":  return { x: 32, y: 58 };   // partway toward A
    case "B":  return { x: 68, y: 58 };   // partway toward B
    case "pf": return { x: 50, y: 20 };   // toward PF
    default:   return NODE.orchestrator;   // center
  }
}

export { getOrchestratorPos };

// ============================================================
// Props
// ============================================================

interface FieldViewProps {
  phase: AppPhase;
  orchestratorPos: { x: number; y: number };
  currentRequest: SecureRequest | null;
  authSteps: AuthStep[];
  bubbles: Bubble[];
  results: StatResult[];
}

// ============================================================
// Sub-components
// ============================================================

/** A graph node with icon, label, and optional badge */
function GraphNode({
  x,
  y,
  icon,
  label,
  sublabel,
  color,
  isActive,
  isComputing,
  children,
}: {
  x: number;
  y: number;
  icon: string;
  label: string;
  sublabel?: string;
  color: string;
  isActive: boolean;
  isComputing?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="absolute flex flex-col items-center pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Glow ring */}
      {isActive && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 56,
            height: 56,
            backgroundColor: `${color}20`,
          }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {/* Node circle */}
      <div
        className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-white border-2 shadow-md flex items-center justify-center z-10"
        style={{ borderColor: color }}
      >
        {isComputing ? (
          <motion.span
            className="text-lg"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            {icon}
          </motion.span>
        ) : (
          <span className="text-lg">{icon}</span>
        )}
      </div>
      <span
        className="mt-1 text-[10px] md:text-xs font-bold whitespace-nowrap"
        style={{ color }}
      >
        {label}
      </span>
      {sublabel && (
        <span className="text-[8px] md:text-[9px] text-gray-400 whitespace-nowrap">
          {sublabel}
        </span>
      )}
      {children}
    </div>
  );
}

/** Animated ball row inside environment zone */
function BallRow({
  count,
  color,
  isComputing,
}: {
  count: number;
  color: string;
  isComputing: boolean;
}) {
  return (
    <div className="flex gap-1 mt-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={
            isComputing
              ? { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }
              : { scale: 1, opacity: 0.6 }
          }
          transition={
            isComputing
              ? { duration: 0.7, repeat: Infinity, delay: i * 0.12 }
              : { duration: 0.3 }
          }
          className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}30` }}
        >
          <span className="text-[7px] font-bold" style={{ color }}>
            ?
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/** Environment zone background — the "secure boundary" */
function EnvZone({
  x,
  y,
  width,
  color,
  label,
}: {
  x: number;
  y: number;
  width: number;
  color: string;
  label: string;
}) {
  return (
    <div
      className="absolute rounded-2xl border-2 border-dashed"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: "40%",
        transform: "translate(-50%, -50%)",
        borderColor: `${color}60`,
        backgroundColor: `${color}08`,
      }}
    >
      <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-0.5">
        <span className="text-[8px] md:text-[9px] text-gray-400">
          🔒 Raw data remains local
        </span>
        <span className="text-[8px] md:text-[9px] text-gray-400">
          📊 {label}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Main FieldView
// ============================================================

export default function FieldView({
  phase,
  orchestratorPos,
  currentRequest,
  authSteps,
  bubbles,
  results,
}: FieldViewProps) {
  const isActive = phase !== "idle";
  const targetIsA = currentRequest?.target === "agent-A";
  const targetIsB = currentRequest?.target === "agent-B";
  const isComputingA = phase === "local_computing" && targetIsA;
  const isComputingB = phase === "local_computing" && targetIsB;
  const isContactingA =
    phase === "contacting_a" ||
    ((phase === "authenticating" || phase === "authorizing") && targetIsA);
  const isContactingB =
    phase === "contacting_b" ||
    ((phase === "authenticating" || phase === "authorizing") && targetIsB);

  // Pick the latest bubbles per speaker (show last 1 per node)
  const latestBubbles = useMemo(() => {
    const map = new Map<string, Bubble>();
    // Keep only the most recent bubble per speaker
    for (const b of bubbles) {
      map.set(b.speaker, b);
    }
    return Array.from(map.values());
  }, [bubbles]);

  // Position mapping for bubbles
  const bubblePositions: Record<string, { x: number; y: number; tail: "bottom" | "top" | "left" | "right" }> = {
    orchestrator: { x: orchestratorPos.x + 12, y: orchestratorPos.y - 8, tail: "bottom" },
    "agent-a": { x: NODE.envA.x + 14, y: NODE.envA.y - 10, tail: "bottom" },
    "agent-b": { x: NODE.envB.x - 14, y: NODE.envB.y - 10, tail: "bottom" },
    platform: { x: NODE.pf.x + 14, y: NODE.pf.y + 2, tail: "top" },
    policy: {
      x: isContactingB || targetIsB ? NODE.envB.x - 10 : NODE.envA.x + 14,
      y: isContactingB || targetIsB ? 50 : 50,
      tail: "bottom",
    },
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <StatusHeader phase={phase} />

      {/* Graph area — aspect-ratio preserved container */}
      <div className="flex-1 relative p-3 md:p-4 overflow-hidden">
        <div className="relative w-full h-full min-h-[400px] rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* --- SVG edges --- */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {/* PF ↔ Orchestrator */}
            <line
              x1={`${NODE.pf.x}%`}
              y1={`${NODE.pf.y + 5}%`}
              x2={`${orchestratorPos.x}%`}
              y2={`${orchestratorPos.y - 5}%`}
              stroke="#dadce0"
              strokeWidth="2"
              strokeDasharray="8,5"
            />
            {/* Orchestrator ↔ Env A */}
            <line
              x1={`${orchestratorPos.x}%`}
              y1={`${orchestratorPos.y + 5}%`}
              x2={`${NODE.envA.x}%`}
              y2={`${NODE.envA.y - 8}%`}
              stroke={isContactingA || isComputingA ? "#34a853" : "#dadce0"}
              strokeWidth={isContactingA || isComputingA ? "2.5" : "2"}
              strokeDasharray="8,5"
            />
            {/* Orchestrator ↔ Env B */}
            <line
              x1={`${orchestratorPos.x}%`}
              y1={`${orchestratorPos.y + 5}%`}
              x2={`${NODE.envB.x}%`}
              y2={`${NODE.envB.y - 8}%`}
              stroke={isContactingB || isComputingB ? "#e37400" : "#dadce0"}
              strokeWidth={isContactingB || isComputingB ? "2.5" : "2"}
              strokeDasharray="8,5"
            />

            {/* Animated particle along active edge */}
            {(isContactingA || isComputingA) && (
              <circle r="4" fill="#34a853" opacity="0.7">
                <animateMotion
                  dur="1.5s"
                  repeatCount="indefinite"
                  path={`M${orchestratorPos.x * 5},${(orchestratorPos.y + 5) * 4} L${NODE.envA.x * 5},${(NODE.envA.y - 8) * 4}`}
                />
              </circle>
            )}
            {(isContactingB || isComputingB) && (
              <circle r="4" fill="#e37400" opacity="0.7">
                <animateMotion
                  dur="1.5s"
                  repeatCount="indefinite"
                  path={`M${orchestratorPos.x * 5},${(orchestratorPos.y + 5) * 4} L${NODE.envB.x * 5},${(NODE.envB.y - 8) * 4}`}
                />
              </circle>
            )}
          </svg>

          {/* --- Environment secure zones --- */}
          <EnvZone x={NODE.envA.x} y={NODE.envA.y} width={36} color="#34a853" label="Summary only" />
          <EnvZone x={NODE.envB.x} y={NODE.envB.y} width={36} color="#e37400" label="Summary only" />

          {/* --- Graph nodes --- */}

          {/* Platform */}
          <GraphNode
            x={NODE.pf.x}
            y={NODE.pf.y}
            icon="☁️"
            label="Integration PF"
            sublabel="中間プラットフォーム"
            color="#4285f4"
            isActive={phase === "evaluating"}
          >
            {/* Result cards near PF */}
            {results.length > 0 && (
              <div className="mt-1 flex flex-col gap-0.5">
                {results.map((r) => (
                  <motion.div
                    key={`${r.environment}-${r.label}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`px-2 py-0.5 rounded text-[9px] md:text-[10px] font-medium border ${
                      r.environment === "A"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}
                  >
                    {r.environment}: {r.label}={r.value}
                  </motion.div>
                ))}
              </div>
            )}
          </GraphNode>

          {/* Orchestrator (animated position) */}
          <motion.div
            animate={{
              left: `${orchestratorPos.x}%`,
              top: `${orchestratorPos.y}%`,
            }}
            transition={{ type: "spring", stiffness: 60, damping: 16 }}
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              transform: "translate(-50%, -50%)",
              zIndex: 20,
            }}
          >
            {isActive && (
              <motion.div
                className="absolute w-14 h-14 md:w-16 md:h-16 rounded-full bg-blue-400/15"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white border-2 border-blue-500 shadow-lg flex items-center justify-center z-10">
              <span className="text-lg">🤖</span>
            </div>
            <span className="mt-0.5 text-[10px] md:text-xs font-bold text-blue-600 whitespace-nowrap">
              Orchestrator
            </span>
          </motion.div>

          {/* Env A agent */}
          <GraphNode
            x={NODE.envA.x}
            y={NODE.envA.y}
            icon="🛡️"
            label="Agent A"
            sublabel="環境A 代表"
            color="#34a853"
            isActive={isContactingA || isComputingA}
            isComputing={isComputingA}
          >
            <BallRow
              count={environmentAValues.length}
              color="#34a853"
              isComputing={isComputingA}
            />
          </GraphNode>

          {/* Env B agent */}
          <GraphNode
            x={NODE.envB.x}
            y={NODE.envB.y}
            icon="🛡️"
            label="Agent B"
            sublabel="環境B 代表"
            color="#e37400"
            isActive={isContactingB || isComputingB}
            isComputing={isComputingB}
          >
            <BallRow
              count={environmentBValues.length}
              color="#e37400"
              isComputing={isComputingB}
            />
          </GraphNode>

          {/* --- Speech bubbles --- */}
          <AnimatePresence>
            {latestBubbles.map((b) => {
              const pos = bubblePositions[b.speaker];
              if (!pos) return null;
              return (
                <div
                  key={b.id}
                  className="absolute z-30 pointer-events-none"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: "translate(-10%, 0)",
                  }}
                >
                  <SpeechBubble bubble={b} tailDirection={pos.tail} />
                </div>
              );
            })}
          </AnimatePresence>

          {/* --- Auth card overlay on the graph --- */}
          <AnimatePresence>
            {currentRequest && authSteps.length > 0 && (
              <motion.div
                key={`auth-${currentRequest.target}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute z-30 pointer-events-none"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "min(300px, 70%)",
                }}
              >
                <div
                  className={`rounded-xl border shadow-lg p-3 backdrop-blur-sm text-[10px] md:text-xs ${
                    currentRequest.policy_decision === "DENY"
                      ? "bg-red-50/95 border-red-300"
                      : "bg-white/95 border-green-300"
                  }`}
                >
                  {/* Auth check steps */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {authSteps.map((s, i) => (
                      <span
                        key={i}
                        className={`px-1.5 py-0.5 rounded text-[9px] ${
                          s.done
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {s.done ? "✓" : "○"} {s.label}
                      </span>
                    ))}
                  </div>
                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] md:text-[10px] font-mono text-gray-600">
                    <span className="text-gray-400">requester</span>
                    <span>{currentRequest.requester}</span>
                    <span className="text-gray-400">target</span>
                    <span>{currentRequest.target}</span>
                    <span className="text-gray-400">skill</span>
                    <span>{currentRequest.skill}</span>
                    <span className="text-gray-400">scope</span>
                    <span>{currentRequest.requested_scope}</span>
                  </div>
                  {/* Policy badge */}
                  {authSteps.every((s) => s.done) && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-[9px] text-gray-400">policy:</span>
                      <PolicyStatusBadge decision={currentRequest.policy_decision} />
                    </div>
                  )}
                  {currentRequest.deny_reason && (
                    <div className="mt-1 text-[9px] text-red-600 bg-red-100 rounded px-1.5 py-0.5">
                      {currentRequest.deny_reason}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Annotation top-right */}
          <div className="absolute top-2 right-3 z-10 text-[8px] md:text-[9px] text-gray-400 text-right space-y-0.5">
            <div>🔒 生データは環境外に出ません</div>
            <div>📊 統計情報のみ返却されます</div>
          </div>
        </div>
      </div>
    </div>
  );
}
