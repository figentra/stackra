/**
 * Stackra file contract:
 * Purpose: unit tests of `ActiveScopeService`: it starts with no scope, sets and clears one, keeps the same snapshot
 *          until it changes, notifies subscribers only on a change, copies and freezes the ref it keeps, and stops
 *          notifying a removed listener.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 7 and 10).
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ActiveScopeService } from "#core/services/active-scope.service";

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

describe(ActiveScopeService, () => {
  it("starts with no scope, then sets and clears one", () => {
    const service = new ActiveScopeService();
    expect(service.current()).toBeNull();
    service.set({ ...ACME, level: "product" } as ScopeRef);
    expect(service.current()).toEqual(ACME);
    expect(Object.isFrozen(service.current())).toBe(true);
    service.set(null);
    expect(service.current()).toBeNull();
  });

  it("keeps one snapshot and notifies only on a change", () => {
    const service = new ActiveScopeService();
    const listener = vi.fn();
    const stop = service.subscribe(listener);
    service.set(ACME);
    const snapshot = service.current();
    service.set({ ...ACME });
    expect(service.current()).toBe(snapshot);
    expect(listener).toHaveBeenCalledTimes(1);
    service.set(null);
    service.set(null);
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    stop();
    service.set(ACME);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
