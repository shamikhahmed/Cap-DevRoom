import type {
  AgentRosterEntry,
  Approval,
  HealthResponse,
  NetworkInfo,
  Priority,
} from "./types";

export class DevRoomApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export async function devroomFetch<T>(
  baseUrl: string,
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const url = `${normalizeBaseUrl(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...rest,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { "x-devroom-token": token } : {}),
      ...headers,
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || res.statusText };
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : res.statusText;
    throw new DevRoomApiError(msg, res.status);
  }
  return data as T;
}

export function getHealth(baseUrl: string, token?: string) {
  return devroomFetch<HealthResponse>(baseUrl, "/api/health", { token });
}

export function getNetwork(baseUrl: string, token?: string) {
  return devroomFetch<NetworkInfo>(baseUrl, "/api/network", { token });
}

export function listApprovals(baseUrl: string, token?: string) {
  return devroomFetch<{ approvals: Approval[] }>(baseUrl, "/api/approvals", { token });
}

export function patchApproval(
  baseUrl: string,
  id: string,
  status: "approved" | "rejected",
  token?: string
) {
  return devroomFetch<{ approval: Approval; run?: { status: string; message: string } }>(
    baseUrl,
    "/api/approvals",
    { method: "PATCH", body: JSON.stringify({ id, status }), token }
  );
}

export function getRoster(baseUrl: string, token?: string) {
  return devroomFetch<{ roster: AgentRosterEntry[] }>(baseUrl, "/api/agents/roster", { token });
}

export function listPriorities(baseUrl: string, token?: string) {
  return devroomFetch<{ priorities: Priority[] }>(baseUrl, "/api/priorities", { token });
}

export function sendCeoCommand(
  baseUrl: string,
  command: string,
  projectId: string,
  token?: string
) {
  return devroomFetch<{ ok: boolean; message?: string; assignments?: unknown[] }>(
    baseUrl,
    "/api/ceo/command",
    { method: "POST", body: JSON.stringify({ command, projectId }), token }
  );
}
