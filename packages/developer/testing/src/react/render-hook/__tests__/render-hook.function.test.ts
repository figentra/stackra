// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of the `./react` `renderHook`: the hook reads what the providers give it, `initialProps` and
 *          `rerender` pass through, and the host is unmounted when the test finishes.
 * Boundary: test only, jsdom; the context and providers are local.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";
import { createContext, createElement, use, useEffect, type ReactNode } from "react";

import { renderHook } from "#react/render-hook/render-hook.function";

const Theme = createContext("plain");

/** Provides the dark theme. */
function Dark({ children }: { readonly children?: ReactNode }) {
  return createElement(Theme.Provider, { value: "dark" }, children);
}

/** Hosts mounted by earlier tests that are still mounted. */
const mounted = new Set<string>();

describe(renderHook, () => {
  it("renders the hook under the providers", () => {
    const { result } = renderHook(() => use(Theme), { providers: [Dark] });
    expect(result.current).toBe("dark");
  });

  it("passes initialProps through and rerenders with new props", () => {
    const { result, rerender } = renderHook((n: number) => n * 2, { initialProps: 2 });
    expect(result.current).toBe(4);
    rerender(5);
    expect(result.current).toBe(10);
  });

  it("mounts a host that the end of the test unmounts", () => {
    renderHook(() =>
      useEffect(() => {
        mounted.add("host");
        return () => {
          mounted.delete("host");
        };
      }, []),
    );
    expect(mounted.has("host")).toBe(true);
  });

  it("finds the previous test's host unmounted", () => {
    expect(mounted.size).toBe(0);
  });
});
