/**
 * Stackra file contract:
 * Purpose: proves restoreAfterTest runs the restore once the current test finishes, registers nothing outside a test,
 *          and hands the restore back unchanged.
 * Boundary: the internal helper behind freezeClock and freezeIds; the tests run in order.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 2); ADR 0022 (test placement).
 */
import { beforeAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { restoreAfterTest } from "#core/functions/restore-after-test.function";

// @covers sta-348:FR-003, sta-348:FR-004
describe(restoreAfterTest, () => {
  // Vitest 5 clears mock calls before each test, so runs across tests are counted here.
  const runs = { restore: 0, outside: 0 };
  const restore = vi.fn(() => void runs.restore++);

  it("returns the restore it was given, without running it", () => {
    expect(restoreAfterTest(restore)).toBe(restore);
    expect(restore).not.toHaveBeenCalled();
  });

  it("ran it once when the previous test finished", () => {
    expect(runs.restore).toBe(1);
  });

  describe("outside a test", () => {
    const outside = vi.fn(() => void runs.outside++);

    beforeAll(() => {
      restoreAfterTest(outside);
    });

    it("registers nothing, so the state lasts", () => {
      expect(outside).not.toHaveBeenCalled();
    });

    it("still has not run it after a test finished", () => {
      expect(runs.outside).toBe(0);
    });
  });
});
