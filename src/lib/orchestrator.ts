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

    // --- Contact A ---
    {
      phase: "contacting_a",
      delay: D,
      log: "環境Aへ問い合わせを開始します",
      logType: "info",
      speaker: "orchestrator",
      orchestratorTarget: "A",
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
      secureRequest: requestA,
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
      speaker: "agent-a",
    },
    {
      phase: "contacting_a",
      delay: D,
      log: `統計結果: ${resultA.label} = ${resultA.value}`,
      logType: "result",
      speaker: "agent-a",
      statResult: resultA,
    },

    // --- Contact B ---
    {
      phase: "contacting_b",
      delay: D,
      log: "続いて環境Bへ問い合わせます",
      logType: "info",
      speaker: "orchestrator",
      orchestratorTarget: "B",
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
      secureRequest: requestB,
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
      speaker: "agent-b",
    },
    {
      phase: "contacting_b",
      delay: D,
      log: `統計結果: ${resultB.label} = ${resultB.value}`,
      logType: "result",
      speaker: "agent-b",
      statResult: resultB,
    },

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
 *   Round 1 — query A & B for even sum
 *   Evaluate — check which environments meet the threshold (≥ 10)
 *   Round 2 — additional analysis (odd count) only for qualifying environments
 *   Final integration
 */
function buildConditionalSteps(): OrchestrationStep[] {
  const threshold = 10;

  // Round 1 computations
  const evenSumA = sumEven(getEnvData("A"));
  const evenSumB = sumEven(getEnvData("B"));
  const aQualifies = evenSumA >= threshold;
  const bQualifies = evenSumB >= threshold;

  // Secure requests for round 1 (even sum)
  const reqA1 = buildSecureRequest("compare_even_sum", "A");
  const reqB1 = buildSecureRequest("compare_even_sum", "B");

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

    // --- Round 1: Contact A for even sum ---
    {
      phase: "contacting_a",
      delay: D,
      log: "【第1段階】環境Aへ偶数合計を問い合わせます",
      logType: "info",
      speaker: "orchestrator",
      orchestratorTarget: "A",
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
      secureRequest: reqA1,
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
      speaker: "agent-a",
    },
    {
      phase: "contacting_a",
      delay: D,
      log: `統計結果: 偶数合計 = ${evenSumA}`,
      logType: "result",
      speaker: "agent-a",
      statResult: { environment: "A", label: "偶数合計", value: evenSumA },
    },

    // --- Round 1: Contact B for even sum ---
    {
      phase: "contacting_b",
      delay: D,
      log: "【第1段階】環境Bへ偶数合計を問い合わせます",
      logType: "info",
      speaker: "orchestrator",
      orchestratorTarget: "B",
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
      secureRequest: reqB1,
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
      speaker: "agent-b",
    },
    {
      phase: "contacting_b",
      delay: D,
      log: `統計結果: 偶数合計 = ${evenSumB}`,
      logType: "result",
      speaker: "agent-b",
      statResult: { environment: "B", label: "偶数合計", value: evenSumB },
    },

    // --- Threshold evaluation ---
    {
      phase: "evaluating",
      delay: D,
      log: `閾値判定: A=${evenSumA} ${aQualifies ? "≥" : "<"} ${threshold}, B=${evenSumB} ${bQualifies ? "≥" : "<"} ${threshold}`,
      logType: "info",
      speaker: "orchestrator",
      orchestratorTarget: "pf",
    },
    {
      phase: "evaluating",
      delay: D,
      log: aQualifies && bQualifies
        ? "両環境が条件を満たしました。追加分析を実行します"
        : aQualifies
          ? "環境Aのみ条件を満たしました。Aの追加分析を実行します"
          : bQualifies
            ? "環境Bのみ条件を満たしました。Bの追加分析を実行します"
            : "条件を満たす環境はありません。分析を終了します",
      logType: "result",
      speaker: "orchestrator",
    },
  ];

  // --- Round 2: Additional analysis for qualifying environments ---
  if (aQualifies) {
    const oddCountA = countOdd(getEnvData("A"));
    const reqA2 = buildSecureRequest("count_odd_total", "A");
    steps.push(
      {
        phase: "contacting_a",
        delay: D,
        log: "【第2段階】環境Aへ追加分析（奇数件数）を問い合わせます",
        logType: "info",
        speaker: "orchestrator",
        orchestratorTarget: "A",
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
        secureRequest: reqA2,
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
        speaker: "agent-a",
      },
      {
        phase: "contacting_a",
        delay: D,
        log: `追加統計結果: 奇数件数 = ${oddCountA}`,
        logType: "result",
        speaker: "agent-a",
        statResult: { environment: "A", label: "奇数件数", value: oddCountA },
      },
    );
  }

  if (bQualifies) {
    const oddCountB = countOdd(getEnvData("B"));
    const reqB2 = buildSecureRequest("count_odd_total", "B");
    steps.push(
      {
        phase: "contacting_b",
        delay: D,
        log: "【第2段階】環境Bへ追加分析（奇数件数）を問い合わせます",
        logType: "info",
        speaker: "orchestrator",
        orchestratorTarget: "B",
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
        secureRequest: reqB2,
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
        speaker: "agent-b",
      },
      {
        phase: "contacting_b",
        delay: D,
        log: `追加統計結果: 奇数件数 = ${oddCountB}`,
        logType: "result",
        speaker: "agent-b",
        statResult: { environment: "B", label: "奇数件数", value: oddCountB },
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
