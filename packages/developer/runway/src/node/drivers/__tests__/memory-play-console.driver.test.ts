/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPlayConsoleDriver`: a seeded app answers its state, any other package is `null`.
 * Boundary: test only; in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482 (decisions 4 and 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryPlayConsoleDriver } from "#node/drivers/memory-play-console.driver";

describe("MemoryPlayConsoleDriver", () => {
  it("answers a seeded app, and null for another package", async () => {
    const play = new MemoryPlayConsoleDriver();
    play.apps.set("com.acme.staff", { hasRelease: true });

    expect(await play.findApp("com.acme.staff")).toEqual({ hasRelease: true });
    expect(await play.findApp("com.acme.kiosk")).toBeNull();
  });
});
