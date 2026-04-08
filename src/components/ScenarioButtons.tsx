"use client";

import { sampleScenarios } from "@/lib/data";

interface ScenarioButtonsProps {
  disabled: boolean;
  onSelect: (input: string) => void;
}

export default function ScenarioButtons({
  disabled,
  onSelect,
}: ScenarioButtonsProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        サンプルシナリオ
      </span>
      <div className="flex flex-wrap gap-2">
        {sampleScenarios.map((s) => (
          <button
            key={s.id}
            disabled={disabled}
            onClick={() => onSelect(s.input)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              disabled
                ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                : s.id === "raw_deny"
                  ? "border-red-200 text-red-600 hover:bg-red-50 bg-white"
                  : "border-blue-200 text-blue-600 hover:bg-blue-50 bg-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
