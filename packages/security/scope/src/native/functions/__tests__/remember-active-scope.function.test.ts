/**
 * Stackra file contract:
 * Purpose: unit tests of `rememberActiveScope`: it restores a remembered scope once, keeps a scope already chosen,
 *          writes every switch back, removes the value when the scope is cleared, drops a stored value that is not a
 *          scope, and stops remembering when told.
 * Boundary: test only; the `prefs` area is `@stackra/storage`'s `MemoryStorageDriver`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0327 (decision 10); ADR 0256.
 */
import type { ScopeRef } from "@stackra/contracts";
import { MemoryStorageDriver } from "@stackra/storage";
import { describe, expect, it } from "@stackra/testing";

import { ActiveScopeService } from "#core/index";
import { rememberActiveScope } from "#native/functions/remember-active-scope.function";

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const GLOBEX: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.globex" };
const KEY = "scope.active_scope";

describe("rememberActiveScope", () => {
  it("restores the remembered scope and writes every switch back", () => {
    const { prefs } = new MemoryStorageDriver();
    prefs.set(KEY, ACME);
    const active = new ActiveScopeService();
    const stop = rememberActiveScope(active, prefs);
    expect(active.current()).toEqual(ACME);
    active.set(GLOBEX);
    expect(prefs.get(KEY)).toEqual(GLOBEX);
    active.set(null);
    expect(prefs.has(KEY)).toBe(false);
    stop();
    active.set(ACME);
    expect(prefs.has(KEY)).toBe(false);
  });

  it("keeps a scope already chosen", () => {
    const { prefs } = new MemoryStorageDriver();
    prefs.set(KEY, ACME);
    const active = new ActiveScopeService();
    active.set(GLOBEX);
    rememberActiveScope(active, prefs);
    expect(active.current()).toEqual(GLOBEX);
  });

  it.each([
    [{ id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform" }],
    [{ id: ACME.id, path: "a.*" }],
    ["acme"],
  ])("drops the stored value %j", (stored) => {
    const { prefs } = new MemoryStorageDriver();
    prefs.set(KEY, stored);
    const active = new ActiveScopeService();
    rememberActiveScope(active, prefs);
    expect(active.current()).toBeNull();
    expect(prefs.has(KEY)).toBe(false);
  });
});
