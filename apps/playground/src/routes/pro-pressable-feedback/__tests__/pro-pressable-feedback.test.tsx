/**
 * Stackra file contract:
 * Purpose: proves the PressableFeedback page sits at /pro-pressable-feedback in the Pro category, titles the page and the
 *          document, draws three buttons named by their text, counts the presses of the ripple tile in text, and
 *          leaves the disabled tile disabled.
 * Boundary: jsdom with real HeroUI Pro; `matchMedia` and `ResizeObserver` are stubbed because jsdom has neither. The
 *          ripple and highlight are painted effects, checked in the browser.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProPressableFeedback } from "#src/routes/pro-pressable-feedback/pro-pressable-feedback";
import { ProPressableFeedbackRoute } from "#src/routes/pro-pressable-feedback/pro-pressable-feedback.route";

describe("ProPressableFeedback", () => {
  beforeEach(() => {
    stubBrowserApis();
    // jsdom has no Web Animations; the ripple animates itself when pressed.
    Element.prototype.animate = () =>
      ({ finished: Promise.resolve(), cancel: () => {}, onfinish: null }) as unknown as Animation;
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-pressable-feedback in the Pro category, and titles the page and the document", () => {
    render(<ProPressableFeedback />);
    expect(ProPressableFeedbackRoute.path).toBe("/pro-pressable-feedback");
    expect(ProPressableFeedbackRoute.category).toBe("Actions");
    expect(
      screen.getByRole("heading", { level: 1, name: ProPressableFeedbackRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("PressableFeedback · Stackra Playground");
  });

  it("draws three buttons named by their text, the last disabled", () => {
    render(<ProPressableFeedback />);
    const names = screen.getAllByRole("button").map((button) => button.textContent);
    expect(names).toEqual([
      "Ripple tilePressed 0 times",
      "Highlight tilePressed 0 times",
      "Unavailable tilePress me",
    ]);
    const buttons = screen.getAllByRole("button") as HTMLButtonElement[];
    expect(buttons[2]?.disabled || buttons[2]?.getAttribute("aria-disabled") === "true").toBe(true);
  });

  it("counts the presses of the ripple tile in text", () => {
    render(<ProPressableFeedback />);
    fireEvent.click(screen.getByRole("button", { name: /Ripple tile/ }));
    expect(screen.getByText("Pressed 1 time")).toBeTruthy();
  });
});
