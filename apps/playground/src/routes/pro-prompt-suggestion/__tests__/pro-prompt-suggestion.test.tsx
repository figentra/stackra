/**
 * Stackra file contract:
 * Purpose: proves the PromptSuggestion page sits at /pro-prompt-suggestion in the Pro category, titles the page and the document, and draws a list of suggestions as buttons and a group of cards, and announces the suggestion chosen.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen, fireEvent } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProPromptSuggestion } from "#src/routes/pro-prompt-suggestion/pro-prompt-suggestion";
import { ProPromptSuggestionRoute } from "#src/routes/pro-prompt-suggestion/pro-prompt-suggestion.route";

describe("ProPromptSuggestion", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-prompt-suggestion in the Pro category, and titles the page and the document", () => {
    render(<ProPromptSuggestion />);
    expect(ProPromptSuggestionRoute.path).toBe("/pro-prompt-suggestion");
    expect(ProPromptSuggestionRoute.category).toBe("AI");
    expect(
      screen.getByRole("heading", { level: 1, name: ProPromptSuggestionRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("PromptSuggestion · Stackra Playground");
  });

  it("draws the list suggestions as buttons named by their text and the cards with their titles", () => {
    render(<ProPromptSuggestion />);
    expect(
      screen.getByRole("button", { name: "Help me plan a product launch checklist" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Weekly project update" })).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      "A list",
      "What do you want to work on?",
      "Cards",
      "Starter prompts for everyday work",
    ]);
  });

  it("announces the suggestion chosen", () => {
    render(<ProPromptSuggestion />);
    expect(screen.getByRole("status").textContent).toBe("Chosen: Nothing chosen yet.");
    fireEvent.click(
      screen.getByRole("button", { name: "Help me plan a product launch checklist" }),
    );
    expect(screen.getByRole("status").textContent).toBe(
      "Chosen: Help me plan a product launch checklist",
    );
  });
});
