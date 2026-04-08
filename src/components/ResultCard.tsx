"use client";

import { motion } from "framer-motion";
import { StatResult } from "@/lib/types";

interface ResultCardProps {
  result: StatResult;
}

export default function ResultCard({ result }: ResultCardProps) {
  const envColor =
    result.environment === "A"
      ? "border-green-300 bg-green-50"
      : "border-amber-300 bg-amber-50";
  const textColor =
    result.environment === "A" ? "text-green-700" : "text-amber-700";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${envColor}`}
    >
      <span className={`font-bold ${textColor}`}>
        環境{result.environment}
      </span>
      <span className="text-gray-600">
        {result.label}: <strong className="text-gray-800">{result.value}</strong>
      </span>
    </motion.div>
  );
}
