/** Lightweight in-process token bucket per client+route. Guards paid AI
 * endpoints from accidental hammering. Single-instance scope (fine for the
 * current self-hosted deploy); pair with the DB budget cap for hard limits. */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOpts {
  /** max requests per window */
  limit: number;
  /** window length in ms */
  windowMs: number;
}

export function clientKey(req: Request, route: string): string {
  const h = req.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local";
  return `${route}:${ip}`;
}

/** Returns true if allowed, false if rate-limited. */
export function allow(key: string, opts: RateLimitOpts): boolean {
  const now = Date.now();
  const refillRate = opts.limit / opts.windowMs;
  const b = buckets.get(key) ?? { tokens: opts.limit, updatedAt: now };
  const elapsed = now - b.updatedAt;
  b.tokens = Math.min(opts.limit, b.tokens + elapsed * refillRate);
  b.updatedAt = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}

/** Convenience: enforce on a Request, returns a 429 Response or null if OK. */
export function checkRateLimit(
  req: Request,
  route: string,
  opts: RateLimitOpts = { limit: 20, windowMs: 60_000 }
): Response | null {
  if (allow(clientKey(req, route), opts)) return null;
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded — slow down." }),
    { status: 429, headers: { "content-type": "application/json", "retry-after": "30" } }
  );
}
