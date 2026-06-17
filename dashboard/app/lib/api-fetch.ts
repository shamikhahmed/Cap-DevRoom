const TOKEN_KEY = "cap_devroom_api_token";

export function getStoredApiToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setStoredApiToken(token: string) {
  if (typeof window === "undefined") return;
  if (token.trim()) localStorage.setItem(TOKEN_KEY, token.trim());
  else localStorage.removeItem(TOKEN_KEY);
}

/** Fetch wrapper — attaches X-Devroom-Token when configured in Settings. */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getStoredApiToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("X-Devroom-Token", token);
  return fetch(input, { ...init, headers });
}
