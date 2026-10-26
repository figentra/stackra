/**
 * Stackra file contract:
 * Purpose: proves the native KioskSurface resets after the idle timeout, restarts the countdown on a touch without
 *          claiming it, lays out the seated reach, and announces to the screen reader and, with audio on, through
 *          `speak`.
 * Boundary: React Native does not render in vitest: react-native is replaced by a stand-in that records the surface's
 *           props and the announcements; fake timers.
 * Runtime: node
 * Governing contract: ADR 0428 (decision 1); WCAG 2.2 SC 2.2.1 and 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { KioskSurface } from "#native/kiosk-surface/kiosk-surface";
import { useKiosk } from "#native/kiosk-surface/use-kiosk";

/** What the stand-ins saw: the surface's props and the screen reader's announcements. */
const seen = vi.hoisted(() => ({
  surface: {} as Record<string, unknown>,
  announced: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    AccessibilityInfo: { announceForAccessibility: (text: string) => seen.announced.push(text) },
    View: (props: Record<string, unknown>) => {
      if (props["testID"] === "kiosk-surface") seen.surface = props;
      return createElement(
        "div",
        { className: props["className"] },
        props["children"] as ReactNode,
      );
    },
  };
});

/** A child that announces on a click. */
function Announcer() {
  const kiosk = useKiosk();
  return (
    <button type="button" onClick={() => kiosk?.announce("Item added")}>
      Add
    </button>
  );
}

describe("KioskSurface (native)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    seen.announced = [];
  });
  afterEach(() => vi.useRealTimers());

  it("resets after the idle timeout, and a touch restarts it without being claimed", () => {
    const onIdle = vi.fn();
    render(
      <KioskSurface idleTimeoutMs={1000} onIdle={onIdle} reach="seated">
        <Announcer />
      </KioskSurface>,
    );
    expect(seen.surface["className"]).toContain("justify-end");
    act(() => vi.advanceTimersByTime(900));
    expect((seen.surface["onStartShouldSetResponderCapture"] as () => boolean)()).toBe(false);
    act(() => vi.advanceTimersByTime(900));
    expect(onIdle).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(100));
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it("announces to the screen reader, and aloud with audio on", () => {
    const speak = vi.fn();
    render(
      <KioskSurface idleTimeoutMs={1000} onIdle={vi.fn()} isAudioOn speak={speak}>
        <Announcer />
      </KioskSurface>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(seen.announced).toEqual(["Item added"]);
    expect(speak).toHaveBeenCalledWith("Item added");
  });
});
