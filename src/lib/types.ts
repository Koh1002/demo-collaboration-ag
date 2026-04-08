// ============================================================
// Core types for the multi-agent orchestration demo
// ============================================================

/** Application-wide phase states */
export type AppPhase =
  | "idle"
  | "submitted"
  | "planning"
  | "authenticating"
  | "authorizing"
  | "contacting_a"
  | "contacting_b"
  | "local_computing"
  | "evaluating"
  | "completed"
  | "denied"
  | "error";

/** Japanese labels for each phase */
export const PHASE_LABELS: Record<AppPhase, string> = {
  idle: "待機中",
  submitted: "依頼受付",
  planning: "計画中",
  authenticating: "認証中",
  authorizing: "認可判定中",
  contacting_a: "Aへ問い合わせ中",
  contacting_b: "Bへ問い合わせ中",
  local_computing: "ローカル計算中",
  evaluating: "評価中",
  completed: "完了",
  denied: "拒否",
  error: "エラー",
};

/** Parsed user intent categories */
export type UserIntent =
  | "compare_even_sum"
  | "count_odd_total"
  | "compare_average_summary_only"
  | "raw_request_denied"
  | "unknown";

/** Policy decision outcome */
export type PolicyDecision = "ALLOW" | "DENY";

/** Scope of the data request */
export type RequestedScope = "summary_only" | "raw_values";

/** Metadata for an agent-to-agent request card */
export interface SecureRequest {
  requester: string;
  target: string;
  skill: string;
  purpose_code: string;
  requested_scope: RequestedScope;
  policy_decision: PolicyDecision;
  deny_reason?: string;
}

/** Auth check steps shown in sequence */
export interface AuthStep {
  label: string;
  done: boolean;
}

/** A single event log entry */
export interface EventLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: "info" | "auth" | "policy_allow" | "policy_deny" | "result" | "error";
}

/** Chat message in the left panel */
export interface ChatMessage {
  id: string;
  role: "user" | "system" | "orchestrator";
  content: string;
  timestamp: number;
}

/** Statistical result returned by an environment agent */
export interface StatResult {
  environment: "A" | "B";
  label: string;
  value: number;
}

/** A sample scenario for quick execution */
export interface Scenario {
  id: string;
  label: string;
  input: string;
  intent: UserIntent;
}

/** Position of the orchestrator node for animation */
export interface OrchestratorPosition {
  x: number;
  y: number;
}

/** Who is "speaking" a log message in the graph visualization */
export type BubbleSpeaker =
  | "orchestrator"
  | "agent-a"
  | "agent-b"
  | "platform"
  | "policy";

/** A speech bubble displayed on the graph */
export interface Bubble {
  id: string;
  speaker: BubbleSpeaker;
  message: string;
  type: EventLogEntry["type"];
  timestamp: number;
}

/** Orchestration step for sequential execution */
export interface OrchestrationStep {
  phase: AppPhase;
  delay: number; // ms to wait before this step
  log?: string;
  logType?: EventLogEntry["type"];
  speaker?: BubbleSpeaker;
  chatMessage?: string;
  secureRequest?: SecureRequest;
  authSteps?: AuthStep[];
  statResult?: StatResult;
  orchestratorTarget?: "center" | "A" | "B" | "pf";
}
