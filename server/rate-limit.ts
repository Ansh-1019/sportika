export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type Bucket = { count: number; resetAt: number };

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly maxAttempts: number, private readonly windowMs: number) {}

  consume(key: string, now = Date.now()): RateLimitResult {
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, retryAfterSeconds: Math.ceil(this.windowMs / 1000) };
    }

    current.count += 1;
    if (current.count > this.maxAttempts) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
    }
    return { allowed: true, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  clear(key: string): void {
    this.buckets.delete(key);
  }

  reset(): void {
    this.buckets.clear();
  }
}

export const loginIpLimiter = new FixedWindowRateLimiter(30, 15 * 60 * 1000);
export const loginIdentityLimiter = new FixedWindowRateLimiter(5, 15 * 60 * 1000);
export const registrationIpLimiter = new FixedWindowRateLimiter(10, 60 * 60 * 1000);
export const registrationIdentityLimiter = new FixedWindowRateLimiter(3, 60 * 60 * 1000);

export function requestAddress(req: { socket?: { remoteAddress?: string | undefined } }): string {
  return req.socket?.remoteAddress || "unknown";
}
