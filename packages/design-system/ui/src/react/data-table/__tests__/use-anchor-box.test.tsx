/**
 * Stackra file contract:
 * Purpose: proves `useAnchorBox()`: it starts with the element's box, measures again once per frame after a scroll of
 *          any scroll area, a window resize or a resize of the element itself, ignores an element no longer in the
 *          page, and stops listening when unmounted.
 * Boundary: the hook through `renderHook` in jsdom; the box, the animation frame and `ResizeObserver` are stand-ins.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 3 (inline edit); ADR 0022 (test placement);
 *          STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, renderHook } from "@testing-library/react";

import { useAnchorBox } from "#react/data-table/use-anchor-box";

let resized: (() => void) | undefined;
const disconnect = vi.fn();

/** Calls back when the test says the element resized. */
class ResizeObserverStandIn {
  constructor(callback: () => void) {
    resized = callback;
  }

  observe() {}

  disconnect() {
    disconnect();
  }
}

/** An element in the page whose box the test moves. */
function anchorAt(top: number) {
  const anchor = document.createElement("div");
  document.body.append(anchor);
  let y = top;
  anchor.getBoundingClientRect = () => ({ top: y, left: 0, width: 10, height: 10 }) as DOMRect;
  return { anchor, moveTo: (next: number) => (y = next) };
}

describe("useAnchorBox (web)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", ResizeObserverStandIn);
    disconnect.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it("starts with the element's box and follows a scroll, a resize and the element's own resize", () => {
    const { anchor, moveTo } = anchorAt(10);
    const { result } = renderHook(() => useAnchorBox(anchor));
    expect(result.current.top).toBe(10);
    moveTo(40);
    // A scroll inside any scroll area reaches the window's capture listener.
    const area = document.body.appendChild(document.createElement("div"));
    fireEvent.scroll(area);
    expect(result.current.top).toBe(10);
    act(() => vi.advanceTimersToNextFrame());
    expect(result.current.top).toBe(40);
    moveTo(70);
    fireEvent(window, new Event("resize"));
    act(() => vi.advanceTimersToNextFrame());
    expect(result.current.top).toBe(70);
    moveTo(90);
    act(() => resized?.());
    act(() => vi.advanceTimersToNextFrame());
    expect(result.current.top).toBe(90);
  });

  it("measures once per frame however many events come", () => {
    const { anchor } = anchorAt(0);
    const measure = vi.spyOn(anchor, "getBoundingClientRect");
    renderHook(() => useAnchorBox(anchor));
    measure.mockClear();
    fireEvent(window, new Event("resize"));
    fireEvent(window, new Event("resize"));
    fireEvent.scroll(document.body);
    act(() => vi.advanceTimersToNextFrame());
    expect(measure).toHaveBeenCalledTimes(1);
  });

  it("keeps the last box once the element leaves the page", () => {
    const { anchor, moveTo } = anchorAt(10);
    const { result } = renderHook(() => useAnchorBox(anchor));
    anchor.remove();
    moveTo(50);
    fireEvent(window, new Event("resize"));
    act(() => vi.advanceTimersToNextFrame());
    expect(result.current.top).toBe(10);
  });

  it("stops listening and drops a pending frame when unmounted", () => {
    const { anchor } = anchorAt(10);
    const measure = vi.spyOn(anchor, "getBoundingClientRect");
    const { unmount } = renderHook(() => useAnchorBox(anchor));
    fireEvent(window, new Event("resize"));
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
    measure.mockClear();
    act(() => vi.advanceTimersToNextFrame());
    fireEvent(window, new Event("resize"));
    act(() => vi.advanceTimersToNextFrame());
    expect(measure).not.toHaveBeenCalled();
  });

  it("works where ResizeObserver is missing", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const { anchor, moveTo } = anchorAt(5);
    const { result, unmount } = renderHook(() => useAnchorBox(anchor));
    moveTo(15);
    fireEvent(window, new Event("resize"));
    act(() => vi.advanceTimersToNextFrame());
    expect(result.current.top).toBe(15);
    expect(() => unmount()).not.toThrow();
  });
});
