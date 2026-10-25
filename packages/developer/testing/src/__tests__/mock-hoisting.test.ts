/**
 * Stackra file contract:
 * Purpose: the gate of ADR 0269 decision 4 as amended on 2026-10-24: `vi.mock` hoists above the imports when `vi`
 *          comes from `vitest`, the only import vitest's hoisting recognises, so a mocked module is mocked for every
 *          import in the file; and `@stackra/testing` re-exports no `vi`, so a test cannot take the un-hoisted path.
 * Boundary: imports the package by its public name on purpose; the import of `node:os` sits above the `vi.mock` call
 *           in the source and must still receive the mock. If this fails, work stops and goes to the owner.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 4, note of 2026-10-24); ADR 0022 (test placement).
 */
import { hostname } from "node:os";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

vi.mock("node:os", () => ({ hostname: () => "hoisted-by-vitest" }));

// @covers sta-348:FR-002
describe("vi.mock with vi from vitest", () => {
  it("is hoisted above the imports of the file", () => {
    expect(hostname()).toBe("hoisted-by-vitest");
  });

  it("is the only vi: @stackra/testing re-exports none", async () => {
    const testing = await import("@stackra/testing");
    expect("vi" in testing).toBe(false);
  });
});
