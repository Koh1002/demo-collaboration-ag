"use client";

import { useState, useCallback, useRef } from "react";
import {
  AppPhase,
  AuthStep,
  ChatMessage,
  EventLogEntry,
  SecureRequest,
  StatResult,
} from "@/lib/types";
import { parseUserIntent } from "@/lib/parser";
import { generateSteps, collectResults } from "@/lib/orchestrator";
import { formatFinalReport } from "@/lib/formatters";
import ChatPanel from "@/components/ChatPanel";
import FieldView, { getOrchestratorOffset } from "@/components/FieldView";

/** Generate a simple unique ID */
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function Home() {
  // --- State ---
  const [phase, setPhase] = useState<AppPhase>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [currentRequest, setCurrentRequest] = useState<SecureRequest | null>(
    null
  );
  const [authSteps, setAuthSteps] = useState<AuthStep[]>([]);
  const [results, setResults] = useState<StatResult[]>([]);
  const [orchestratorPos, setOrchestratorPos] = useState({ x: 0, y: 0 });

  const runningRef = useRef(false);

  // --- Helpers ---
  const addMessage = useCallback(
    (role: ChatMessage["role"], content: string) => {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role, content, timestamp: Date.now() },
      ]);
    },
    []
  );

  const addEvent = useCallback(
    (message: string, type: EventLogEntry["type"] = "info") => {
      setEvents((prev) => [
        ...prev,
        { id: uid(), timestamp: Date.now(), message, type },
      ]);
    },
    []
  );

  // --- Reset ---
  const handleReset = useCallback(() => {
    runningRef.current = false;
    setPhase("idle");
    setMessages([]);
    setEvents([]);
    setCurrentRequest(null);
    setAuthSteps([]);
    setResults([]);
    setOrchestratorPos({ x: 0, y: 0 });
  }, []);

  // --- Send message & run orchestration ---
  const handleSend = useCallback(
    async (text: string) => {
      if (runningRef.current) return;
      runningRef.current = true;

      // Reset previous run state
      setEvents([]);
      setCurrentRequest(null);
      setAuthSteps([]);
      setResults([]);
      setOrchestratorPos({ x: 0, y: 0 });

      // Add user message
      addMessage("user", text);

      // Parse intent
      const intent = parseUserIntent(text);

      // Generate steps
      const steps = generateSteps(intent);
      const allResults = collectResults(steps);

      // Execute steps sequentially with delays
      for (const step of steps) {
        if (!runningRef.current) break;

        // Wait
        await new Promise((r) => setTimeout(r, step.delay));
        if (!runningRef.current) break;

        // Update phase
        setPhase(step.phase);

        // Log
        if (step.log && step.logType) {
          addEvent(step.log, step.logType);
        }

        // Auth steps
        if (step.authSteps) {
          setAuthSteps(step.authSteps);
        }

        // Secure request card
        if (step.secureRequest) {
          setCurrentRequest(step.secureRequest);
        }

        // Orchestrator position
        if (step.orchestratorTarget) {
          setOrchestratorPos(getOrchestratorOffset(step.orchestratorTarget));
        }

        // Stat result
        if (step.statResult) {
          setResults((prev) => [...prev, step.statResult!]);
        }
      }

      if (!runningRef.current) return;

      // Final report
      const report = formatFinalReport(intent, allResults);
      addMessage("orchestrator", report);

      runningRef.current = false;
    },
    [addMessage, addEvent]
  );

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <h1 className="text-base font-semibold text-gray-800">
            Secure Multi-Agent Orchestration Demo
          </h1>
        </div>
        <span className="text-xs text-gray-400">
          Concept Proof — フロントエンドのみ
        </span>
      </header>

      {/* Main content: two-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="w-[420px] flex-shrink-0 border-r border-gray-200">
          <ChatPanel
            messages={messages}
            phase={phase}
            onSend={handleSend}
            onReset={handleReset}
          />
        </div>

        {/* Right: Field visualization */}
        <div className="flex-1 min-w-0">
          <FieldView
            phase={phase}
            orchestratorPos={orchestratorPos}
            currentRequest={currentRequest}
            authSteps={authSteps}
            events={events}
            results={results}
          />
        </div>
      </div>
    </div>
  );
}
