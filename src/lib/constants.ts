// ============================================================
// Shared constants
// ============================================================

/** Auth check sequence labels displayed during authentication */
export const AUTH_CHECK_LABELS = [
  "Credential attached",
  "mTLS check",
  "Agent identity verified",
  "purpose_code checked",
  "Policy evaluation running",
] as const;

/** Default step delay for orchestration animations (ms) */
export const DEFAULT_STEP_DELAY = 1100;

/** Colors used across the app — Google-inspired palette */
export const COLORS = {
  blue: {
    50: "#e8f0fe",
    100: "#d2e3fc",
    200: "#aecbfa",
    400: "#669df6",
    500: "#4285f4",
    600: "#1a73e8",
    700: "#1967d2",
  },
  green: {
    50: "#e6f4ea",
    100: "#ceead6",
    200: "#a8dab5",
    400: "#5bb974",
    500: "#34a853",
    600: "#1e8e3e",
    700: "#188038",
  },
  yellow: {
    50: "#fef7e0",
    100: "#feefc3",
    200: "#fdd663",
    400: "#f9ab00",
    500: "#fbbc04",
    600: "#f29900",
    700: "#e37400",
  },
  red: {
    50: "#fce8e6",
    100: "#fad2cf",
    200: "#f6aea9",
    400: "#ee675c",
    500: "#ea4335",
    600: "#d93025",
    700: "#c5221f",
  },
  gray: {
    50: "#f8f9fa",
    100: "#f1f3f4",
    200: "#e8eaed",
    300: "#dadce0",
    400: "#bdc1c6",
    500: "#9aa0a6",
    600: "#80868b",
    700: "#5f6368",
    800: "#3c4043",
    900: "#202124",
  },
} as const;
