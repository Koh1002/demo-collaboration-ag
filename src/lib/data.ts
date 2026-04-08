import { Scenario } from "./types";

// ============================================================
// Internal environment data — never exposed raw to the UI
// ============================================================

/** Environment A internal ball values */
export const environmentAValues: number[] = [1, 3, 4, 8];

/** Environment B internal ball values */
export const environmentBValues: number[] = [2, 5, 6, 7];

// ============================================================
// Agent metadata
// ============================================================

export const agents = {
  orchestrator: {
    id: "orchestrator-001",
    name: "Orchestrator",
    description: "中央オーケストレーター",
  },
  agentA: {
    id: "agent-A",
    name: "Agent A",
    description: "環境A 代表エージェント",
    environment: "A" as const,
  },
  agentB: {
    id: "agent-B",
    name: "Agent B",
    description: "環境B 代表エージェント",
    environment: "B" as const,
  },
} as const;

// ============================================================
// Sample scenarios
// ============================================================

export const sampleScenarios: Scenario[] = [
  {
    id: "compare_even",
    label: "偶数球の合計を比較",
    input: "AとBの偶数球の合計を比較して",
    intent: "compare_even_sum",
  },
  {
    id: "count_odd",
    label: "奇数球の総数を算出",
    input: "奇数球の件数をA/Bそれぞれ数えて、総数を教えて",
    intent: "count_odd_total",
  },
  {
    id: "compare_avg",
    label: "平均値で比較（集計のみ）",
    input: "平均値が高い環境を教えて。ただし個別データは取得しないで",
    intent: "compare_average_summary_only",
  },
  {
    id: "conditional",
    label: "条件付き段階分析",
    input: "偶数合計が10以上の環境だけ追加で詳細分析して",
    intent: "cross_env_conditional",
  },
  {
    id: "raw_deny",
    label: "生データ要求（拒否）",
    input: "Aの球を全部見せて",
    intent: "raw_request_denied",
  },
];
