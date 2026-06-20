import { Shield, Clock, Eye, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  UNDER_REVIEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  VERIFIED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-3.5 h-3.5" />,
  UNDER_REVIEW: <Eye className="w-3.5 h-3.5" />,
  VERIFIED: <CheckCircle className="w-3.5 h-3.5" />,
  REJECTED: <XCircle className="w-3.5 h-3.5" />,
};

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

export default function VerificationBadge({
  status,
  size = "md",
}: {
  status: string | null;
  size?: "sm" | "md" | "lg";
}) {
  if (!status) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400`}>
        <AlertTriangle className="w-3 h-3" />
        Not Submitted
      </span>
    );
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : size === "lg" ? "px-4 py-2 text-sm" : "px-2.5 py-1 text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses} ${STYLES[status] || STYLES.PENDING}`}>
      {ICONS[status] || <Shield className="w-3.5 h-3.5" />}
      {LABELS[status] || status}
    </span>
  );
}
