/**
 * Stackra file contract:
 * Purpose: proves the native ChatMessage reads the author before the text and shimmers while loading.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom`; Text and Shimmer are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { createElement } from "react";
import { render, screen } from "@testing-library/react";

import { ChatMessage } from "#native/chat-message/chat-message";

vi.mock("react-native", async () => (await import("#testing/fakes/native-dom")).nativeDom);
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);
vi.mock("#native/shimmer/shimmer", () => ({
  Shimmer: () => createElement("i", { "data-testid": "shimmer" }),
}));

describe("ChatMessage (native)", () => {
  it("reads the author before the person's text", () => {
    render(<ChatMessage from="user">Book a table for four</ChatMessage>);
    expect(screen.getByText("Book a table for four").getAttribute("aria-label")).toBe(
      "You, Book a table for four",
    );
  });

  it("draws the assistant's avatar and shimmers while loading", () => {
    render(
      <ChatMessage from="assistant" isLoading avatar={<b data-testid="avatar" />}>
        ignored
      </ChatMessage>,
    );
    expect(screen.getByTestId("avatar")).toBeTruthy();
    expect(screen.getByTestId("shimmer")).toBeTruthy();
    expect(screen.queryByText("ignored")).toBeNull();
  });
});
