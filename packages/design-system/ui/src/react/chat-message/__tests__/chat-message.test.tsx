/**
 * Stackra file contract:
 * Purpose: proves the web ChatMessage reads its author first, puts the person's turn in a bubble, and shows the
 *          "Thinking…" shimmer while the assistant has not written.
 * Boundary: jsdom.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { ChatMessage } from "#react/chat-message/chat-message";

describe("ChatMessage (web)", () => {
  it("reads the author before the person's text", () => {
    const { container } = render(<ChatMessage from="user">Book a table for four</ChatMessage>);
    expect(container.textContent).toBe("YouBook a table for four");
    expect(container.querySelector("[data-from='user']")).toBeTruthy();
  });

  it("draws the assistant's avatar, actions and a custom author name", () => {
    render(
      <ChatMessage
        from="assistant"
        authorLabel="Stackra assistant"
        avatar={<span data-testid="avatar" />}
        actions={<button type="button">Copy</button>}
      >
        Done.
      </ChatMessage>,
    );
    expect(screen.getByText("Stackra assistant")).toBeTruthy();
    expect(screen.getByTestId("avatar")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
  });

  it("shimmers while loading", () => {
    render(<ChatMessage from="assistant" isLoading>ignored</ChatMessage>);
    expect(screen.getByRole("status").textContent).toBe("Thinking…");
    expect(screen.queryByText("ignored")).toBeNull();
  });
});
