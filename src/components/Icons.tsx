"use client";

/**
 * Custom SVG icons for the multi-agent demo.
 * Replaces emoji to maintain a clean, professional look.
 */

interface IconProps {
  size?: number;
  className?: string;
}

/** Orchestrator — hub/brain icon */
export function OrchestratorIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Central hub */}
      <circle cx="12" cy="12" r="4" fill="#4285f4" opacity="0.15" />
      <circle cx="12" cy="12" r="4" stroke="#4285f4" strokeWidth="1.5" fill="none" />
      {/* Radiating connections */}
      <line x1="12" y1="4" x2="12" y2="8" stroke="#4285f4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="16" x2="12" y2="20" stroke="#4285f4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="12" x2="8" y2="12" stroke="#4285f4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="12" x2="20" y2="12" stroke="#4285f4" strokeWidth="1.5" strokeLinecap="round" />
      {/* Outer dots */}
      <circle cx="12" cy="3" r="1.5" fill="#4285f4" />
      <circle cx="12" cy="21" r="1.5" fill="#4285f4" />
      <circle cx="3" cy="12" r="1.5" fill="#4285f4" />
      <circle cx="21" cy="12" r="1.5" fill="#4285f4" />
    </svg>
  );
}

/** Agent — shield with check mark */
export function AgentIcon({ size = 20, color = "#34a853", className = "" }: IconProps & { color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.4 4.6-1.25 8-6.15 8-11.4V6l-8-4z"
        fill={`${color}15`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polyline points="9,12 11,14 15,10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** Lock — data protection indicator */
export function LockIcon({ size = 12, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/** Cloud/Platform icon */
export function PlatformIcon({ size = 22, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M18 10h-1.26A7 7 0 1 0 5 14h13a4 4 0 0 0 0-8z"
        fill="#4285f420"
        stroke="#4285f4"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Small signal lines */}
      <line x1="8" y1="18" x2="8" y2="21" stroke="#4285f4" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="#4285f4" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <line x1="16" y1="18" x2="16" y2="20" stroke="#4285f4" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** Chart/Stats icon for results */
export function StatsIcon({ size = 12, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
