/**
 * Stackra file contract:
 * Purpose: proves the ChatConversation page sits at /pro-chat-conversation in the Pro group, titles the page and the document, and draws the messages in a named viewport, and adds a message when asked.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen, fireEvent } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProChatConversation } from "#src/routes/pro-chat-conversation/pro-chat-conversation";
import { ProChatConversationRoute } from "#src/routes/pro-chat-conversation/pro-chat-conversation.route";

describe("ProChatConversation", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-chat-conversation in the Pro group, and titles the page and the document", () => {
    render(<ProChatConversation />);
    expect(ProChatConversationRoute.path).toBe("/pro-chat-conversation");
    expect(ProChatConversationRoute.group).toBe("Pro");
    expect(
      screen.getByRole("heading", { level: 1, name: ProChatConversationRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("ChatConversation · Stackra Playground");
  });

  it("draws the user and assistant messages in the viewport", () => {
    render(<ProChatConversation />);
    expect(screen.getByText("How does auto-scroll work in chat UIs?")).toBeTruthy();
    expect(screen.getByText(/stays pinned to the latest message/)).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Conversation"]);
  });

  it("adds a message when the button is pressed", () => {
    render(<ProChatConversation />);
    fireEvent.click(screen.getByRole("button", { name: "Add a message" }));
    expect(screen.getByText("Message number 7.")).toBeTruthy();
  });
});
