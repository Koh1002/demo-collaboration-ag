"use client";

import { motion } from "framer-motion";
import { AuthStep, SecureRequest } from "@/lib/types";
import PolicyStatusBadge from "./PolicyStatusBadge";

interface SecureRequestCardProps {
  request: SecureRequest;
  authSteps: AuthStep[];
}

export default function SecureRequestCard({
  request,
  authSteps,
}: SecureRequestCardProps) {
  const isDeny = request.policy_decision === "DENY";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border shadow-sm p-4 text-sm ${
        isDeny
          ? "border-red-200 bg-red-50/50"
          : "border-green-200 bg-green-50/30"
      }`}
    >
      {/* Auth check steps */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {authSteps.map((step, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
              step.done
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {step.done ? "✓" : "○"} {step.label}
          </span>
        ))}
      </div>

      {/* Request metadata */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <MetaRow label="requester" value={request.requester} />
        <MetaRow label="target" value={request.target} />
        <MetaRow label="skill" value={request.skill} />
        <MetaRow label="purpose_code" value={request.purpose_code} />
        <MetaRow label="requested_scope" value={request.requested_scope} />
      </div>

      {/* Policy decision */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-500">policy_decision:</span>
        <PolicyStatusBadge decision={request.policy_decision} />
      </div>

      {request.deny_reason && (
        <div className="mt-2 text-xs text-red-600 bg-red-100 rounded px-2 py-1">
          deny_reason: {request.deny_reason}
        </div>
      )}
    </motion.div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-gray-400 font-mono">{label}</span>
      <span className="text-gray-700 font-mono truncate">{value}</span>
    </>
  );
}
