/**
 * Stackra file contract:
 * Purpose: proves `usePopoverPosition` re-anchors through the one signal React Aria listens to (a window `resize`),
 *          sends it at most once a frame however often it is called, keeps one function across renders, and calls a
 *          pending frame off on unmount.
 * Boundary: jsdom with fake timers for the frame; where the popover lands is checked by the playground's e2e suite.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (popover updatePosition).
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { StrictMode, useEffect } from "react";

import { usePopoverPosition } from "#react/popover/use-popover-position";

describe("usePopoverPosition", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] }));
  afterEach(() => vi.useRealTimers());

  it("sends one window resize on the next frame, however often it is called", () => {
    const onResize = vi.fn();
    window.addEventListener("resize", onResize);
    const { result } = renderHook(() => usePopoverPosition());
    act(() => {
      result.current.updatePosition();
      result.current.updatePosition();
    });
    expect(onResize).not.toHaveBeenCalled();
    act(() => vi.advanceTimersToNextFrame());
    expect(onResize).toHaveBeenCalledTimes(1);
    act(() => result.current.updatePosition());
    act(() => vi.advanceTimersToNextFrame());
    expect(onResize).toHaveBeenCalledTimes(2);
    window.removeEventListener("resize", onResize);
  });

  it("keeps one function across renders and drops a pending frame on unmount", () => {
    const onResize = vi.fn();
    window.addEventListener("resize", onResize);
    const { result, rerender, unmount } = renderHook(() => usePopoverPosition());
    const first = result.current.updatePosition;
    rerender();
    expect(result.current.updatePosition).toBe(first);
    act(() => first());
    unmount();
    act(() => vi.advanceTimersToNextFrame());
    expect(onResize).not.toHaveBeenCalled();
    window.removeEventListener("resize", onResize);
  });

  it("still works after Strict Mode unmounts and mounts it again with a frame pending", () => {
    const onResize = vi.fn();
    window.addEventListener("resize", onResize);
    const { result } = renderHook(
      () => {
        const position = usePopoverPosition();
        useEffect(() => position.updatePosition(), [position]);
        return position;
      },
      { wrapper: StrictMode },
    );
    act(() => vi.advanceTimersToNextFrame());
    act(() => result.current.updatePosition());
    act(() => vi.advanceTimersToNextFrame());
    expect(onResize).toHaveBeenCalledTimes(2);
    window.removeEventListener("resize", onResize);
  });
});
