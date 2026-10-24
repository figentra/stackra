/**
 * Stackra file contract:
 * Purpose: proves the web ChatMessage draws HeroUI Pro's user and assistant messages, names an action from `label`
 *          and presses it once, passes unknown props through, carries HeroUI Pro's own parts, and requires `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChatMessage as HeroChatMessage } from "@heroui-pro/react/chat-message";
import { render, screen } from "@testing-library/react";

import { ChatMessage } from "#react/chat-message/chat-message";

describe("ChatMessage (web)", () => {
  it("draws an assistant message from HeroUI Pro's parts and passes unknown props through", () => {
    render(
      <ChatMessage.Assistant id="m" className="extra" data-testid="message">
        <ChatMessage.Avatar alt="Assistant" fallback="AI" />
        <ChatMessage.Body>
          <ChatMessage.Bubble>
            <ChatMessage.Content>Hello there</ChatMessage.Content>
          </ChatMessage.Bubble>
          <ChatMessage.Media>
            <img alt="chart" src="data:," />
          </ChatMessage.Media>
        </ChatMessage.Body>
      </ChatMessage.Assistant>,
    );
    const message = screen.getByTestId("message");
    expect(message.id).toBe("m");
    expect(message.classList.contains("extra")).toBe(true);
    expect(screen.getByText("Hello there")).toBeTruthy();
    expect(screen.getByRole("img", { name: "chart" })).toBeTruthy();
  });

  it("draws a user message", () => {
    render(
      <ChatMessage.User data-testid="message">
        <ChatMessage.Content>Hi</ChatMessage.Content>
      </ChatMessage.User>,
    );
    expect(screen.getByTestId("message").textContent).toBe("Hi");
  });

  it("names an action from label and presses once", () => {
    const onPress = vi.fn();
    render(
      <ChatMessage.Actions>
        <ChatMessage.Action label="Copy message" onPress={onPress}>
          <svg />
        </ChatMessage.Action>
      </ChatMessage.Actions>,
    );
    const button = screen.getByRole("button", { name: "Copy message" });
    expect(button.getAttribute("aria-label")).toBe("Copy message");
    button.click();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("carries HeroUI Pro's own parts and requires a label", () => {
    for (const part of [
      "User",
      "Assistant",
      "Avatar",
      "Bubble",
      "Body",
      "Content",
      "Media",
      "Actions",
    ] as const) {
      expect(ChatMessage[part]).toBe(HeroChatMessage[part]);
    }
    // @ts-expect-error `label` is required: HeroUI Pro gives this part no accessible name of its own
    void (<ChatMessage.Action />);
  });
});
