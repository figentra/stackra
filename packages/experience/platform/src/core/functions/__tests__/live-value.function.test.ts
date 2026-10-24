/**
 * Stackra file contract:
 * Purpose: unit tests of `liveValue`: it reads, writes and notifies; an equal value notifies nobody; an unsubscribed
 *          listener stops hearing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0079.
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { liveValue } from "#core/functions/live-value.function";

describe("liveValue", () => {
  it("reads, writes and notifies on change only", () => {
    const value = liveValue(1);
    const listener = vi.fn();
    const stop = value.subscribe(listener);
    value.set(1);
    expect(listener).not.toHaveBeenCalled();
    value.set(2);
    expect(value.get()).toBe(2);
    expect(listener).toHaveBeenCalledWith(2);
    stop();
    value.set(3);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
