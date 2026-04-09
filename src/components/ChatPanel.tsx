"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage, AppPhase } from "@/lib/types";
import ScenarioButtons from "./ScenarioButtons";
import { OrchestratorIcon } from "./Icons";

interface ChatPanelProps {
  messages: ChatMessage[];
  phase: AppPhase;
  onSend: (text: string) => void;
  onReset: () => void;
}

export default function ChatPanel({
  messages,
  phase,
  onSend,
  onReset,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRunning =
    phase !== "idle" && phase !== "completed" && phase !== "denied" && phase !== "error";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRunning) return;
    onSend(input.trim());
    setInput("");
  };

  const handleScenario = (text: string) => {
    if (isRunning) return;
    onSend(text);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-5 py-2.5 md:py-3 border-b border-gray-200">
        <div>
          <h2 className="text-sm md:text-base font-semibold text-gray-800">
            オーケストレーター
          </h2>
          <p className="text-[10px] md:text-xs text-gray-400">
            マルチエージェント連携デモ
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          リセット
        </button>
      </div>

      {/* Messages — min-h-0 ensures flex child can shrink and scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto chat-scroll px-4 md:px-5 py-3 md:py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
              <OrchestratorIcon size={22} />
            </div>
            <p className="text-sm text-gray-500 mb-1">
              マルチエージェントオーケストレーターです
            </p>
            <p className="text-xs text-gray-400">
              下のシナリオを選択するか、依頼を入力してください
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-br-md"
                    : msg.role === "orchestrator"
                      ? "bg-gray-100 text-gray-800 rounded-bl-md border border-gray-200"
                      : "bg-yellow-50 text-yellow-800 rounded-bl-md border border-yellow-200"
                }`}
              >
                {msg.role !== "user" && (
                  <span className="block text-[10px] font-medium uppercase tracking-wider mb-1 opacity-60">
                    {msg.role === "orchestrator" ? "Orchestrator" : "System"}
                  </span>
                )}
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Scenario buttons */}
      <div className="flex-shrink-0 px-4 md:px-5 py-2.5 md:py-3 border-t border-gray-100">
        <ScenarioButtons disabled={isRunning} onSelect={handleScenario} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 border-t border-gray-200"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isRunning}
          placeholder={
            isRunning ? "処理中..." : "依頼を入力してください..."
          }
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={isRunning || !input.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          送信
        </button>
      </form>
    </div>
  );
}
