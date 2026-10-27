/**
 * Stackra file contract:
 * Purpose: unit tests of `usesContainer`: true for the container itself, a member that declares it and a hand-built
 *          IR; false for a member that declares packages without it (`@stackra/testing`, STA-1365 item 8).
 * Boundary: test only; plain objects, no fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1365.
 */
import { describe, expect, it } from "@stackra/testing";

import { usesContainer } from "#core/functions/uses-container.function";

describe("usesContainer", () => {
  it("is true for the container, a member declaring it and an IR without packages", () => {
    expect(usesContainer({ package: "@stackra/container", packages: [] })).toBe(true);
    expect(usesContainer({ package: "@stackra/orders", packages: ["@stackra/container"] })).toBe(
      true,
    );
    expect(usesContainer({ package: "@stackra/orders" })).toBe(true);
  });

  it("is false for a member that declares packages without the container", () => {
    expect(
      usesContainer({ package: "@stackra/testing", packages: ["@stackra/vitest-config"] }),
    ).toBe(false);
  });
});
