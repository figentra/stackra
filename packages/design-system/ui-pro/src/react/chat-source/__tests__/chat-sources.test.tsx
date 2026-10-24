/**
 * Stackra file contract:
 * Purpose: proves the web ChatSources draws HeroUI Pro's collapsible list of citations, passes unknown props
 *          through, and carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChatSources as HeroChatSources } from "@heroui-pro/react/chat-source";
import { render, screen } from "@testing-library/react";

import { ChatSource } from "#react/chat-source/chat-source";
import { ChatSources } from "#react/chat-source/chat-sources";

describe("ChatSources (web)", () => {
  it("draws the trigger and the expanded list and passes unknown props through", () => {
    render(
      <ChatSources isExpanded className="extra" data-testid="root">
        <ChatSources.Trigger>2 sources</ChatSources.Trigger>
        <ChatSources.Content>
          <ChatSources.List data-testid="list">
            <ChatSource sourceType="document" title="a.pdf" />
            <ChatSource sourceType="document" title="b.pdf" />
          </ChatSources.List>
        </ChatSources.Content>
      </ChatSources>,
    );
    const root = screen.getByTestId("root");
    expect(root.classList.contains("extra")).toBe(true);
    expect(screen.getByRole("button", { name: "2 sources" })).toBeTruthy();
    expect(screen.getByTestId("list").textContent).toContain("a.pdf");
    expect(screen.getByTestId("list").textContent).toContain("b.pdf");
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of ["Trigger", "Content", "List"] as const) {
      expect(ChatSources[part]).toBe(HeroChatSources[part]);
    }
  });
});
