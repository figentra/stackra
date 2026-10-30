/**
 * Stackra file contract:
 * Purpose: proves the web FullscreenBar shows its title, actions and a named exit; hides after `autoHideMs` (inert
 *          and hidden from assistive technology) and never with `false`; stays while it holds focus; comes back on a
 *          pointer move or a key; and, locked, ignores the pointer move and comes back only on a long press at the
 *          top edge.
 * Boundary: jsdom with real HeroUI and fake timers; `useUiText` echoes the key. The slide is CSS and not checked.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 32; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { FULLSCREEN_BAR_LONG_PRESS_MS } from "#core/constants/fullscreen-bar-long-press-ms.constant";
import { FullscreenBar } from "#react/fullscreen-bar/fullscreen-bar";

vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText: () => (key: string) => key,
}));

const bar = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-slot='fullscreen-bar']");
const reveal = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-slot='fullscreen-bar-reveal']");

describe("FullscreenBar (web)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the title, the actions and an exit named by the catalogue or the caller", () => {
    const onExit = vi.fn();
    const { rerender } = render(
      <FullscreenBar
        title="Register 2"
        actions={<button type="button">Lock</button>}
        onExit={onExit}
      />,
    );
    expect(screen.getByText("Register 2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lock" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "ui::fullscreen_bar.exit" }));
    expect(onExit).toHaveBeenCalledTimes(1);
    rerender(<FullscreenBar title="Register 2" onExit={onExit} exitLabel="Leave the register" />);
    expect(screen.getByRole("button", { name: "Leave the register" })).toBeTruthy();
  });

  it("hides after the delay, inert, and comes back on a pointer move or a key", () => {
    const { container } = render(
      <FullscreenBar title="KDS" onExit={() => undefined} autoHideMs={1000} />,
    );
    expect(bar(container)?.getAttribute("data-visible")).toBe("true");
    act(() => vi.advanceTimersByTime(1000));
    expect(bar(container)?.getAttribute("data-visible")).toBe("false");
    expect(bar(container)?.hasAttribute("inert")).toBe(true);
    expect(bar(container)?.getAttribute("aria-hidden")).toBe("true");
    act(() => {
      window.dispatchEvent(new Event("pointermove"));
    });
    expect(bar(container)?.getAttribute("data-visible")).toBe("true");
    act(() => vi.advanceTimersByTime(1000));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    });
    expect(bar(container)?.getAttribute("data-visible")).toBe("true");
  });

  it("never hides with `false`, nor while it holds focus", () => {
    const { container, rerender } = render(
      <FullscreenBar title="Editor" onExit={() => undefined} autoHideMs={false} />,
    );
    act(() => vi.advanceTimersByTime(60_000));
    expect(bar(container)?.getAttribute("data-visible")).toBe("true");
    rerender(<FullscreenBar title="Editor" onExit={() => undefined} autoHideMs={1000} />);
    act(() => screen.getByRole("button").focus());
    act(() => vi.advanceTimersByTime(5000));
    expect(bar(container)?.getAttribute("data-visible")).toBe("true");
  });

  it("locked, ignores the pointer and comes back only on a long press at the top edge", () => {
    const { container } = render(
      <FullscreenBar title="Kiosk" onExit={() => undefined} autoHideMs={1000} isLocked />,
    );
    act(() => vi.advanceTimersByTime(1000));
    act(() => {
      window.dispatchEvent(new Event("pointermove"));
    });
    expect(bar(container)?.getAttribute("data-visible")).toBe("false");
    const edge = reveal(container);
    if (!edge) throw new Error("no reveal edge");
    fireEvent.pointerDown(edge);
    fireEvent.pointerUp(edge);
    act(() => vi.advanceTimersByTime(FULLSCREEN_BAR_LONG_PRESS_MS));
    expect(bar(container)?.getAttribute("data-visible")).toBe("false");
    fireEvent.pointerDown(edge);
    act(() => vi.advanceTimersByTime(FULLSCREEN_BAR_LONG_PRESS_MS));
    expect(bar(container)?.getAttribute("data-visible")).toBe("true");
  });
});
