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
// Layout: percentage-based FIXED positions for graph nodes/zones
// ============================================================

/** Fixed positions — edges always connect these points */
const NODE = {
  orchestratorHome: { x: 50, y: 18 },  // Orchestrator's home zone (top center)
  envA:             { x: 24, y: 76 },   // Environment A zone (bottom left)
  envB:             { x: 76, y: 76 },   // Environment B zone (bottom right)
} as const;

/** Where the orchestrator moves to for each target */
function getOrchestratorPos(target: string): { x: number; y: number } {
  switch (target) {
    case "A":  return { x: 30, y: 56 };   // near Env A
    case "B":  return { x: 70, y: 56 };   // near Env B
    case "pf": return { x: 50, y: 25 };   // near home (evaluating)
    default:   return NODE.orchestratorHome; // home
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

/** "Thinking" dots animation shown while an agent computes */
function ThinkingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-0.5 mt-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
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
    <div className="flex gap-1.5 mt-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={
            isComputing
              ? {
                  scale: [1, 1.35, 1],
                  opacity: [0.4, 1, 0.4],
                  boxShadow: [
                    `0 0 0px ${color}00`,
                    `0 0 8px ${color}80`,
                    `0 0 0px ${color}00`,
                  ],
                }
              : { scale: 1, opacity: 0.5 }
          }
          transition={
            isComputing
              ? { duration: 1.2, repeat: Infinity, delay: i * 0.25 }
              : { duration: 0.3 }
          }
          className="w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border"
          style={{
            backgroundColor: `${color}20`,
            borderColor: `${color}50`,
          }}
        >
          <span className="text-[7px] md:text-[8px] font-bold" style={{ color }}>
            ?
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/** A zone boundary — the "secure area" background (used for all three zones) */
function Zone({
  x,
  y,
  width,
  height,
  color,
  borderStyle,
  children,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderStyle?: "solid" | "dashed";
  children?: React.ReactNode;
}) {
  return (
    <div
      className="absolute rounded-2xl border-2"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        transform: "translate(-50%, -50%)",
        borderColor: `${color}50`,
        backgroundColor: `${color}08`,
        borderStyle: borderStyle ?? "dashed",
      }}
    >
      {children}
    </div>
  );
}

/** Agent node circle with icon + label */
function AgentCircle({
  icon,
  label,
  sublabel,
  color,
  isActive,
  isComputing,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  color: string;
  isActive: boolean;
  isComputing?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Glow ring */}
      {isActive && (
        <motion.div
          className="absolute rounded-full"
          style={{ width: 56, height: 56, backgroundColor: `${color}20`, top: -4, left: "50%", marginLeft: -28 }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      )}
      {/* Circle */}
      <div
        className="relative w-11 h-11 md:w-13 md:h-13 rounded-full bg-white border-2 shadow-md flex items-center justify-center z-10"
        style={{ borderColor: color }}
      >
        {isComputing ? (
          <motion.span
            className="text-base md:text-lg"
            animate={{ rotate: [0, 10, -10, 5, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {icon}
          </motion.span>
        ) : (
          <span className="text-base md:text-lg">{icon}</span>
        )}
      </div>
      <span className="mt-0.5 text-[9px] md:text-[11px] font-bold whitespace-nowrap" style={{ color }}>
        {label}
      </span>
      {sublabel && (
        <span className="text-[7px] md:text-[9px] text-gray-400 whitespace-nowrap">{sublabel}</span>
      )}
      {/* Thinking animation */}
      {isComputing && <ThinkingDots color={color} />}
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

  // Latest bubble per speaker
  const latestBubbles = useMemo(() => {
    const map = new Map<string, Bubble>();
    for (const b of bubbles) {
      map.set(b.speaker, b);
    }
    return Array.from(map.values());
  }, [bubbles]);

  // Bubble positions (relative to graph %)
  const bubblePositions: Record<string, { x: number; y: number; tail: "bottom" | "top" | "left" | "right" }> = {
    orchestrator: { x: orchestratorPos.x + 10, y: orchestratorPos.y - 6, tail: "bottom" },
    "agent-a": { x: NODE.envA.x + 12, y: NODE.envA.y - 12, tail: "bottom" },
    "agent-b": { x: NODE.envB.x - 12, y: NODE.envB.y - 12, tail: "bottom" },
    platform: { x: 68, y: NODE.orchestratorHome.y - 4, tail: "left" },
    policy: {
      x: isContactingB || targetIsB ? 58 : 42,
      y: 46,
      tail: "bottom",
    },
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50/50">
      <StatusHeader phase={phase} />

      <div className="flex-1 relative p-2 md:p-4 overflow-hidden w-full">
        <div className="absolute inset-2 md:inset-4 rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* ===== STATIC SVG edges (background paths — never move) ===== */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {/* Home ↔ Env A */}
            <line
              x1={`${NODE.orchestratorHome.x}%`}
              y1={`${NODE.orchestratorHome.y + 8}%`}
              x2={`${NODE.envA.x}%`}
              y2={`${NODE.envA.y - 10}%`}
              stroke={isContactingA || isComputingA ? "#34a853" : "#dadce0"}
              strokeWidth={isContactingA || isComputingA ? "2.5" : "1.5"}
              strokeDasharray="8,6"
            />
            {/* Home ↔ Env B */}
            <line
              x1={`${NODE.orchestratorHome.x}%`}
              y1={`${NODE.orchestratorHome.y + 8}%`}
              x2={`${NODE.envB.x}%`}
              y2={`${NODE.envB.y - 10}%`}
              stroke={isContactingB || isComputingB ? "#e37400" : "#dadce0"}
              strokeWidth={isContactingB || isComputingB ? "2.5" : "1.5"}
              strokeDasharray="8,6"
            />

            {/* Animated particle traveling along the active edge */}
            {(isContactingA || isComputingA) && (
              <circle r="4" fill="#34a853" opacity="0.6">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M${NODE.orchestratorHome.x * 5},${(NODE.orchestratorHome.y + 8) * 4} L${NODE.envA.x * 5},${(NODE.envA.y - 10) * 4}`}
                />
              </circle>
            )}
            {(isContactingB || isComputingB) && (
              <circle r="4" fill="#e37400" opacity="0.6">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M${NODE.orchestratorHome.x * 5},${(NODE.orchestratorHome.y + 8) * 4} L${NODE.envB.x * 5},${(NODE.envB.y - 10) * 4}`}
                />
              </circle>
            )}
          </svg>

          {/* ===== Zone backgrounds ===== */}

          {/* Orchestrator home zone (top center) */}
          <Zone x={NODE.orchestratorHome.x} y={NODE.orchestratorHome.y} width={38} height={22} color="#4285f4" borderStyle="solid">
            <div className="absolute top-1.5 left-0 right-0 flex justify-center">
              <span className="text-[8px] md:text-[9px] font-semibold text-blue-500 uppercase tracking-wider">
                Orchestrator Zone
              </span>
            </div>
            {/* Result cards displayed inside home zone */}
            {results.length > 0 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                {results.map((r) => (
                  <motion.div
                    key={`${r.environment}-${r.label}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`px-2 py-0.5 rounded text-[8px] md:text-[10px] font-medium border ${
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
          </Zone>

          {/* Env A zone (bottom left) */}
          <Zone x={NODE.envA.x} y={NODE.envA.y} width={38} height={36} color="#34a853">
            <div className="absolute top-1.5 left-0 right-0 flex justify-center">
              <span className="text-[8px] md:text-[9px] font-semibold text-green-600 uppercase tracking-wider">
                Environment A
              </span>
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-0.5">
              <span className="text-[7px] md:text-[8px] text-gray-400">🔒 Raw data remains local</span>
            </div>
          </Zone>

          {/* Env B zone (bottom right) */}
          <Zone x={NODE.envB.x} y={NODE.envB.y} width={38} height={36} color="#e37400">
            <div className="absolute top-1.5 left-0 right-0 flex justify-center">
              <span className="text-[8px] md:text-[9px] font-semibold text-amber-600 uppercase tracking-wider">
                Environment B
              </span>
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-0.5">
              <span className="text-[7px] md:text-[8px] text-gray-400">🔒 Raw data remains local</span>
            </div>
          </Zone>

          {/* ===== Orchestrator node (animated, moves along edges) ===== */}
          <motion.div
            animate={{
              left: `${orchestratorPos.x}%`,
              top: `${orchestratorPos.y}%`,
            }}
            transition={{ type: "spring", stiffness: 40, damping: 14, mass: 1.2 }}
            className="absolute flex flex-col items-center pointer-events-none"
            style={{ transform: "translate(-50%, -50%)", zIndex: 20 }}
          >
            {isActive && (
              <motion.div
                className="absolute w-14 h-14 md:w-16 md:h-16 rounded-full bg-blue-400/15"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            )}
            <div className="w-11 h-11 md:w-13 md:h-13 rounded-full bg-white border-2 border-blue-500 shadow-lg flex items-center justify-center z-10">
              <span className="text-base md:text-lg">🤖</span>
            </div>
            <span className="mt-0.5 text-[9px] md:text-[11px] font-bold text-blue-600 whitespace-nowrap">
              Orchestrator
            </span>
          </motion.div>

          {/* ===== Agent nodes (fixed inside their zones) ===== */}

          {/* Agent A */}
          <div
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              left: `${NODE.envA.x}%`,
              top: `${NODE.envA.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <AgentCircle
              icon="🛡️"
              label="Agent A"
              sublabel="代表エージェント"
              color="#34a853"
              isActive={isContactingA || isComputingA}
              isComputing={isComputingA}
            />
            <BallRow count={environmentAValues.length} color="#34a853" isComputing={isComputingA} />
          </div>

          {/* Agent B */}
          <div
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              left: `${NODE.envB.x}%`,
              top: `${NODE.envB.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <AgentCircle
              icon="🛡️"
              label="Agent B"
              sublabel="代表エージェント"
              color="#e37400"
              isActive={isContactingB || isComputingB}
              isComputing={isComputingB}
            />
            <BallRow count={environmentBValues.length} color="#e37400" isComputing={isComputingB} />
          </div>

          {/* ===== Speech bubbles ===== */}
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

          {/* ===== Auth card — fixed in top-right corner ===== */}
          <AnimatePresence>
            {currentRequest && authSteps.length > 0 && (
              <motion.div
                key={`auth-${currentRequest.target}-${currentRequest.skill}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute z-30 pointer-events-none"
                style={{
                  right: 8,
                  top: 8,
                  width: "min(220px, 45%)",
                }}
              >
                <div
                  className={`rounded-lg border shadow-md p-2 backdrop-blur-sm text-[8px] md:text-[10px] ${
                    currentRequest.policy_decision === "DENY"
                      ? "bg-red-50/95 border-red-300"
                      : "bg-white/95 border-green-300"
                  }`}
                >
                  {/* Auth check steps — compact single row */}
                  <div className="flex flex-wrap gap-0.5 mb-1.5">
                    {authSteps.map((s, i) => (
                      <span
                        key={i}
                        className={`px-1 py-0 rounded text-[7px] md:text-[8px] ${
                          s.done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {s.done ? "✓" : "○"} {s.label}
                      </span>
                    ))}
                  </div>
                  {/* Metadata — compact */}
                  <div className="grid grid-cols-[auto_1fr] gap-x-1.5 gap-y-0 text-[7px] md:text-[9px] font-mono text-gray-600 leading-tight">
                    <span className="text-gray-400">target</span>
                    <span className="truncate">{currentRequest.target}</span>
                    <span className="text-gray-400">skill</span>
                    <span className="truncate">{currentRequest.skill}</span>
                    <span className="text-gray-400">scope</span>
                    <span className="truncate">{currentRequest.requested_scope}</span>
                  </div>
                  {authSteps.every((s) => s.done) && (
                    <div className="mt-1 flex items-center gap-1">
                      <PolicyStatusBadge decision={currentRequest.policy_decision} />
                    </div>
                  )}
                  {currentRequest.deny_reason && (
                    <div className="mt-1 text-[7px] md:text-[8px] text-red-600 bg-red-100 rounded px-1 py-0.5">
                      {currentRequest.deny_reason}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Annotation — bottom right, out of the way */}
          <div className="absolute bottom-2 right-3 z-10 text-[7px] md:text-[8px] text-gray-300 text-right">
            📊 統計情報のみ返却
          </div>
        </div>
      </div>
    </div>
  );
}
