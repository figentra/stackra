/**
 * Stackra file contract:
 * Purpose: proves `usePointedIndex()`: nothing is pointed at first; a pointer over a row points at its index (Recharts
 *          may give it as a number or a numeric string); a pointer between rows, with no index, or leaving the chart
 *          points at nothing.
 * Boundary: the hook through `renderHook` in jsdom, fed the state objects Recharts passes to its mouse handlers.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

import { usePointedIndex } from "#react/chart/use-pointed-index";

describe("usePointedIndex (web)", () => {
  it("follows the pointed row and clears when the pointer leaves", () => {
    const { result } = renderHook(() => usePointedIndex());
    expect(result.current.pointed).toBeNull();
    act(() => result.current.handlers.onMouseMove({ activeTooltipIndex: 2 }));
    expect(result.current.pointed).toBe(2);
    act(() => result.current.handlers.onMouseMove({ activeTooltipIndex: "3" }));
    expect(result.current.pointed).toBe(3);
    act(() => result.current.handlers.onMouseLeave());
    expect(result.current.pointed).toBeNull();
  });

  it("points at nothing between rows or with no index", () => {
    const { result } = renderHook(() => usePointedIndex());
    act(() => result.current.handlers.onMouseMove({ activeTooltipIndex: 1 }));
    act(() => result.current.handlers.onMouseMove({ activeTooltipIndex: 1.5 }));
    expect(result.current.pointed).toBeNull();
    act(() => result.current.handlers.onMouseMove({ activeTooltipIndex: 1 }));
    act(() => result.current.handlers.onMouseMove({}));
    expect(result.current.pointed).toBeNull();
  });
});
