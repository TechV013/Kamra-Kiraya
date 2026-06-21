"use client";

import React from "react";
import { Clock, AlertCircle, CheckCircle, RotateCcw, XCircle, ArrowUpCircle } from "lucide-react";

interface StatusEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  changedById: string;
  createdAt: string;
  changedBy: { id: string; name: string; role: string };
}

interface Props {
  history: StatusEntry[];
  className?: string;
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  OPEN: AlertCircle,
  IN_PROGRESS: RotateCcw,
  ESCALATED: ArrowUpCircle,
  RESOLVED: CheckCircle,
  CLOSED: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
  IN_PROGRESS: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  ESCALATED: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
  RESOLVED: "text-green-500 bg-green-50 dark:bg-green-900/20",
  CLOSED: "text-gray-500 bg-gray-50 dark:bg-gray-900/20",
};

export default function ComplaintTimeline({ history, className = "" }: Props) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-semibold text-lg">Status Timeline</h3>
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
        <ul className="space-y-4">
          {history.map((entry) => {
            const Icon = STATUS_ICONS[entry.toStatus] || Clock;
            const colorClass = STATUS_COLORS[entry.toStatus] || "text-gray-500 bg-gray-50 dark:bg-gray-800";
            return (
              <li key={entry.id} className="relative pl-10">
                <div className={`absolute left-2.5 p-1.5 rounded-full ${colorClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium">{entry.changedBy.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Status changed from <span className="font-medium">{entry.fromStatus || "—"}</span>{" "}
                    to <span className="font-medium">{entry.toStatus}</span>
                  </p>
                  {entry.note && (
                    <p className="text-sm mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded italic">
                      "{entry.note}"
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
