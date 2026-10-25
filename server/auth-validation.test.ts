import { describe, expect, it } from "vitest";
import { localAuthValidationError } from "../shared/auth-validation";

describe("local authentication form validation", () => {
  it("accepts valid sign-in credentials", () => {
    expect(localAuthValidationError({ email: "customer@example.com", password: "ValidPassw0rd!" }, false)).toBeNull();
  });

  it("rejects malformed sign-in credentials before a request is made", () => {
    expect(localAuthValidationError({ email: "not-an-email", password: "short" }, false)).toBe("Enter a valid email address.");
  });

  it("requires a valid name and matching confirmation during registration", () => {
    expect(localAuthValidationError({ name: "A", email: "customer@example.com", password: "ValidPassw0rd!", passwordConfirmation: "ValidPassw0rd!" }, true)).toBe("Enter a name between 2 and 80 characters.");
    expect(localAuthValidationError({ name: "Customer", email: "customer@example.com", password: "ValidPassw0rd!", passwordConfirmation: "DifferentPassw0rd!" }, true)).toBe("Passwords do not match.");
  });
});
