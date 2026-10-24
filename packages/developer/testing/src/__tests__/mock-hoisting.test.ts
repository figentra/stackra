/**
 * Stackra file contract:
 * Purpose: the gate of ADR 0269 decision 4: `vi.mock` hoists above the imports when `vi` comes from
 *          `@stackra/testing`, so a mocked module is mocked for every import in the file.
 * Boundary: imports the package by its public name on purpose; the import of `node:os` sits above the `vi.mock` call
 *           in the source and must still receive the mock. If this fails, work stops and goes to the owner.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 4); ADR 0022 (test placement).
 */
import { hostname } from "node:os";
import { describe, expect, it, vi } from "@stackra/testing";

vi.mock("node:os", () => ({ hostname: () => "hoisted-by-stackra-testing" }));

// @covers sta-348:FR-002
describe("vi.mock from @stackra/testing", () => {
  it("is hoisted above the imports of the file", () => {
    expect(hostname()).toBe("hoisted-by-stackra-testing");
  });

  it("is the same vi as vitest's own", async () => {
    const vitest = await import("vitest");
    expect(vi).toBe(vitest.vi);
  });
});
