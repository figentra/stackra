/**
 * Stackra file contract:
 * Purpose: proves the web MessageScroller is a named polite log that follows new content while at the bottom, stops
 *          following once the person scrolls up, then shows "New messages" (or the count) and jumps back down,
 *          instantly under reduced motion, and counts the messages added since the person left.
 * Boundary: jsdom has no layout or ResizeObserver: the region's sizes are set by hand and the observer is a stub the
 *           test triggers.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { MessageScroller } from "#react/message-scroller/message-scroller";

const state = vi.hoisted(() => ({ grow: (): void => undefined, reduced: false }));

vi.mock("motion/react", async (original) => ({
  ...(await original<object>()),
  useReducedMotion: () => state.reduced,
}));

class StubObserver {
  constructor(callback: () => void) {
    state.grow = callback;
  }

  observe() {}

  disconnect() {}
}

/** Gives the log a size: content height and viewport height. */
function size(log: HTMLElement, content: number, viewport = 400) {
  Object.defineProperty(log, "scrollHeight", { value: content, configurable: true });
  Object.defineProperty(log, "clientHeight", { value: viewport, configurable: true });
}

/** `count` messages, one child each. */
const messages = (count: number) =>
  Array.from({ length: count }, (_, index) => <p key={index}>Message {index}</p>);

describe("MessageScroller (web)", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", StubObserver);
    state.reduced = false;
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is a named polite log that follows new content at the bottom", () => {
    render(<MessageScroller>hello</MessageScroller>);
    const log = screen.getByRole("log", { name: "Conversation" });
    expect(log.getAttribute("aria-live")).toBe("polite");
    size(log, 1000);
    act(() => state.grow());
    expect(log.scrollTop).toBe(1000);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("stops following when scrolled up, then offers the jump and goes back down", () => {
    state.reduced = true;
    render(<MessageScroller>hello</MessageScroller>);
    const log = screen.getByRole("log");
    const scrollTo = vi.fn();
    log.scrollTo = scrollTo as never;
    size(log, 1000);
    log.scrollTop = 600;
    fireEvent.scroll(log);
    log.scrollTop = 200;
    fireEvent.scroll(log);
    size(log, 1400);
    act(() => state.grow());
    expect(log.scrollTop).toBe(200);
    act(() => screen.getByRole("button", { name: "New messages" }).click());
    expect(scrollTo).toHaveBeenCalledWith({ top: 1400, behavior: "auto" });
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("counts the messages added since the person scrolled up, until they are back", () => {
    const { rerender } = render(<MessageScroller>{messages(2)}</MessageScroller>);
    const log = screen.getByRole("log");
    size(log, 1000);
    log.scrollTop = 600;
    fireEvent.scroll(log);
    log.scrollTop = 200;
    fireEvent.scroll(log);
    rerender(<MessageScroller>{messages(5)}</MessageScroller>);
    expect(screen.getByRole("button", { name: "3 new messages" })).toBeTruthy();
    log.scrollTop = 600;
    fireEvent.scroll(log);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
