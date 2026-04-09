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
import { environmentAValues, environmentBValues, environmentCValues } from "@/lib/data";
import StatusHeader from "./StatusHeader";
import PolicyStatusBadge from "./PolicyStatusBadge";
import SpeechBubble from "./SpeechBubble";
import { OrchestratorIcon, AgentIcon, LockIcon, StatsIcon } from "./Icons";

// ============================================================
// Layout: percentage-based FIXED positions for graph nodes/zones
// ============================================================

/** Fixed positions — edges always connect these points */
const NODE = {
  orchestratorHome: { x: 50, y: 15 },  // Orchestrator's home zone (top center)
  envA:             { x: 20, y: 76 },   // Environment A zone (bottom left)
  envB:             { x: 50, y: 76 },   // Environment B zone (bottom center)
  envC:             { x: 80, y: 76 },   // Environment C zone (bottom right)
} as const;

/** Where the orchestrator moves to for each target */
function getOrchestratorPos(target: string): { x: number; y: number } {
  switch (target) {
    case "A":  return { x: 28, y: 52 };
    case "B":  return { x: 50, y: 52 };
    case "C":  return { x: 72, y: 52 };
    case "pf": return { x: 50, y: 22 };
    default:   return NODE.orchestratorHome;
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
    <div className="flex gap-1 mt-1.5">
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
          className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center border"
          style={{
            backgroundColor: `${color}20`,
            borderColor: `${color}50`,
          }}
        >
          <span className="text-[6px] md:text-[7px] font-bold" style={{ color }}>
            ?
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/** A zone boundary — the "secure area" background */
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
  icon: React.ReactNode;
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
          style={{ width: 48, height: 48, backgroundColor: `${color}20`, top: -2, left: "50%", marginLeft: -24 }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      )}
      {/* Circle */}
      <div
        className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 shadow-md flex items-center justify-center z-10"
        style={{ borderColor: color }}
      >
        {isComputing ? (
          <motion.div
            animate={{ rotate: [0, 8, -8, 4, -4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            {icon}
          </motion.div>
        ) : (
          icon
        )}
      </div>
      <span className="mt-0.5 text-[8px] md:text-[10px] font-bold whitespace-nowrap" style={{ color }}>
        {label}
      </span>
      {sublabel && (
        <span className="text-[6px] md:text-[8px] text-gray-400 whitespace-nowrap">{sublabel}</span>
      )}
      {/* Thinking animation */}
      {isComputing && <ThinkingDots color={color} />}
    </div>
  );
}

// ============================================================
// Environment colors
// ============================================================

const ENV_COLORS = {
  A: "#34a853",
  B: "#e37400",
  C: "#7b1fa2",
} as const;

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
  const targetIsC = currentRequest?.target === "agent-C";
  const isComputingA = phase === "local_computing" && targetIsA;
  const isComputingB = phase === "local_computing" && targetIsB;
  const isComputingC = phase === "local_computing" && targetIsC;
  const isContactingA =
    phase === "contacting_a" ||
    ((phase === "authenticating" || phase === "authorizing") && targetIsA);
  const isContactingB =
    phase === "contacting_b" ||
    ((phase === "authenticating" || phase === "authorizing") && targetIsB);
  const isContactingC =
    phase === "contacting_c" ||
    ((phase === "authenticating" || phase === "authorizing") && targetIsC);

  // Latest bubble per speaker
  const latestBubbles = useMemo(() => {
    const map = new Map<string, Bubble>();
    for (const b of bubbles) {
      map.set(b.speaker, b);
    }
    return Array.from(map.values());
  }, [bubbles]);

  // Determine which env the policy bubble should appear near
  const policyNearEnv = targetIsC ? "C" : targetIsB ? "B" : "A";
  const policyX = policyNearEnv === "A" ? 32 : policyNearEnv === "B" ? 55 : 75;

  // Bubble positions (relative to graph %)
  const bubblePositions: Record<string, { x: number; y: number; tail: "bottom" | "top" | "left" | "right" }> = {
    orchestrator: { x: orchestratorPos.x + 8, y: orchestratorPos.y - 6, tail: "bottom" },
    "agent-a": { x: NODE.envA.x + 8, y: NODE.envA.y - 14, tail: "bottom" },
    "agent-b": { x: NODE.envB.x + 8, y: NODE.envB.y - 14, tail: "bottom" },
    "agent-c": { x: NODE.envC.x - 16, y: NODE.envC.y - 14, tail: "bottom" },
    platform: { x: 66, y: NODE.orchestratorHome.y - 4, tail: "left" },
    policy: { x: policyX, y: 44, tail: "bottom" },
  };

  const resultColor = (env: string) =>
    env === "A" ? "bg-green-50 border-green-200 text-green-700"
    : env === "B" ? "bg-amber-50 border-amber-200 text-amber-700"
    : "bg-purple-50 border-purple-200 text-purple-700";

  return (
    <div className="flex flex-col h-full w-full bg-gray-50/50">
      <StatusHeader phase={phase} />

      <div className="flex-1 relative p-2 md:p-4 overflow-hidden w-full">
        <div className="absolute inset-2 md:inset-4 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

          {/* ===== STATIC SVG edges (background paths — never move) ===== */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {/* Home ↔ Env A */}
            <line
              x1={`${NODE.orchestratorHome.x}%`}
              y1={`${NODE.orchestratorHome.y + 8}%`}
              x2={`${NODE.envA.x}%`}
              y2={`${NODE.envA.y - 10}%`}
              stroke={isContactingA || isComputingA ? ENV_COLORS.A : "#dadce0"}
              strokeWidth={isContactingA || isComputingA ? "2.5" : "1.5"}
              strokeDasharray="8,6"
            />
            {/* Home ↔ Env B */}
            <line
              x1={`${NODE.orchestratorHome.x}%`}
              y1={`${NODE.orchestratorHome.y + 8}%`}
              x2={`${NODE.envB.x}%`}
              y2={`${NODE.envB.y - 10}%`}
              stroke={isContactingB || isComputingB ? ENV_COLORS.B : "#dadce0"}
              strokeWidth={isContactingB || isComputingB ? "2.5" : "1.5"}
              strokeDasharray="8,6"
            />
            {/* Home ↔ Env C */}
            <line
              x1={`${NODE.orchestratorHome.x}%`}
              y1={`${NODE.orchestratorHome.y + 8}%`}
              x2={`${NODE.envC.x}%`}
              y2={`${NODE.envC.y - 10}%`}
              stroke={isContactingC || isComputingC ? ENV_COLORS.C : "#dadce0"}
              strokeWidth={isContactingC || isComputingC ? "2.5" : "1.5"}
              strokeDasharray="8,6"
            />

            {/* Animated particles traveling along the active edge */}
            {(isContactingA || isComputingA) && (
              <circle r="4" fill={ENV_COLORS.A} opacity="0.6">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M${NODE.orchestratorHome.x * 5},${(NODE.orchestratorHome.y + 8) * 4} L${NODE.envA.x * 5},${(NODE.envA.y - 10) * 4}`}
                />
              </circle>
            )}
            {(isContactingB || isComputingB) && (
              <circle r="4" fill={ENV_COLORS.B} opacity="0.6">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M${NODE.orchestratorHome.x * 5},${(NODE.orchestratorHome.y + 8) * 4} L${NODE.envB.x * 5},${(NODE.envB.y - 10) * 4}`}
                />
              </circle>
            )}
            {(isContactingC || isComputingC) && (
              <circle r="4" fill={ENV_COLORS.C} opacity="0.6">
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M${NODE.orchestratorHome.x * 5},${(NODE.orchestratorHome.y + 8) * 4} L${NODE.envC.x * 5},${(NODE.envC.y - 10) * 4}`}
                />
              </circle>
            )}
          </svg>

          {/* ===== Zone backgrounds ===== */}

          {/* Orchestrator home zone (top center) */}
          <Zone x={NODE.orchestratorHome.x} y={NODE.orchestratorHome.y} width={42} height={20} color="#4285f4" borderStyle="solid">
            <div className="absolute top-1.5 left-0 right-0 flex justify-center">
              <span className="text-[7px] md:text-[9px] font-semibold text-blue-500 uppercase tracking-wider">
                Orchestrator Zone
              </span>
            </div>
            {/* Result cards displayed inside home zone */}
            {results.length > 0 && (
              <div className="absolute bottom-1.5 left-1 right-1 flex flex-wrap justify-center gap-1">
                {results.map((r) => (
                  <motion.div
                    key={`${r.environment}-${r.label}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`px-1.5 py-0.5 rounded text-[7px] md:text-[9px] font-medium border ${resultColor(r.environment)}`}
                  >
                    {r.environment}:{r.label}={r.value}
                  </motion.div>
                ))}
              </div>
            )}
          </Zone>

          {/* Env A zone (bottom left) */}
          <Zone x={NODE.envA.x} y={NODE.envA.y} width={28} height={36} color={ENV_COLORS.A}>
            <div className="absolute top-1.5 left-0 right-0 flex justify-center">
              <span className="text-[7px] md:text-[8px] font-semibold text-green-600 uppercase tracking-wider">
                Env A
              </span>
            </div>
            <div className="absolute bottom-1.5 left-0 right-0 flex flex-col items-center">
              <span className="inline-flex items-center gap-0.5 text-[6px] md:text-[7px] text-gray-400"><LockIcon size={8} /> Local only</span>
            </div>
          </Zone>

          {/* Env B zone (bottom center) */}
          <Zone x={NODE.envB.x} y={NODE.envB.y} width={28} height={36} color={ENV_COLORS.B}>
            <div className="absolute top-1.5 left-0 right-0 flex justify-center">
              <span className="text-[7px] md:text-[8px] font-semibold text-amber-600 uppercase tracking-wider">
                Env B
              </span>
            </div>
            <div className="absolute bottom-1.5 left-0 right-0 flex flex-col items-center">
              <span className="inline-flex items-center gap-0.5 text-[6px] md:text-[7px] text-gray-400"><LockIcon size={8} /> Local only</span>
            </div>
          </Zone>

          {/* Env C zone (bottom right) */}
          <Zone x={NODE.envC.x} y={NODE.envC.y} width={28} height={36} color={ENV_COLORS.C}>
            <div className="absolute top-1.5 left-0 right-0 flex justify-center">
              <span className="text-[7px] md:text-[8px] font-semibold text-purple-600 uppercase tracking-wider">
                Env C
              </span>
            </div>
            <div className="absolute bottom-1.5 left-0 right-0 flex flex-col items-center">
              <span className="inline-flex items-center gap-0.5 text-[6px] md:text-[7px] text-gray-400"><LockIcon size={8} /> Local only</span>
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
                className="absolute w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-400/15"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            )}
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-blue-500 shadow-lg flex items-center justify-center z-10">
              <OrchestratorIcon size={20} />
            </div>
            <span className="mt-0.5 text-[8px] md:text-[10px] font-bold text-blue-600 whitespace-nowrap">
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
              icon={<AgentIcon size={18} color={ENV_COLORS.A} />}
              label="Agent A"
              sublabel="代表エージェント"
              color={ENV_COLORS.A}
              isActive={isContactingA || isComputingA}
              isComputing={isComputingA}
            />
            <BallRow count={environmentAValues.length} color={ENV_COLORS.A} isComputing={isComputingA} />
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
              icon={<AgentIcon size={18} color={ENV_COLORS.B} />}
              label="Agent B"
              sublabel="代表エージェント"
              color={ENV_COLORS.B}
              isActive={isContactingB || isComputingB}
              isComputing={isComputingB}
            />
            <BallRow count={environmentBValues.length} color={ENV_COLORS.B} isComputing={isComputingB} />
          </div>

          {/* Agent C */}
          <div
            className="absolute flex flex-col items-center pointer-events-none"
            style={{
              left: `${NODE.envC.x}%`,
              top: `${NODE.envC.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <AgentCircle
              icon={<AgentIcon size={18} color={ENV_COLORS.C} />}
              label="Agent C"
              sublabel="代表エージェント"
              color={ENV_COLORS.C}
              isActive={isContactingC || isComputingC}
              isComputing={isComputingC}
            />
            <BallRow count={environmentCValues.length} color={ENV_COLORS.C} isComputing={isComputingC} />
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
                  width: "min(200px, 40%)",
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
                        {s.done ? (
                          <svg width="8" height="8" viewBox="0 0 16 16" className="inline-block flex-shrink-0"><polyline points="3,8 7,12 13,4" stroke="#15803d" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="8" height="8" viewBox="0 0 16 16" className="inline-block flex-shrink-0"><circle cx="8" cy="8" r="5" stroke="#9ca3af" strokeWidth="1.5" fill="none"/></svg>
                        )} {s.label}
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

          {/* Annotation — bottom right */}
          <div className="absolute bottom-2 right-3 z-10 text-[6px] md:text-[7px] text-gray-300 text-right">
            <span className="inline-flex items-center gap-0.5"><StatsIcon size={8} /> 統計情報のみ返却</span>
          </div>
        </div>
      </div>
    </div>
  );
}
