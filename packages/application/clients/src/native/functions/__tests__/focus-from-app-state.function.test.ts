/**
 * Stackra file contract:
 * Purpose: unit tests of `focusFromAppState`: `active` focuses the query cache, `background` and `inactive` blur it.
 * Boundary: test only; reads TanStack Query's focus manager back and resets it after each case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0079 (TanStack Query core).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { focusManager } from "@tanstack/query-core";

import { focusFromAppState } from "#native/functions/focus-from-app-state.function";

describe("focusFromAppState", () => {
  afterEach(() => focusManager.setFocused(undefined));

  it("focuses the cache when the app is active", () => {
    focusFromAppState("background");
    focusFromAppState("active");
    expect(focusManager.isFocused()).toBe(true);
  });

  it("blurs it in the background and while inactive", () => {
    focusFromAppState("background");
    expect(focusManager.isFocused()).toBe(false);
    focusFromAppState("active");
    focusFromAppState("inactive");
    expect(focusManager.isFocused()).toBe(false);
  });
});
