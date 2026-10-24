// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `useSignal(s)`: the current value on first render, a re-render with the new value after `set`,
 *          a shared module-level signal read by two hooks, a read-only view accepted, the server render, and the
 *          subscription released on unmount.
 * Boundary: test only; jsdom with Testing Library's `renderHook`; the server render uses react-dom/server.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0079 (decisions 2 and 6).
 */
import { describe, expect, it, vi } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import { signal } from "#react/signal/signal.function";
import { useSignal } from "#react/signal/use-signal";

describe("useSignal", () => {
  it("returns the current value and re-renders after set", () => {
    const interval = signal<"month" | "year" | null>(null);
    const { result } = renderHook(() => useSignal(interval));
    expect(result.current).toBeNull();
    act(() => interval.set("year"));
    expect(result.current).toBe("year");
  });

  it("shares one signal between readers", () => {
    const interval = signal("month");
    const first = renderHook(() => useSignal(interval));
    const second = renderHook(() => useSignal(interval));
    act(() => interval.set("year"));
    expect(first.result.current).toBe("year");
    expect(second.result.current).toBe("year");
  });

  it("accepts a read-only view of a signal", () => {
    const online = signal(true);
    const view = { get: online.get, subscribe: online.subscribe };
    const { result } = renderHook(() => useSignal(view));
    act(() => online.set(false));
    expect(result.current).toBe(false);
  });

  it("renders the current value on the server", () => {
    const greeting = signal("hello");
    function Greeting() {
      return <span>{useSignal(greeting)}</span>;
    }
    expect(renderToString(<Greeting />)).toBe("<span>hello</span>");
  });

  it("releases the subscription on unmount", () => {
    const count = signal(0);
    const stop = vi.fn();
    const view = {
      get: count.get,
      subscribe: (listener: (value: number) => void) => {
        const unsubscribe = count.subscribe(listener);
        return () => {
          stop();
          unsubscribe();
        };
      },
    };
    const { unmount } = renderHook(() => useSignal(view));
    unmount();
    expect(stop).toHaveBeenCalled();
  });
});
