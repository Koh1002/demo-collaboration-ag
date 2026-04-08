import {
  UserIntent,
  OrchestrationStep,
  StatResult,
} from "./types";
import { environmentAValues, environmentBValues } from "./data";
import { buildSecureRequest } from "./policy";
import { AUTH_CHECK_LABELS, DEFAULT_STEP_DELAY } from "./constants";

// ============================================================
// Local computation functions (run inside each environment)
// These never expose raw values — only aggregated statistics.
// TODO: Replace with real agent RPC / A2A calls in production
// ============================================================

function sumEven(values: number[]): number {
  return values.filter((v) => v % 2 === 0).reduce((s, v) => s + v, 0);
}

function countOdd(values: number[]): number {
  return values.filter((v) => v % 2 !== 0).length;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((s, v) => s + v, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/** Get the internal data for a given environment */
function getEnvData(env: "A" | "B"): number[] {
  return env === "A" ? environmentAValues : environmentBValues;
}

/** Compute the statistic locally inside the environment */
function computeLocal(
  intent: UserIntent,
  env: "A" | "B"
): StatResult {
  const data = getEnvData(env);
  switch (intent) {
    case "compare_even_sum":
      return { environment: env, label: "偶数合計", value: sumEven(data) };
    case "count_odd_total":
      return { environment: env, label: "奇数件数", value: countOdd(data) };
    case "compare_average_summary_only":
      return { environment: env, label: "平均値", value: average(data) };
    default:
      return { environment: env, label: "N/A", value: 0 };
  }
}

// ============================================================
// Auth step helpers
// ============================================================

function buildAuthSteps(upTo: number) {
  return AUTH_CHECK_LABELS.map((label, i) => ({
    label,
    done: i < upTo,
  }));
}

function allAuthDone() {
  return AUTH_CHECK_LABELS.map((label) => ({ label, done: true }));
}

// ============================================================
// Step generation per scenario
// ============================================================

const D = DEFAULT_STEP_DELAY;

/**
 * Generate the full orchestration step sequence for ALLOW scenarios.
 * Flow: submit → plan → auth A → compute A → auth B → compute B → evaluate → complete
 */
function buildAllowSteps(intent: UserIntent): OrchestrationStep[] {
  const requestA = buildSecureRequest(intent, "A");
  const requestB = buildSecureRequest(intent, "B");
  const resultA = computeLocal(intent, "A");
  const resultB = computeLocal(intent, "B");

  const skillLabel =
    intent === "compare_even_sum"
      ? "偶数合計の算出"
      : intent === "count_odd_total"
        ? "奇数件数のカウント"
        : "平均値の算出";

  return [
    // --- Submit & Plan ---
    {
      phase: "submitted",
      delay: D,
      log: "ユーザー依頼を受け付けました",
      logType: "info",
      orchestratorTarget: "center",
    },
    {
      phase: "planning",
      delay: D,
      log: "依頼内容を解析しています",
      logType: "info",
    },
    {
      phase: "planning",
      delay: D * 1.2,
      log: `集計依頼「${skillLabel}」に変換しました`,
      logType: "info",
    },

    // --- Contact A ---
    {
      phase: "contacting_a",
      delay: D,
      log: "環境Aへ問い合わせを開始します",
      logType: "info",
      orchestratorTarget: "A",
    },
    {
      phase: "authenticating",
      delay: D * 0.8,
      log: "認証情報を付与しました",
      logType: "auth",
      authSteps: buildAuthSteps(1),
    },
    {
      phase: "authenticating",
      delay: D * 0.6,
      log: "認証確認中です",
      logType: "auth",
      authSteps: buildAuthSteps(3),
    },
    {
      phase: "authorizing",
      delay: D * 0.8,
      log: "利用目的とスコープを確認しています",
      logType: "auth",
      authSteps: buildAuthSteps(4),
      secureRequest: requestA,
    },
    {
      phase: "authorizing",
      delay: D,
      log: "Policy判定: ALLOW",
      logType: "policy_allow",
      authSteps: allAuthDone(),
    },
    {
      phase: "local_computing",
      delay: D * 1.5,
      log: "A代表エージェントがローカル計算を開始しました",
      logType: "info",
    },
    {
      phase: "contacting_a",
      delay: D,
      log: `Aから統計結果を受領しました（${resultA.label}: ${resultA.value}）`,
      logType: "result",
      statResult: resultA,
    },

    // --- Contact B ---
    {
      phase: "contacting_b",
      delay: D,
      log: "続いて環境Bへ問い合わせます",
      logType: "info",
      orchestratorTarget: "B",
    },
    {
      phase: "authenticating",
      delay: D * 0.8,
      log: "認証情報を付与しました",
      logType: "auth",
      authSteps: buildAuthSteps(1),
    },
    {
      phase: "authenticating",
      delay: D * 0.6,
      log: "認証確認中です",
      logType: "auth",
      authSteps: buildAuthSteps(3),
    },
    {
      phase: "authorizing",
      delay: D * 0.8,
      log: "利用目的とスコープを確認しています",
      logType: "auth",
      authSteps: buildAuthSteps(4),
      secureRequest: requestB,
    },
    {
      phase: "authorizing",
      delay: D,
      log: "Policy判定: ALLOW",
      logType: "policy_allow",
      authSteps: allAuthDone(),
    },
    {
      phase: "local_computing",
      delay: D * 1.5,
      log: "B代表エージェントがローカル計算を開始しました",
      logType: "info",
    },
    {
      phase: "contacting_b",
      delay: D,
      log: `Bから統計結果を受領しました（${resultB.label}: ${resultB.value}）`,
      logType: "result",
      statResult: resultB,
    },

    // --- Evaluate & Complete ---
    {
      phase: "evaluating",
      delay: D,
      log: "結果を比較・統合しています",
      logType: "info",
      orchestratorTarget: "pf",
    },
    {
      phase: "completed",
      delay: D,
      log: "処理が完了しました",
      logType: "info",
      orchestratorTarget: "center",
    },
  ];
}

/**
 * Generate orchestration steps for DENY scenario.
 */
function buildDenySteps(): OrchestrationStep[] {
  const requestA = buildSecureRequest("raw_request_denied", "A");

  return [
    {
      phase: "submitted",
      delay: D,
      log: "ユーザー依頼を受け付けました",
      logType: "info",
      orchestratorTarget: "center",
    },
    {
      phase: "planning",
      delay: D,
      log: "依頼内容を解析しています",
      logType: "info",
    },
    {
      phase: "planning",
      delay: D,
      log: "raw data の取得要求を検知しました",
      logType: "error",
    },
    {
      phase: "authenticating",
      delay: D * 0.8,
      log: "認証情報を付与しました",
      logType: "auth",
      authSteps: buildAuthSteps(1),
      orchestratorTarget: "A",
    },
    {
      phase: "authenticating",
      delay: D * 0.6,
      log: "認証確認中です",
      logType: "auth",
      authSteps: buildAuthSteps(3),
    },
    {
      phase: "authorizing",
      delay: D * 0.8,
      log: "利用目的とスコープを確認しています",
      logType: "auth",
      authSteps: buildAuthSteps(4),
      secureRequest: requestA,
    },
    {
      phase: "denied",
      delay: D,
      log: "Policy判定: DENY",
      logType: "policy_deny",
      authSteps: allAuthDone(),
    },
    {
      phase: "denied",
      delay: D * 0.8,
      log: "理由: raw_data_request_not_permitted",
      logType: "policy_deny",
    },
    {
      phase: "denied",
      delay: D,
      log: "この依頼は拒否されました。取得可能なのは統計情報のみです",
      logType: "error",
      orchestratorTarget: "center",
    },
  ];
}

// ============================================================
// Public API
// ============================================================

/**
 * Generate the full orchestration step list for a given intent.
 */
export function generateSteps(intent: UserIntent): OrchestrationStep[] {
  if (intent === "raw_request_denied") {
    return buildDenySteps();
  }
  if (intent === "unknown") {
    return [
      {
        phase: "submitted",
        delay: D,
        log: "ユーザー依頼を受け付けました",
        logType: "info",
        orchestratorTarget: "center",
      },
      {
        phase: "error",
        delay: D,
        log: "依頼内容を解釈できませんでした。サンプルシナリオをお試しください。",
        logType: "error",
      },
    ];
  }
  return buildAllowSteps(intent);
}

/**
 * Collect all StatResults embedded in steps.
 */
export function collectResults(steps: OrchestrationStep[]): StatResult[] {
  return steps
    .filter((s): s is OrchestrationStep & { statResult: StatResult } =>
      s.statResult !== undefined
    )
    .map((s) => s.statResult);
}
