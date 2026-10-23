/**
 * Stackra file contract:
 * Purpose: proves the HoverCard page sits at /pro-hover-card in the Pro group, titles the page and the document, draws
 *          its two triggers with the cards closed, and opens the profile card, a dialog named by its label, when the
 *          link takes focus.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { act, fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProHoverCard } from "#src/routes/pro-hover-card/pro-hover-card";
import { ProHoverCardRoute } from "#src/routes/pro-hover-card/pro-hover-card.route";

describe("ProHoverCard", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-hover-card in the Pro group, and titles the page and the document", () => {
    render(<ProHoverCard />);
    expect(ProHoverCardRoute.path).toBe("/pro-hover-card");
    expect(ProHoverCardRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProHoverCardRoute.title })).toBeTruthy();
    expect(document.title).toBe("HoverCard · Stackra Playground");
  });

  it("draws the link and the button that open the cards, with both cards closed", () => {
    render(<ProHoverCard />);
    expect(screen.getByRole("link", { name: "@stackra" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Release notes" })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the profile card when the link takes focus", () => {
    vi.useFakeTimers();
    render(<ProHoverCard />);
    act(() => {
      // Focus opens the card only after a keyboard press has set the keyboard modality.
      fireEvent.keyDown(document.body, { key: "Tab" });
      screen.getByRole("link", { name: "@stackra" }).focus();
      vi.advanceTimersByTime(1000);
    });
    vi.useRealTimers();
    expect(screen.getByRole("dialog", { name: "Stackra profile" })).toBeTruthy();
  });
});
