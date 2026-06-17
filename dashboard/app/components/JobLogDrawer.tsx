"use client";

import { useEffect, useState } from "react";
import { useJobLog } from "./JobLogContext";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "var(--accent-amber)",
  PROCESSING: "var(--accent-cyan)",
  COMPLETED: "var(--accent-green)",
  FAILED: "var(--accent-red)",
};

function statusLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export default function JobLogDrawer() {
  const { jobs, open, selectedJobId, closeDrawer, selectJob, refreshJobs } = useJobLog();
  const selected = jobs.find((j) => j.id === selectedJobId) ?? jobs[0] ?? null;
  const [detail, setDetail] = useState<typeof selected>(selected);

  useEffect(() => {
    if (!open) return;
    void refreshJobs();
  }, [open, refreshJobs]);

  useEffect(() => {
    setDetail(selected);
    if (!selected?.id) return;
    fetch(`/api/jobs/${selected.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.job) setDetail(d.job);
      })
      .catch(() => {});
  }, [selected?.id]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="mo-drawer-backdrop"
        aria-label="Close job log"
        onClick={closeDrawer}
      />
      <aside className="mo-job-drawer" role="dialog" aria-labelledby="job-drawer-title">
        <header className="mo-job-drawer-header">
          <div>
            <div className="mo-section-label">Agent jobs</div>
            <h2 id="job-drawer-title" className="font-heading" style={{ fontSize: 18, margin: "4px 0 0" }}>
              Live progress
            </h2>
          </div>
          <button type="button" className="mo-btn" onClick={closeDrawer} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="mo-job-drawer-body">
          <div className="mo-job-list">
            {jobs.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "8px 4px" }}>
                No agent jobs yet. Approve a task or run an agent from Agents.
              </p>
            ) : (
              jobs.slice(0, 40).map((job) => {
                const active = job.id === (detail?.id ?? selectedJobId);
                return (
                  <button
                    key={job.id}
                    type="button"
                    className={`mo-job-list-item${active ? " active" : ""}`}
                    onClick={() => selectJob(job.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: 12 }}>
                        {job.codename}
                      </span>
                      <span style={{ fontSize: 10, color: STATUS_COLOR[job.status] ?? "var(--text-muted)" }}>
                        {statusLabel(job.status)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        marginTop: 4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {job.task}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {detail && (
            <div className="mo-job-detail">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <span className="mo-tag">{detail.codename}</span>
                <span className="mo-tag">{detail.projectId}</span>
                <span className="mo-tag" style={{ color: STATUS_COLOR[detail.status] }}>
                  {statusLabel(detail.status)}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 0 }}>
                {detail.task}
              </p>
              {(detail.status === "PENDING" || detail.status === "PROCESSING") && (
                <div className="mo-job-progress-bar" aria-hidden>
                  <div className="mo-job-progress-fill" />
                </div>
              )}
              {detail.error && (
                <pre className="mo-job-output" style={{ borderColor: "rgba(224,112,112,0.4)" }}>
                  {detail.error}
                </pre>
              )}
              {detail.output && (
                <pre className="mo-job-output">{detail.output.slice(0, 12000)}</pre>
              )}
              {!detail.output && !detail.error && detail.status === "PROCESSING" && (
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Agent is working…</p>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
