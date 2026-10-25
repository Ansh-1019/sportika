import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./local-auth";

describe("local password authentication", () => {
  it("hashes passwords and verifies only the original password", async () => {
    const hash = await hashPassword("ValidPassw0rd!");
    expect(hash).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(hash).not.toContain("ValidPassw0rd!");
    await expect(verifyPassword("ValidPassw0rd!", hash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPassw0rd!", hash)).resolves.toBe(false);
  });
});
