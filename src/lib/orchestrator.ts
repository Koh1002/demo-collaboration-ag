import {
  UserIntent,
  OrchestrationStep,
  StatResult,
} from "./types";
import { environmentAValues, environmentBValues, environmentCValues } from "./data";
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
function getEnvData(env: "A" | "B" | "C"): number[] {
  if (env === "A") return environmentAValues;
  if (env === "B") return environmentBValues;
  return environmentCValues;
}

/** Compute the statistic locally inside the environment */
function computeLocal(
  intent: UserIntent,
  env: "A" | "B" | "C"
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

type EnvId = "A" | "B" | "C";
const envSpeaker = { A: "agent-a", B: "agent-b", C: "agent-c" } as const;
const envPhase = { A: "contacting_a", B: "contacting_b", C: "contacting_c" } as const;

/** Build the auth → compute → result steps for contacting one environment */
function buildEnvContactSteps(
  env: EnvId,
  intent: UserIntent,
  result: StatResult,
  logPrefix: string,
): OrchestrationStep[] {
  const request = buildSecureRequest(intent, env);
  return [
    {
      phase: envPhase[env],
      delay: D,
      log: `${logPrefix}環境${env}へ問い合わせます`,
      logType: "info",
      speaker: "orchestrator",
      orchestratorTarget: env,
      secureRequest: request,
      authSteps: [],
    },
    {
      phase: "authenticating",
      delay: D * 0.8,
      log: "認証情報を付与しました",
      logType: "auth",
      speaker: "policy",
      authSteps: buildAuthSteps(1),
    },
    {
      phase: "authenticating",
      delay: D * 0.6,
      log: "認証確認中です",
      logType: "auth",
      speaker: "policy",
      authSteps: buildAuthSteps(3),
    },
    {
      phase: "authorizing",
      delay: D * 0.8,
      log: "利用目的とスコープを確認しています",
      logType: "auth",
      speaker: "policy",
      authSteps: buildAuthSteps(4),
      secureRequest: request,
    },
    {
      phase: "authorizing",
      delay: D,
      log: "Policy判定: ALLOW",
      logType: "policy_allow",
      speaker: "policy",
      authSteps: allAuthDone(),
    },
    {
      phase: "local_computing",
      delay: D * 1.5,
      log: "ローカル計算を開始しました",
      logType: "info",
      speaker: envSpeaker[env],
    },
    {
      phase: envPhase[env],
      delay: D,
      log: `統計結果: ${result.label} = ${result.value}`,
      logType: "result",
      speaker: envSpeaker[env],
      statResult: result,
    },
  ];
}

/**
 * Generate the full orchestration step sequence for ALLOW scenarios.
 * Flow: submit → plan → auth A → compute A → auth B → compute B → auth C → compute C → evaluate → complete
 */
function buildAllowSteps(intent: UserIntent): OrchestrationStep[] {
  const resultA = computeLocal(intent, "A");
  const resultB = computeLocal(intent, "B");
  const resultC = computeLocal(intent, "C");

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
      speaker: "orchestrator",
      orchestratorTarget: "center",
    },
    {
      phase: "planning",
      delay: D,
      log: "依頼内容を解析しています",
      logType: "info",
      speaker: "orchestrator",
    },
    {
      phase: "planning",
      delay: D * 1.2,
      log: `集計依頼「${skillLabel}」に変換しました`,
      logType: "info",
      speaker: "orchestrator",
    },

    // --- Contact A, B, C ---
    ...buildEnvContactSteps("A", intent, resultA, ""),
    ...buildEnvContactSteps("B", intent, resultB, "続いて"),
    ...buildEnvContactSteps("C", intent, resultC, "続いて"),

    // --- Evaluate & Complete ---
    {
      phase: "evaluating",
      delay: D,
      log: "結果を比較・統合しています",
      logType: "info",
      speaker: "platform",
      orchestratorTarget: "pf",
    },
    {
      phase: "completed",
      delay: D,
      log: "処理が完了しました",
      logType: "info",
      speaker: "orchestrator",
      orchestratorTarget: "center",
    },
  ];
}

/**
 * Generate orchestration steps for the cross-environment conditional scenario.
 * Flow:
 *   Round 1 — query A, B, C for even sum
 *   Evaluate — check which environments meet the threshold (≥ 10)
 *   Round 2 — additional analysis (odd count) only for qualifying environments
 *   Final integration
 */
function buildConditionalSteps(): OrchestrationStep[] {
  const threshold = 10;

  // Round 1 computations
  const evenSums: Record<EnvId, number> = {
    A: sumEven(getEnvData("A")),
    B: sumEven(getEnvData("B")),
    C: sumEven(getEnvData("C")),
  };
  const qualifies: Record<EnvId, boolean> = {
    A: evenSums.A >= threshold,
    B: evenSums.B >= threshold,
    C: evenSums.C >= threshold,
  };

  const steps: OrchestrationStep[] = [
    // --- Submit & Plan ---
    {
      phase: "submitted",
      delay: D,
      log: "ユーザー依頼を受け付けました",
      logType: "info",
      speaker: "orchestrator",
      orchestratorTarget: "center",
    },
    {
      phase: "planning",
      delay: D,
      log: "依頼内容を解析しています",
      logType: "info",
      speaker: "orchestrator",
    },
    {
      phase: "planning",
      delay: D * 1.2,
      log: `条件付き段階分析: まず偶数合計を取得し、閾値(${threshold})判定後に追加分析を実行します`,
      logType: "info",
      speaker: "orchestrator",
    },
  ];

  // --- Round 1: Query all environments for even sum ---
  for (const env of ["A", "B", "C"] as EnvId[]) {
    const result: StatResult = { environment: env, label: "偶数合計", value: evenSums[env] };
    steps.push(...buildEnvContactSteps(env, "compare_even_sum", result, "【第1段階】"));
  }

  // --- Threshold evaluation ---
  const qualifiedList = (["A", "B", "C"] as EnvId[]).filter((e) => qualifies[e]);
  const judgmentParts = (["A", "B", "C"] as EnvId[])
    .map((e) => `${e}=${evenSums[e]} ${qualifies[e] ? "≥" : "<"} ${threshold}`)
    .join(", ");

  steps.push(
    {
      phase: "evaluating",
      delay: D,
      log: `閾値判定: ${judgmentParts}`,
      logType: "info",
      speaker: "orchestrator",
      orchestratorTarget: "pf",
    },
    {
      phase: "evaluating",
      delay: D,
      log: qualifiedList.length > 0
        ? `環境${qualifiedList.join("・")}が条件を満たしました。追加分析を実行します`
        : "条件を満たす環境はありません。分析を終了します",
      logType: "result",
      speaker: "orchestrator",
    },
  );

  // --- Round 2: Additional analysis for qualifying environments ---
  for (const env of qualifiedList) {
    const oddCount = countOdd(getEnvData(env));
    const result: StatResult = { environment: env, label: "奇数件数", value: oddCount };
    const request = buildSecureRequest("count_odd_total", env);
    steps.push(
      {
        phase: envPhase[env],
        delay: D,
        log: `【第2段階】環境${env}へ追加分析（奇数件数）を問い合わせます`,
        logType: "info",
        speaker: "orchestrator",
        orchestratorTarget: env,
        secureRequest: request,
        authSteps: [],
      },
      {
        phase: "authenticating",
        delay: D * 0.8,
        log: "認証情報を付与しました",
        logType: "auth",
        speaker: "policy",
        authSteps: buildAuthSteps(1),
      },
      {
        phase: "authenticating",
        delay: D * 0.6,
        log: "認証確認中です",
        logType: "auth",
        speaker: "policy",
        authSteps: buildAuthSteps(3),
      },
      {
        phase: "authorizing",
        delay: D * 0.8,
        log: "利用目的とスコープを確認しています",
        logType: "auth",
        speaker: "policy",
        authSteps: buildAuthSteps(4),
        secureRequest: request,
      },
      {
        phase: "authorizing",
        delay: D,
        log: "Policy判定: ALLOW",
        logType: "policy_allow",
        speaker: "policy",
        authSteps: allAuthDone(),
      },
      {
        phase: "local_computing",
        delay: D * 1.5,
        log: "追加のローカル計算を開始しました",
        logType: "info",
        speaker: envSpeaker[env],
      },
      {
        phase: envPhase[env],
        delay: D,
        log: `追加統計結果: 奇数件数 = ${oddCount}`,
        logType: "result",
        speaker: envSpeaker[env],
        statResult: result,
      },
    );
  }

  // --- Final integration ---
  steps.push(
    {
      phase: "evaluating",
      delay: D,
      log: "全段階の結果を統合しています",
      logType: "info",
      speaker: "platform",
      orchestratorTarget: "pf",
    },
    {
      phase: "completed",
      delay: D,
      log: "条件付き段階分析が完了しました",
      logType: "info",
      speaker: "orchestrator",
      orchestratorTarget: "center",
    },
  );

  return steps;
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
      speaker: "orchestrator",
      orchestratorTarget: "center",
    },
    {
      phase: "planning",
      delay: D,
      log: "依頼内容を解析しています",
      logType: "info",
      speaker: "orchestrator",
    },
    {
      phase: "planning",
      delay: D,
      log: "raw data の取得要求を検知しました",
      logType: "error",
      speaker: "orchestrator",
    },
    {
      phase: "authenticating",
      delay: D * 0.8,
      log: "認証情報を付与しました",
      logType: "auth",
      speaker: "policy",
      authSteps: buildAuthSteps(1),
      orchestratorTarget: "A",
    },
    {
      phase: "authenticating",
      delay: D * 0.6,
      log: "認証確認中です",
      logType: "auth",
      speaker: "policy",
      authSteps: buildAuthSteps(3),
    },
    {
      phase: "authorizing",
      delay: D * 0.8,
      log: "利用目的とスコープを確認しています",
      logType: "auth",
      speaker: "policy",
      authSteps: buildAuthSteps(4),
      secureRequest: requestA,
    },
    {
      phase: "denied",
      delay: D,
      log: "Policy判定: DENY",
      logType: "policy_deny",
      speaker: "policy",
      authSteps: allAuthDone(),
    },
    {
      phase: "denied",
      delay: D * 0.8,
      log: "理由: raw_data_request_not_permitted",
      logType: "policy_deny",
      speaker: "policy",
    },
    {
      phase: "denied",
      delay: D,
      log: "この依頼は拒否されました。取得可能なのは統計情報のみです",
      logType: "error",
      speaker: "orchestrator",
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
  if (intent === "cross_env_conditional") {
    return buildConditionalSteps();
  }
  if (intent === "unknown") {
    return [
      {
        phase: "submitted",
        delay: D,
        log: "ユーザー依頼を受け付けました",
        logType: "info",
        speaker: "orchestrator",
        orchestratorTarget: "center",
      },
      {
        phase: "error",
        delay: D,
        log: "依頼内容を解釈できませんでした。サンプルシナリオをお試しください。",
        logType: "error",
        speaker: "orchestrator",
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
