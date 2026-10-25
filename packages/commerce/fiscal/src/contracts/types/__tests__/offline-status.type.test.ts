/**
 * Stackra file contract:
 * Purpose: type tests of `OfflineStatus`: an empty backlog and an overdue one.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { OfflineStatus } from "#contracts/types/offline-status.type";

describe("OfflineStatus", () => {
  it("takes an empty backlog and refuses a missing overdue flag", () => {
    const status: OfflineStatus = {
      pending: 0,
      oldestSealedAt: null,
      deadline: null,
      overdue: false,
    };
    // @ts-expect-error -- the flag is always stated
    const unknown: OfflineStatus = { pending: 0, oldestSealedAt: null, deadline: null };
    expect([status.overdue, unknown.pending]).toEqual([false, 0]);
  });
});
