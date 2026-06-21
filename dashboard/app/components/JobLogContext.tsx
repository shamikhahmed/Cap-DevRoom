"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import JobLogDrawer from "./JobLogDrawer";

export interface AgentJobRow {
  id: string;
  codename: string;
  task: string;
  projectId: string;
  status: string;
  risk?: string;
  output?: string | null;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface JobLogContextValue {
  jobs: AgentJobRow[];
  open: boolean;
  selectedJobId: string | null;
  activeCount: number;
  openDrawer: (jobId?: string) => void;
  closeDrawer: () => void;
  selectJob: (jobId: string | null) => void;
  refreshJobs: () => Promise<void>;
}

const JobLogContext = createContext<JobLogContextValue | null>(null);

export function useJobLog() {
  const ctx = useContext(JobLogContext);
  if (!ctx) throw new Error("useJobLog must be used within JobLogProvider");
  return ctx;
}

export function JobLogProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<AgentJobRow[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const refreshJobs = useCallback(async () => {
    try {
      const r = await fetch("/api/jobs", { cache: "no-store" });
      if (!r.ok) return;
      const data = (await r.json()) as { jobs?: AgentJobRow[] };
      setJobs(data.jobs ?? []);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    refreshJobs();
    const id = setInterval(refreshJobs, 8_000);
    return () => clearInterval(id);
  }, [refreshJobs]);

  const activeCount = useMemo(
    () => jobs.filter((j) => j.status === "PENDING" || j.status === "PROCESSING").length,
    [jobs]
  );

  const openDrawer = useCallback(
    (jobId?: string) => {
      setOpen(true);
      if (jobId) setSelectedJobId(jobId);
      else if (!selectedJobId && jobs[0]) setSelectedJobId(jobs[0].id);
      void refreshJobs();
    },
    [jobs, refreshJobs, selectedJobId]
  );

  const closeDrawer = useCallback(() => setOpen(false), []);

  const value: JobLogContextValue = {
    jobs,
    open,
    selectedJobId,
    activeCount,
    openDrawer,
    closeDrawer,
    selectJob: setSelectedJobId,
    refreshJobs,
  };

  return (
    <JobLogContext.Provider value={value}>
      {children}
      <JobLogDrawer />
    </JobLogContext.Provider>
  );
}
