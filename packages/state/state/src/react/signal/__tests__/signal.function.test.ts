/**
 * Stackra file contract:
 * Purpose: unit and type tests of `signal(initial)`: read and set, subscribers called with each new value until they
 *          unsubscribe, equal values silent, one listener unsubscribing another mid-notification, unbound methods, a
 *          frozen result.
 * Boundary: test only; no React.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0079 (decisions 2 and 6).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { vi } from "vitest";

import { signal } from "#react/signal/signal.function";
import type { StateSignal } from "#react/signal/state-signal.type";

describe("signal", () => {
  it("holds a value that set replaces", () => {
    const chosen = signal<"month" | "year" | null>(null);
    expect(chosen.get()).toBeNull();
    chosen.set("year");
    expect(chosen.get()).toBe("year");
    expectTypeOf(chosen).toEqualTypeOf<StateSignal<"month" | "year" | null>>();
  });

  it("calls subscribers with each new value until they unsubscribe", () => {
    const count = signal(0);
    const listener = vi.fn();
    const stop = count.subscribe(listener);
    count.set(1);
    stop();
    stop();
    count.set(2);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(1);
  });

  it("notifies nobody for an equal value", () => {
    const nan = signal(Number.NaN);
    const listener = vi.fn();
    nan.subscribe(listener);
    nan.set(Number.NaN);
    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps notifying when one listener unsubscribes another", () => {
    const online = signal(true);
    const second = vi.fn();
    online.subscribe(() => stopSecond());
    const stopSecond = online.subscribe(second);
    online.set(false);
    expect(second).toHaveBeenCalledWith(false);
  });

  it("works with unbound methods and cannot be reassigned", () => {
    const { get, set } = signal("a");
    set("b");
    expect(get()).toBe("b");
    expect(Object.isFrozen(signal(0))).toBe(true);
  });
});
