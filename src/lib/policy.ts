import { PolicyDecision, RequestedScope, SecureRequest, UserIntent } from "./types";
import { agents } from "./data";

// ============================================================
// Policy Engine (simulated)
// TODO: Replace with real policy engine / OPA in production
// ============================================================

interface PolicyResult {
  decision: PolicyDecision;
  deny_reason?: string;
}

/**
 * Evaluate policy for a given scope.
 * - summary_only → ALLOW
 * - raw_values   → DENY
 */
export function evaluatePolicy(scope: RequestedScope): PolicyResult {
  if (scope === "raw_values") {
    return {
      decision: "DENY",
      deny_reason: "raw_data_request_not_permitted",
    };
  }
  return { decision: "ALLOW" };
}

/** Determine the requested scope based on intent */
export function intentToScope(intent: UserIntent): RequestedScope {
  if (intent === "raw_request_denied") return "raw_values";
  return "summary_only";
}

/** Map intent to the skill name used in the secure request card */
export function intentToSkill(intent: UserIntent): string {
  switch (intent) {
    case "compare_even_sum":
      return "sum_even_numbers";
    case "count_odd_total":
      return "count_odd_numbers";
    case "compare_average_summary_only":
      return "average_all_numbers";
    case "raw_request_denied":
      return "get_raw_numbers";
    default:
      return "unknown_skill";
  }
}

/** Map intent to purpose_code */
export function intentToPurposeCode(intent: UserIntent): string {
  if (intent === "raw_request_denied") return "raw_inspection";
  return "aggregate_analysis";
}

/** Build a SecureRequest metadata object for a given target */
export function buildSecureRequest(
  intent: UserIntent,
  target: "A" | "B"
): SecureRequest {
  const scope = intentToScope(intent);
  const policy = evaluatePolicy(scope);
  return {
    requester: agents.orchestrator.id,
    target: target === "A" ? agents.agentA.id : agents.agentB.id,
    skill: intentToSkill(intent),
    purpose_code: intentToPurposeCode(intent),
    requested_scope: scope,
    policy_decision: policy.decision,
    deny_reason: policy.deny_reason,
  };
}
