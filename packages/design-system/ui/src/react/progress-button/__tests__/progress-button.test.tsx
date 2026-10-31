/**
 * Stackra file contract:
 * Purpose: proves the web ProgressButton, PressFeedback and SplitView: the progress button shows a clamped fill and
 *          announces the percent with its label while running and is a plain button without progress; the press
 *          wrapper is a named button that reports presses and refuses them while disabled; the split view shows
 *          both panes side by side when wide and one pane at a time on a phone.
 * Boundary: jsdom with real React Aria; the window width is set by hand for the split view.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { PressFeedback } from "#react/press-feedback/press-feedback";
import { ProgressButton } from "#react/progress-button/progress-button";
import { SplitView } from "#react/split-view/split-view";

const press = (element: HTMLElement) => act(() => element.click());

describe("ProgressButton (web)", () => {
  it("fills to the clamped progress and announces the percent", () => {
    const { container, rerender } = render(
      <ProgressButton progress={0.42} progressLabel="Uploading">
        Upload
      </ProgressButton>,
    );
    expect(screen.getByRole("status").textContent).toBe("Uploading 42%");
    expect((container.querySelector('span[style*="width"]') as HTMLElement).style.width).toBe(
      "42%",
    );
    rerender(
      <ProgressButton progress={2} variant="secondary">
        Upload
      </ProgressButton>,
    );
    expect(screen.getByRole("status").textContent).toBe("100%");
    expect(container.querySelector('span[style*="width"]')?.className).toContain("bg-accent");
    rerender(<ProgressButton progress={-1}>Upload</ProgressButton>);
    expect(screen.getByRole("status").textContent).toBe("0%");
  });

  it("is a plain button without progress", () => {
    const onPress = vi.fn();
    render(<ProgressButton onPress={onPress}>Upload</ProgressButton>);
    expect(screen.queryByRole("status")).toBeNull();
    press(screen.getByRole("button", { name: "Upload" }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("PressFeedback (web)", () => {
  it("is a named button that reports presses", () => {
    const onPress = vi.fn();
    render(
      <PressFeedback
        label="Open card"
        onPress={onPress}
        feedback="highlight"
        className={() => "custom"}
      >
        <span>Card</span>
      </PressFeedback>,
    );
    const button = screen.getByRole("button", { name: "Open card" });
    expect(button.className).toContain("custom");
    press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("refuses presses while disabled", () => {
    const onPress = vi.fn();
    render(
      <PressFeedback onPress={onPress} isDisabled className="x">
        <span>Card</span>
      </PressFeedback>,
    );
    const button = screen.getByRole("button", { name: "Card" });
    expect(button.className).toContain("opacity-(--disabled-opacity)");
    press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

const widthOf = (width: number) =>
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true });

const view = (isSecondaryShown?: boolean) => (
  <SplitView
    primary="List"
    secondary="Detail"
    primaryLabel="Mail"
    secondaryLabel="Message"
    primaryWidth={280}
    {...(isSecondaryShown === undefined ? {} : { isSecondaryShown })}
  />
);

describe("SplitView (web)", () => {
  const original = window.innerWidth;
  afterEach(() => widthOf(original));

  it("shows both panes side by side when wide", () => {
    widthOf(1200);
    const { container } = render(view());
    expect(screen.getByRole("region", { name: "Mail" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Message" })).toBeTruthy();
    expect((container.firstChild as HTMLElement).style.gridTemplateColumns).toBe(
      "280px minmax(0, 1fr)",
    );
  });

  it("shows one pane at a time on a phone", () => {
    widthOf(360);
    const { rerender } = render(view());
    expect(screen.getByRole("region", { name: "Mail" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Message" })).toBeNull();
    rerender(view(true));
    expect(screen.queryByRole("region", { name: "Mail" })).toBeNull();
    expect(screen.getByRole("region", { name: "Message" })).toBeTruthy();
  });
});
