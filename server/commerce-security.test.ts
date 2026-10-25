import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { priceRangeError, safeInternalReturnTo } from "../shared/catalog-filters";

function callerFor(user: TrpcContext["user"]) {
  return appRouter.createCaller({
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  });
}

describe("catalog filter validation", () => {
  it("accepts empty, equal, and ordered non-negative whole-number ranges", () => {
    expect(priceRangeError()).toBeNull();
    expect(priceRangeError(0, 0)).toBeNull();
    expect(priceRangeError(100, 500)).toBeNull();
  });

  it("rejects negative, fractional, non-finite, and reversed prices", () => {
    expect(priceRangeError(-1, 500)).toMatch(/non-negative/);
    expect(priceRangeError(0, 1.5)).toMatch(/whole number/);
    expect(priceRangeError(Number.NaN, 500)).toMatch(/whole number/);
    expect(priceRangeError(501, 500)).toMatch(/greater than/);
  });

  it("rejects an invalid range through the public catalog procedure before data access", async () => {
    await expect(callerFor(null).catalog.list({ minPrice: 500, maxPrice: 300 })).rejects.toThrow();
  });
});

describe("OAuth return path safety", () => {
  it("keeps safe local account paths and query values", () => {
    expect(safeInternalReturnTo("/account/orders?tab=recent")).toBe("/account/orders?tab=recent");
    expect(safeInternalReturnTo("/checkout#delivery")).toBe("/checkout#delivery");
  });

  it("rejects external, protocol-relative, malformed and control-character paths", () => {
    expect(safeInternalReturnTo("https://evil.example/path")).toBe("/");
    expect(safeInternalReturnTo("//evil.example/path")).toBe("/");
    expect(safeInternalReturnTo("/\\\\evil.example/path")).toBe("/");
    expect(safeInternalReturnTo("/account\nSet-Cookie: forged")).toBe("/");
    expect(safeInternalReturnTo(undefined)).toBe("/");
  });
});

describe("server-side access control", () => {
  it("blocks customer access to admin APIs before querying protected data", async () => {
    const caller = callerFor({
      id: 7, openId: "customer", name: "Customer", email: "customer@example.test", loginMethod: "manus",
      role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    });
    await expect(caller.admin.customers({ search: "customer" })).rejects.toThrow();
  });

  it("blocks profile mutation when no application session exists", async () => {
    await expect(callerFor(null).account.updateProfile({ name: "Customer Name" })).rejects.toThrow();
  });
});
