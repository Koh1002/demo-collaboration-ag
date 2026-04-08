import { UserIntent } from "./types";

// ============================================================
// Simple rule-based intent parser
// TODO: Replace with NLU or LLM-based parser in production
// ============================================================

/** Keyword patterns mapped to intents */
const INTENT_RULES: { patterns: RegExp[]; intent: UserIntent }[] = [
  {
    intent: "raw_request_denied",
    patterns: [
      /全部見せ/,
      /一覧/,
      /生データ/,
      /raw/i,
      /すべて.*見/,
      /全件/,
      /個別.*データ/,
      /球.*見せ/,
      /中身.*見/,
      /データ.*出/,
      /リスト.*見/,
    ],
  },
  {
    intent: "compare_even_sum",
    patterns: [
      /偶数.*合計/,
      /偶数.*比較/,
      /偶数.*sum/i,
      /even.*sum/i,
      /even.*compar/i,
      /偶数.*足/,
    ],
  },
  {
    intent: "count_odd_total",
    patterns: [
      /奇数.*件数/,
      /奇数.*数え/,
      /奇数.*総数/,
      /奇数.*カウント/,
      /odd.*count/i,
      /奇数.*何個/,
    ],
  },
  {
    intent: "compare_average_summary_only",
    patterns: [
      /平均.*比較/,
      /平均.*高い/,
      /平均.*教え/,
      /average/i,
      /平均値/,
    ],
  },
];

/**
 * Parse user input text and return the matched intent.
 * Rules are evaluated in order; first match wins.
 * raw_request_denied is checked first to ensure deny takes priority.
 */
export function parseUserIntent(input: string): UserIntent {
  const normalized = input.trim();
  if (!normalized) return "unknown";

  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        return rule.intent;
      }
    }
  }

  return "unknown";
}
