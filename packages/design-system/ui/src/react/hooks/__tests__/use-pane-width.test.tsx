/**
 * Stackra file contract:
 * Purpose: proves `usePaneWidth`, the shared pane engine: an uncontrolled width starts at the default or the stored
 *          value, a new width is clamped, rounded, stored and reported, and a controlled width is clamped too.
 * Boundary: the hook alone in jsdom, with real local storage.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (shared pane engine).
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

import { usePaneWidth } from "#react/hooks/use-pane-width";

const BOUNDS = { defaultWidth: 300, minWidth: 200, maxWidth: 400 } as const;

beforeEach(() => window.localStorage.clear());

describe("usePaneWidth", () => {
  it("starts at the default, then clamps, rounds, stores and reports a new width", () => {
    const onWidthChange = vi.fn();
    const { result } = renderHook(() =>
      usePaneWidth({ ...BOUNDS, onWidthChange, storageKey: "pane" }),
    );
    expect(result.current.width).toBe(300);
    act(() => result.current.setWidth(512.4));
    expect(result.current.width).toBe(400);
    expect(onWidthChange).toHaveBeenLastCalledWith(400);
    act(() => result.current.setWidth(250.6));
    expect(result.current.width).toBe(251);
    expect(window.localStorage.getItem("pane:width")).toBe("251");
  });

  it("starts from the stored width when there is one", () => {
    window.localStorage.setItem("pane:width", "350");
    const { result } = renderHook(() => usePaneWidth({ ...BOUNDS, storageKey: "pane" }));
    expect(result.current.width).toBe(350);
  });

  it("clamps a controlled width and leaves it to the caller", () => {
    const onWidthChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ width }: { width: number }) => usePaneWidth({ ...BOUNDS, width, onWidthChange }),
      { initialProps: { width: 100 } },
    );
    expect(result.current.width).toBe(200);
    act(() => result.current.setWidth(380));
    expect(onWidthChange).toHaveBeenLastCalledWith(380);
    expect(result.current.width).toBe(200);
    rerender({ width: 380 });
    expect(result.current.width).toBe(380);
  });
});
