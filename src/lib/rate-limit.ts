const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_ENTRIES = 100;
const STALE_TTL = 5 * 60_000;

function cleanup() {
  const now = Date.now();
  if (ipRequestCounts.size > MAX_ENTRIES) {
    for (const [ip, entry] of ipRequestCounts) {
      if (now > entry.resetAt + STALE_TTL) {
        ipRequestCounts.delete(ip);
      }
    }
  }
}

export function rateLimit(
  ip: string,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 5, windowMs: 60_000 }
): { allowed: boolean; remaining: number; resetIn: number } {
  if (ipRequestCounts.size >= MAX_ENTRIES) cleanup();

  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.maxRequests - 1, resetIn: options.windowMs };
  }

  entry.count += 1;
  const remaining = Math.max(0, options.maxRequests - entry.count);

  if (entry.count > options.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  return { allowed: true, remaining, resetIn: entry.resetAt - now };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}
