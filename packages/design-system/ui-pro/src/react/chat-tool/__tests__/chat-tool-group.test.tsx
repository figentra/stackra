/**
 * Stackra file contract:
 * Purpose: proves the web ChatToolGroup draws HeroUI Pro's collapsible group, maps `isActive` to HeroUI Pro's
 *          `active`, passes unknown props through, carries HeroUI Pro's own parts, and refuses its `active` name.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChatToolGroup as HeroChatToolGroup } from "@heroui-pro/react/chat-tool";
import { render, screen } from "@testing-library/react";

import { ChatTool } from "#react/chat-tool/chat-tool";
import { ChatToolGroup } from "#react/chat-tool/chat-tool-group";

describe("ChatToolGroup (web)", () => {
  it("draws the trigger and the expanded tool calls and passes unknown props through", () => {
    render(
      <ChatToolGroup isExpanded className="extra" data-testid="group">
        <ChatToolGroup.Trigger>2 tool calls</ChatToolGroup.Trigger>
        <ChatToolGroup.Content>
          <ChatTool state="output-available" toolName="one" />
          <ChatTool state="output-available" toolName="two" />
        </ChatToolGroup.Content>
      </ChatToolGroup>,
    );
    const group = screen.getByTestId("group");
    expect(group.classList.contains("extra")).toBe(true);
    expect(screen.getByRole("button", { name: "2 tool calls" })).toBeTruthy();
    expect(group.textContent).toContain("one");
    expect(group.textContent).toContain("two");
  });

  it("maps isActive to HeroUI Pro's active, which marks the root", () => {
    const { rerender } = render(
      <ChatToolGroup isActive data-testid="group">
        <ChatToolGroup.Trigger>Running</ChatToolGroup.Trigger>
      </ChatToolGroup>,
    );
    expect(screen.getByTestId("group").dataset["active"]).toBe("true");
    rerender(
      <ChatToolGroup data-testid="group">
        <ChatToolGroup.Trigger>Running</ChatToolGroup.Trigger>
      </ChatToolGroup>,
    );
    expect(screen.getByTestId("group").dataset["active"]).toBeUndefined();
  });

  it("carries HeroUI Pro's own parts and refuses its active name", () => {
    expect(ChatToolGroup.Trigger).toBe(HeroChatToolGroup.Trigger);
    expect(ChatToolGroup.Content).toBe(HeroChatToolGroup.Content);
    // @ts-expect-error `isActive` is the one name for a running group
    void (<ChatToolGroup active>x</ChatToolGroup>);
  });
});
