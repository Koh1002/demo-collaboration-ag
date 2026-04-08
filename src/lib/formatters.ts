import { StatResult, UserIntent } from "./types";

// ============================================================
// Result formatting — Japanese natural language output
// TODO: Enhance with LLM-generated explanations in production
// ============================================================

/**
 * Generate a final report message for the orchestrator to present.
 */
export function formatFinalReport(
  intent: UserIntent,
  results: StatResult[]
): string {
  switch (intent) {
    case "compare_even_sum": {
      const a = results.find((r) => r.environment === "A");
      const b = results.find((r) => r.environment === "B");
      if (!a || !b) return "結果の取得に失敗しました。";
      const winner = a.value > b.value ? "A" : a.value < b.value ? "B" : "同値";
      if (winner === "同値") {
        return `環境Aの偶数球合計は ${a.value}、環境Bは ${b.value} でした。両環境は同じ値です。`;
      }
      return `環境Aの偶数球合計は ${a.value}、環境Bは ${b.value} でした。より大きいのは環境${winner}です。`;
    }
    case "count_odd_total": {
      const a = results.find((r) => r.environment === "A");
      const b = results.find((r) => r.environment === "B");
      if (!a || !b) return "結果の取得に失敗しました。";
      const total = a.value + b.value;
      return `環境Aの奇数球件数は ${a.value}、環境Bは ${b.value} で、総数は ${total} です。`;
    }
    case "compare_average_summary_only": {
      const a = results.find((r) => r.environment === "A");
      const b = results.find((r) => r.environment === "B");
      if (!a || !b) return "結果の取得に失敗しました。";
      const winner = a.value > b.value ? "A" : a.value < b.value ? "B" : "同値";
      if (winner === "同値") {
        return `個別データを取得せず平均値のみで比較した結果、環境Aは ${a.value}、環境Bは ${b.value} で同じ値です。`;
      }
      return `個別データを取得せず平均値のみで比較した結果、環境Aは ${a.value}、環境Bは ${b.value} でした。平均値が高いのは環境${winner}です。`;
    }
    case "cross_env_conditional": {
      const threshold = 10;
      const evenA = results.find((r) => r.environment === "A" && r.label === "偶数合計");
      const evenB = results.find((r) => r.environment === "B" && r.label === "偶数合計");
      if (!evenA || !evenB) return "結果の取得に失敗しました。";

      const aQ = evenA.value >= threshold;
      const bQ = evenB.value >= threshold;

      let report = `【条件付き段階分析の結果】\n`;
      report += `第1段階 偶数合計: A=${evenA.value}, B=${evenB.value}\n`;
      report += `閾値判定(≥${threshold}): A=${aQ ? "該当" : "非該当"}, B=${bQ ? "該当" : "非該当"}\n`;

      if (aQ || bQ) {
        report += `第2段階 該当環境の追加分析（奇数件数）:\n`;
        if (aQ) {
          const oddA = results.find((r) => r.environment === "A" && r.label === "奇数件数");
          if (oddA) report += `  環境A 奇数件数 = ${oddA.value}\n`;
        }
        if (bQ) {
          const oddB = results.find((r) => r.environment === "B" && r.label === "奇数件数");
          if (oddB) report += `  環境B 奇数件数 = ${oddB.value}\n`;
        }
      }

      const qualifiedEnvs = [aQ && "A", bQ && "B"].filter(Boolean).join("と");
      report += qualifiedEnvs
        ? `結論: 環境${qualifiedEnvs}が条件を満たし、追加の詳細分析が実施されました。`
        : `結論: 条件を満たす環境がなかったため、追加分析は実施されませんでした。`;
      return report;
    }
    case "raw_request_denied":
      return "この依頼は拒否されました。各環境の個別データは共有対象外であり、取得可能なのは統計情報のみです。";
    default:
      return "不明な依頼です。サンプルシナリオからお試しください。";
  }
}
