/**
 * Stackra file contract:
 * Purpose: proves the ChatMessage page sits at /pro-chat-message in the Pro category, titles the page and the document, and draws a user and an assistant turn with named action buttons, and rendered Markdown.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProChatMessage } from "#src/routes/pro-chat-message/pro-chat-message";
import { ProChatMessageRoute } from "#src/routes/pro-chat-message/pro-chat-message.route";

describe("ProChatMessage", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-chat-message in the Pro category, and titles the page and the document", () => {
    render(<ProChatMessage />);
    expect(ProChatMessageRoute.path).toBe("/pro-chat-message");
    expect(ProChatMessageRoute.category).toBe("AI");
    expect(screen.getByRole("heading", { level: 1, name: ProChatMessageRoute.title })).toBeTruthy();
    expect(document.title).toBe("ChatMessage · Stackra Playground");
  });

  it("draws both turns and names each action", () => {
    render(<ProChatMessage />);
    expect(screen.getByText(/Can you explain how compound components/)).toBeTruthy();
    expect(
      screen.getAllByRole("button").map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Copy the answer", "Good response", "Bad response", "Regenerate the answer"]);
  });

  it("renders the Markdown of the second reply", () => {
    render(<ProChatMessage />);
    expect(document.querySelector("strong")?.textContent).toBe("bold text");
    expect(document.querySelectorAll("li").length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["A conversation", "With Markdown"]);
  });
});
