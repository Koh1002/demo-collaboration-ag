"use client";

import { useState, useCallback, useRef } from "react";
import {
  AppPhase,
  AuthStep,
  Bubble,
  ChatMessage,
  SecureRequest,
  StatResult,
} from "@/lib/types";
import { parseUserIntent } from "@/lib/parser";
import { generateSteps, collectResults } from "@/lib/orchestrator";
import { formatFinalReport } from "@/lib/formatters";
import ChatPanel from "@/components/ChatPanel";
import FieldView, { getOrchestratorPos } from "@/components/FieldView";

/** Generate a simple unique ID */
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Max number of speech bubbles shown on the graph at once */
const MAX_BUBBLES = 5;

export default function Home() {
  // --- State ---
  const [phase, setPhase] = useState<AppPhase>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRequest, setCurrentRequest] = useState<SecureRequest | null>(null);
  const [authSteps, setAuthSteps] = useState<AuthStep[]>([]);
  const [results, setResults] = useState<StatResult[]>([]);
  const [orchestratorPos, setOrchestratorPos] = useState(getOrchestratorPos("center"));
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [mobileTab, setMobileTab] = useState<"chat" | "graph">("chat");

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

  const addBubble = useCallback(
    (speaker: Bubble["speaker"], message: string, type: Bubble["type"]) => {
      setBubbles((prev) => {
        const next = [
          ...prev,
          { id: uid(), speaker, message, type, timestamp: Date.now() },
        ];
        // Trim to max visible
        return next.slice(-MAX_BUBBLES);
      });
    },
    []
  );

  // --- Reset ---
  const handleReset = useCallback(() => {
    runningRef.current = false;
    setPhase("idle");
    setMessages([]);
    setCurrentRequest(null);
    setAuthSteps([]);
    setResults([]);
    setOrchestratorPos(getOrchestratorPos("center"));
    setBubbles([]);
  }, []);

  // --- Send message & run orchestration ---
  const handleSend = useCallback(
    async (text: string) => {
      if (runningRef.current) return;
      runningRef.current = true;

      // Reset previous run state (keep messages for history)
      setCurrentRequest(null);
      setAuthSteps([]);
      setResults([]);
      setOrchestratorPos(getOrchestratorPos("center"));
      setBubbles([]);

      // Switch to graph tab on mobile when processing starts
      setMobileTab("graph");

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

        await new Promise((r) => setTimeout(r, step.delay));
        if (!runningRef.current) break;

        // Update phase
        setPhase(step.phase);

        // Add speech bubble
        if (step.log && step.logType && step.speaker) {
          addBubble(step.speaker, step.log, step.logType);
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
          setOrchestratorPos(getOrchestratorPos(step.orchestratorTarget));
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

      // Switch back to chat on mobile to show result
      setMobileTab("chat");

      runningRef.current = false;
    },
    [addMessage, addBubble]
  );

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 md:px-6 py-2.5 md:py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1 md:gap-1.5">
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500" />
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500" />
          </div>
          <h1 className="text-sm md:text-base font-semibold text-gray-800">
            Secure Multi-Agent Orchestration
          </h1>
        </div>
        <span className="hidden md:inline text-xs text-gray-400">
          Concept Proof — フロントエンドのみ
        </span>
      </header>

      {/* Mobile tab switcher */}
      <div className="md:hidden flex border-b border-gray-200">
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            mobileTab === "chat"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
        >
          チャット
        </button>
        <button
          onClick={() => setMobileTab("graph")}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            mobileTab === "graph"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
        >
          ビジュアル
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat — hidden on mobile when graph tab active */}
        <div
          className={`${
            mobileTab === "chat" ? "flex" : "hidden"
          } md:flex w-full md:w-[420px] flex-shrink-0 md:border-r border-gray-200`}
        >
          <ChatPanel
            messages={messages}
            phase={phase}
            onSend={handleSend}
            onReset={handleReset}
          />
        </div>

        {/* Right: Graph visualization — hidden on mobile when chat tab active */}
        <div
          className={`${
            mobileTab === "graph" ? "flex" : "hidden"
          } md:flex flex-1 w-full min-w-0`}
        >
          <FieldView
            phase={phase}
            orchestratorPos={orchestratorPos}
            currentRequest={currentRequest}
            authSteps={authSteps}
            bubbles={bubbles}
            results={results}
          />
        </div>
      </div>
    </div>
  );
}
