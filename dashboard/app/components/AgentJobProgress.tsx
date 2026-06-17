"use client";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | string;

export function jobProgressValue(status: JobStatus): number {
  switch (status) {
    case "PENDING":
      return 12;
    case "PROCESSING":
      return 58;
    case "COMPLETED":
      return 100;
    case "FAILED":
      return 100;
    default:
      return 0;
  }
}

export function jobProgressColor(status: JobStatus): string {
  switch (status) {
    case "COMPLETED":
      return "var(--accent-green)";
    case "FAILED":
      return "var(--accent-red)";
    case "PROCESSING":
      return "var(--accent-cyan)";
    default:
      return "var(--accent-amber)";
  }
}

export function jobStatusLabel(status: JobStatus): string {
  switch (status) {
    case "PENDING":
      return "Queued";
    case "PROCESSING":
      return "Working";
    case "COMPLETED":
      return "Done";
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
}

export default function AgentJobProgress({
  status,
  task,
  compact = false,
}: {
  status: JobStatus;
  task?: string;
  compact?: boolean;
}) {
  const pct = jobProgressValue(status);
  const color = jobProgressColor(status);
  const pulsing = status === "PROCESSING" || status === "PENDING";

  return (
    <div style={{ marginTop: compact ? 6 : 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontSize: compact ? 8 : 9,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color,
            fontWeight: 600,
          }}
        >
          {jobStatusLabel(status)}
        </span>
        {!compact && task && (
          <span
            style={{
              fontSize: 9,
              color: "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              textAlign: "right",
            }}
          >
            {task.slice(0, 48)}
          </span>
        )}
      </div>
      <div
        style={{
          height: compact ? 3 : 4,
          borderRadius: 99,
          backgroundColor: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          className={pulsing ? "agent-job-bar-pulse" : undefined}
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 99,
            backgroundColor: color,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
