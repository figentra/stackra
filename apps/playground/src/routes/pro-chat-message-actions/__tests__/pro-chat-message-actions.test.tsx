/**
 * Stackra file contract:
 * Purpose: proves the ChatMessageActions page sits at /pro-chat-message-actions in the Pro group, titles the page and the document, and draws the full and the minimal row of actions, each named.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProChatMessageActions } from "#src/routes/pro-chat-message-actions/pro-chat-message-actions";
import { ProChatMessageActionsRoute } from "#src/routes/pro-chat-message-actions/pro-chat-message-actions.route";

describe("ProChatMessageActions", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-chat-message-actions in the Pro group, and titles the page and the document", () => {
    render(<ProChatMessageActions />);
    expect(ProChatMessageActionsRoute.path).toBe("/pro-chat-message-actions");
    expect(ProChatMessageActionsRoute.group).toBe("Pro");
    expect(
      screen.getByRole("heading", { level: 1, name: ProChatMessageActionsRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("ChatMessageActions · Stackra Playground");
  });

  it("names each action of both rows", () => {
    render(<ProChatMessageActions />);
    expect(
      screen.getAllByRole("button").map((button) => button.getAttribute("aria-label")),
    ).toEqual([
      "Copy",
      "Good response",
      "Bad response",
      "Regenerate",
      "More actions",
      "Copy",
      "More actions",
    ]);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["All actions", "Minimal"]);
  });
});
