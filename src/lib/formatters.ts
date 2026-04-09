import { StatResult, UserIntent } from "./types";

// ============================================================
// Result formatting — Japanese natural language output
// TODO: Enhance with LLM-generated explanations in production
// ============================================================

type EnvId = "A" | "B" | "C";
const ENVS: EnvId[] = ["A", "B", "C"];

/**
 * Generate a final report message for the orchestrator to present.
 */
export function formatFinalReport(
  intent: UserIntent,
  results: StatResult[]
): string {
  switch (intent) {
    case "compare_even_sum": {
      const vals = ENVS.map((e) => ({ e, r: results.find((r) => r.environment === e) }));
      if (vals.some((v) => !v.r)) return "結果の取得に失敗しました。";
      const summary = vals.map((v) => `環境${v.e}=${v.r!.value}`).join("、");
      const max = Math.max(...vals.map((v) => v.r!.value));
      const winners = vals.filter((v) => v.r!.value === max).map((v) => v.e);
      return `偶数球合計: ${summary}。最大は環境${winners.join("・")}(${max})です。`;
    }
    case "count_odd_total": {
      const vals = ENVS.map((e) => ({ e, r: results.find((r) => r.environment === e) }));
      if (vals.some((v) => !v.r)) return "結果の取得に失敗しました。";
      const total = vals.reduce((s, v) => s + v.r!.value, 0);
      const summary = vals.map((v) => `${v.e}=${v.r!.value}`).join("、");
      return `奇数球件数: ${summary}、総数は ${total} です。`;
    }
    case "compare_average_summary_only": {
      const vals = ENVS.map((e) => ({ e, r: results.find((r) => r.environment === e) }));
      if (vals.some((v) => !v.r)) return "結果の取得に失敗しました。";
      const summary = vals.map((v) => `環境${v.e}=${v.r!.value}`).join("、");
      const max = Math.max(...vals.map((v) => v.r!.value));
      const winners = vals.filter((v) => v.r!.value === max).map((v) => v.e);
      return `個別データを取得せず平均値のみで比較した結果: ${summary}。平均値が高いのは環境${winners.join("・")}(${max})です。`;
    }
    case "cross_env_conditional": {
      const threshold = 10;
      const evens = ENVS.map((e) => ({
        e,
        r: results.find((r) => r.environment === e && r.label === "偶数合計"),
      }));
      if (evens.some((v) => !v.r)) return "結果の取得に失敗しました。";

      const qualified = evens.filter((v) => v.r!.value >= threshold);

      let report = `【条件付き段階分析の結果】\n`;
      report += `第1段階 偶数合計: ${evens.map((v) => `${v.e}=${v.r!.value}`).join(", ")}\n`;
      report += `閾値判定(≥${threshold}): ${evens.map((v) => `${v.e}=${v.r!.value >= threshold ? "該当" : "非該当"}`).join(", ")}\n`;

      if (qualified.length > 0) {
        report += `第2段階 該当環境の追加分析（奇数件数）:\n`;
        for (const q of qualified) {
          const odd = results.find((r) => r.environment === q.e && r.label === "奇数件数");
          if (odd) report += `  環境${q.e} 奇数件数 = ${odd.value}\n`;
        }
      }

      const qualifiedNames = qualified.map((q) => q.e).join("・");
      report += qualifiedNames
        ? `結論: 環境${qualifiedNames}が条件を満たし、追加の詳細分析が実施されました。`
        : `結論: 条件を満たす環境がなかったため、追加分析は実施されませんでした。`;
      return report;
    }
    case "raw_request_denied":
      return "この依頼は拒否されました。各環境の個別データは共有対象外であり、取得可能なのは統計情報のみです。";
    default:
      return "不明な依頼です。サンプルシナリオからお試しください。";
  }
}
