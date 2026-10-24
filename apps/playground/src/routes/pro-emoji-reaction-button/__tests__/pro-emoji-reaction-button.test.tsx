/**
 * Stackra file contract:
 * Purpose: proves the EmojiReactionButton page sits at /pro-emoji-reaction-button in the Pro category, titles the page
 *          and the document, draws five reactions named by their meaning with the reader's heart already given, and
 *          adds a reaction to the totals when it is pressed.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProEmojiReactionButton } from "#src/routes/pro-emoji-reaction-button/pro-emoji-reaction-button";
import { ProEmojiReactionButtonRoute } from "#src/routes/pro-emoji-reaction-button/pro-emoji-reaction-button.route";

describe("ProEmojiReactionButton", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-emoji-reaction-button in the Pro category, and titles the page and the document", () => {
    render(<ProEmojiReactionButton />);
    expect(ProEmojiReactionButtonRoute.path).toBe("/pro-emoji-reaction-button");
    expect(ProEmojiReactionButtonRoute.category).toBe("Feedback and status");
    expect(
      screen.getByRole("heading", { level: 1, name: ProEmojiReactionButtonRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("EmojiReactionButton · Stackra Playground");
  });

  it("draws five reactions named by their meaning, the heart already given", () => {
    render(<ProEmojiReactionButton />);
    for (const name of ["Heart", "Party", "Thumbs up", "Laughing", "Rocket"])
      expect(screen.getByRole("button", { name })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("22 reactions in total, 1 of them yours");
  });

  it("adds a reaction to the totals when it is pressed", () => {
    render(<ProEmojiReactionButton />);
    fireEvent.click(screen.getByRole("button", { name: "Thumbs up" }));
    expect(screen.getByRole("status").textContent).toBe("23 reactions in total, 2 of them yours");
  });
});
