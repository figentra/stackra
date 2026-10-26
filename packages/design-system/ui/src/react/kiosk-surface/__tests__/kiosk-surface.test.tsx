/**
 * Stackra file contract:
 * Purpose: proves the web KioskSurface resets after the idle timeout, restarts the countdown on a pointer or key,
 *          marks the reach and high contrast, and announces through a live region and, with audio on, aloud.
 * Boundary: jsdom with fake timers; `speak` is a spy, since jsdom has no speech synthesis.
 * Runtime: browser
 * Governing contract: ADR 0428 (decision 1); WCAG 2.2 SC 2.2.1 and 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { KioskSurface } from "#react/kiosk-surface/kiosk-surface";
import { useKiosk } from "#react/kiosk-surface/use-kiosk";

/** A child that announces on a click. */
function Announcer() {
  const kiosk = useKiosk();
  return (
    <button type="button" onClick={() => kiosk?.announce("Item added")}>
      Add
    </button>
  );
}

describe("KioskSurface (web)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("resets after the idle timeout, and a pointer or key restarts the countdown", () => {
    const onIdle = vi.fn();
    render(
      <KioskSurface idleTimeoutMs={1000} onIdle={onIdle}>
        <p>Welcome</p>
      </KioskSurface>,
    );
    act(() => vi.advanceTimersByTime(800));
    fireEvent.pointerDown(window);
    act(() => vi.advanceTimersByTime(800));
    fireEvent.keyDown(window, { key: "a" });
    act(() => vi.advanceTimersByTime(800));
    expect(onIdle).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(200));
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it("marks the seated reach and high contrast", () => {
    const { container } = render(
      <KioskSurface idleTimeoutMs={1000} onIdle={vi.fn()} reach="seated" isHighContrast>
        <p>Welcome</p>
      </KioskSurface>,
    );
    const surface = container.querySelector<HTMLElement>('[data-slot="kiosk-surface"]');
    expect(surface?.dataset["reach"]).toBe("seated");
    expect(surface?.dataset["contrast"]).toBe("more");
  });

  it("announces in the live region, and aloud only with audio on", () => {
    const speak = vi.fn();
    const { rerender } = render(
      <KioskSurface idleTimeoutMs={1000} onIdle={vi.fn()} speak={speak}>
        <Announcer />
      </KioskSurface>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("status").textContent).toBe("Item added");
    expect(speak).not.toHaveBeenCalled();
    rerender(
      <KioskSurface idleTimeoutMs={1000} onIdle={vi.fn()} speak={speak} isAudioOn>
        <Announcer />
      </KioskSurface>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(speak).toHaveBeenCalledWith("Item added");
  });
});
