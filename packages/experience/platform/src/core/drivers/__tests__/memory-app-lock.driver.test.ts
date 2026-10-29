/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAppLockDriver`: available and agreeing by default, records each prompt's reason, and
 *          answers what a test sets.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0250 (2026-10-29 note).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryAppLockDriver } from "#core/drivers/memory-app-lock.driver";

describe("MemoryAppLockDriver", () => {
  it("can authenticate and agrees by default, recording the reason", async () => {
    const lock = new MemoryAppLockDriver();
    expect(await lock.canAuthenticate()).toBe(true);
    expect(await lock.authenticate("Unlock Stackra")).toBe(true);
    expect(lock.prompts).toEqual(["Unlock Stackra"]);
  });

  it("answers what a test sets", async () => {
    const lock = new MemoryAppLockDriver();
    lock.isAvailable = false;
    lock.answer = false;
    expect(await lock.canAuthenticate()).toBe(false);
    expect(await lock.authenticate("Unlock")).toBe(false);
  });
});
