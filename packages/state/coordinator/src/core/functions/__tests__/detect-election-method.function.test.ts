/**
 * Stackra file contract:
 * Purpose: unit tests of `detectElectionMethod`: Web Locks when `navigator.locks.request` exists, else BroadcastChannel
 *          when it exists, else memory.
 * Boundary: test only; stubs the globals and restores them after each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0084 (the coordinator row).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ElectionMethod } from "#core/enums/election-method.enum";
import { detectElectionMethod } from "#core/functions/detect-election-method.function";

describe("detectElectionMethod", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers Web Locks", () => {
    vi.stubGlobal("navigator", { locks: { request: () => Promise.resolve() } });
    expect(detectElectionMethod()).toBe(ElectionMethod.WebLocks);
  });

  it("falls back to a BroadcastChannel without Web Locks", () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("BroadcastChannel", class {});
    expect(detectElectionMethod()).toBe(ElectionMethod.BroadcastChannel);
  });

  it("falls back to memory without either", () => {
    vi.stubGlobal("navigator", undefined);
    vi.stubGlobal("BroadcastChannel", undefined);
    expect(detectElectionMethod()).toBe(ElectionMethod.Memory);
  });
});
