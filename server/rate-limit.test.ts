import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter, requestAddress } from "./rate-limit";

describe("authentication rate limiting", () => {
  it("blocks attempts after the configured threshold and reports a retry window", () => {
    const limiter = new FixedWindowRateLimiter(2, 60_000);
    expect(limiter.consume("client", 1_000).allowed).toBe(true);
    expect(limiter.consume("client", 1_001).allowed).toBe(true);
    const blocked = limiter.consume("client", 1_002);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
    expect(limiter.consume("client", 61_001).allowed).toBe(true);
  });

  it("can clear an identity bucket without affecting another identity", () => {
    const limiter = new FixedWindowRateLimiter(1, 60_000);
    limiter.consume("one", 1_000);
    limiter.consume("two", 1_000);
    limiter.clear("one");
    expect(limiter.consume("one", 1_001).allowed).toBe(true);
    expect(limiter.consume("two", 1_001).allowed).toBe(false);
  });

  it("uses the socket address rather than trusting a client-supplied forwarded header", () => {
    expect(requestAddress({ socket: { remoteAddress: "127.0.0.1" } })).toBe("127.0.0.1");
    expect(requestAddress({ socket: {} })).toBe("unknown");
  });
});
