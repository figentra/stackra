/**
 * Stackra file contract:
 * Purpose: type tests of `Email`: a literal address is accepted as a default, a string without `@` is refused.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`) plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import type { Email } from "#core/types/email.type";

describe("Email", () => {
  it("accepts a literal address and reads as a string", () => {
    const from: Email = "orders@acme.example";
    expect(from.toLowerCase()).toBe("orders@acme.example");
  });

  it("refuses text without an @", () => {
    // @ts-expect-error -- not an email address
    const notAnAddress: Email = "orders.acme.example";
    expect(notAnAddress).not.toContain("@");
  });
});
