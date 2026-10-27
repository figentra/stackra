/**
 * Stackra file contract:
 * Purpose: proves the web ChatConversation draws HeroUI Pro's thread (content, anchor) as a focusable log named by
 *          `label`, names the scroll button from its `label` or the catalogue's English default, passes unknown props
 *          through, carries HeroUI Pro's own parts, and requires the thread's label.
 * Boundary: jsdom with real HeroUI Pro; jsdom has no layout, so the thread is never scrolled above the bottom and the button
 *          stays in HeroUI Pro's hidden state (`aria-hidden`); it is found with `hidden: true`. The theme CSS is not
 *          loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0403 (catalogue defaults); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChatConversation as HeroChatConversation } from "@heroui-pro/react/chat-conversation";
import { render, screen } from "@testing-library/react";

import { ChatConversation } from "#react/chat-conversation/chat-conversation";

describe("ChatConversation (web)", () => {
  it("draws the thread as a focusable log named by label, and passes unknown props through", () => {
    render(
      <ChatConversation label="Thread" id="c" className="extra" data-testid="thread">
        <ChatConversation.Content data-testid="content">
          <p>Hello</p>
          <ChatConversation.ScrollAnchor data-testid="anchor" />
        </ChatConversation.Content>
      </ChatConversation>,
    );
    const thread = screen.getByTestId("thread");
    expect(screen.getByRole("log", { name: "Thread" })).toBe(thread);
    expect(thread.tabIndex).toBe(0);
    expect(thread.id).toBe("c");
    expect(thread.classList.contains("extra")).toBe(true);
    expect(screen.getByTestId("content").textContent).toBe("Hello");
    expect(screen.getByTestId("anchor").getAttribute("aria-hidden")).toBe("true");
  });

  it("names the scroll button from label", () => {
    render(
      <ChatConversation label="Thread">
        <ChatConversation.Content>
          <p>Hello</p>
        </ChatConversation.Content>
        <ChatConversation.ScrollButton label="Scroll to latest" />
      </ChatConversation>,
    );
    const button = screen.getByRole("button", { name: "Scroll to latest", hidden: true });
    expect(button.getAttribute("aria-label")).toBe("Scroll to latest");
  });

  it("names the scroll button from the catalogue when label is left out", () => {
    render(
      <ChatConversation label="Thread">
        <ChatConversation.ScrollButton />
      </ChatConversation>,
    );
    expect(screen.getByRole("button", { name: "Scroll to latest", hidden: true })).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts and requires the thread's label", () => {
    expect(ChatConversation.Content).toBe(HeroChatConversation.Content);
    expect(ChatConversation.ScrollAnchor).toBe(HeroChatConversation.ScrollAnchor);
    // @ts-expect-error `label` is required: the thread takes focus, so it needs a name
    void (<ChatConversation>{null}</ChatConversation>);
  });
});
