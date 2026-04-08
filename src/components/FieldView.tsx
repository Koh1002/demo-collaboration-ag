"use client";

import { AnimatePresence } from "framer-motion";
import {
  AppPhase,
  AuthStep,
  EventLogEntry,
  SecureRequest,
  StatResult,
} from "@/lib/types";
import { environmentAValues, environmentBValues } from "@/lib/data";
import OrchestratorNode from "./OrchestratorNode";
import AgentNode from "./AgentNode";
import EnvironmentZone from "./EnvironmentZone";
import SecureRequestCard from "./SecureRequestCard";
import EventTimeline from "./EventTimeline";
import ResultCard from "./ResultCard";
import StatusHeader from "./StatusHeader";

interface FieldViewProps {
  phase: AppPhase;
  orchestratorPos: { x: number; y: number };
  currentRequest: SecureRequest | null;
  authSteps: AuthStep[];
  events: EventLogEntry[];
  results: StatResult[];
}

/** Map orchestrator target to pixel offsets relative to the center */
function getOrchestratorOffset(target: string): { x: number; y: number } {
  switch (target) {
    case "A":
      return { x: -140, y: 80 };
    case "B":
      return { x: 140, y: 80 };
    case "pf":
      return { x: 0, y: -60 };
    default:
      return { x: 0, y: 0 };
  }
}

export { getOrchestratorOffset };

export default function FieldView({
  phase,
  orchestratorPos,
  currentRequest,
  authSteps,
  events,
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

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <StatusHeader phase={phase} />

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
        {/* Architecture diagram area */}
        <div className="relative flex-shrink-0 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden" style={{ minHeight: 380 }}>
          {/* PF zone at top */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="flex flex-col items-center">
              <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 shadow-sm">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Integration Platform
                </div>
                <div className="text-[9px] text-blue-400 text-center">
                  中間PF
                </div>
              </div>
              {results.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {results.map((r) => (
                    <ResultCard key={`${r.environment}-${r.label}`} result={r} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Connection lines (SVG) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {/* PF to Orchestrator */}
            <line
              x1="50%"
              y1="60"
              x2="50%"
              y2="160"
              stroke="#dadce0"
              strokeWidth="1.5"
              strokeDasharray="6,4"
            />
            {/* Orchestrator to A */}
            <line
              x1="50%"
              y1="200"
              x2="25%"
              y2="280"
              stroke={isContactingA ? "#34a853" : "#dadce0"}
              strokeWidth={isContactingA ? "2" : "1.5"}
              strokeDasharray="6,4"
            />
            {/* Orchestrator to B */}
            <line
              x1="50%"
              y1="200"
              x2="75%"
              y2="280"
              stroke={isContactingB ? "#f29900" : "#dadce0"}
              strokeWidth={isContactingB ? "2" : "1.5"}
              strokeDasharray="6,4"
            />
          </svg>

          {/* Orchestrator node */}
          <OrchestratorNode
            x={orchestratorPos.x}
            y={orchestratorPos.y}
            isActive={isActive}
          />

          {/* Environment zones */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-4" style={{ zIndex: 5 }}>
            <div className="flex-1">
              <EnvironmentZone
                label="環境 A"
                envId="A"
                ballCount={environmentAValues.length}
                isActive={isContactingA || isComputingA}
                isComputing={isComputingA}
              >
                <AgentNode
                  label="Agent A"
                  envLabel="代表エージェント"
                  isComputing={isComputingA}
                  color="green"
                />
              </EnvironmentZone>
            </div>
            <div className="flex-1">
              <EnvironmentZone
                label="環境 B"
                envId="B"
                ballCount={environmentBValues.length}
                isActive={isContactingB || isComputingB}
                isComputing={isComputingB}
              >
                <AgentNode
                  label="Agent B"
                  envLabel="代表エージェント"
                  isComputing={isComputingB}
                  color="amber"
                />
              </EnvironmentZone>
            </div>
          </div>

          {/* Annotation */}
          <div className="absolute top-4 right-4 z-10">
            <div className="text-[9px] text-gray-400 text-right space-y-0.5">
              <div>🔒 生データは環境外に出ません</div>
              <div>📊 統計情報のみ返却されます</div>
            </div>
          </div>
        </div>

        {/* Secure request card */}
        <AnimatePresence mode="wait">
          {currentRequest && authSteps.length > 0 && (
            <SecureRequestCard
              key={`${currentRequest.target}-${currentRequest.skill}`}
              request={currentRequest}
              authSteps={authSteps}
            />
          )}
        </AnimatePresence>

        {/* Event timeline */}
        {events.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Event Log
            </h3>
            <EventTimeline events={events} />
          </div>
        )}
      </div>
    </div>
  );
}
