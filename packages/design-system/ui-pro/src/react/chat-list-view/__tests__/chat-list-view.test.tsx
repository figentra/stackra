/**
 * Stackra file contract:
 * Purpose: proves the web ChatListView names the list from `label`, draws HeroUI Pro's rows, passes `density` and
 *          unknown props through, carries HeroUI Pro's own parts, and types the name as `label`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is
 *          not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { ChatListView as HeroChatListView } from "@heroui-pro/react/chat-list-view";
import { render, screen } from "@testing-library/react";

import { ChatListView } from "#react/chat-list-view/chat-list-view";
import type { ChatListViewProps } from "#react/chat-list-view/chat-list-view.props";

interface Thread {
  readonly id: string;
  readonly title: string;
  readonly preview: string;
}

const threads: Thread[] = [
  { id: "1", title: "Launch planning", preview: "Draft a checklist" },
  { id: "2", title: "Feedback review", preview: "Summarise last week" },
];

describe("ChatListView (web)", () => {
  it("takes its accessible name from label and draws HeroUI Pro's rows", () => {
    render(
      <ChatListView label="Recent chats" items={threads}>
        {(thread) => (
          <ChatListView.Item id={thread.id} textValue={thread.title}>
            <ChatListView.ItemContent>
              <ChatListView.Icon>
                <svg />
              </ChatListView.Icon>
              <ChatListView.Text>
                <ChatListView.Title>{thread.title}</ChatListView.Title>
                <ChatListView.Preview>{thread.preview}</ChatListView.Preview>
              </ChatListView.Text>
              <ChatListView.Meta>2h</ChatListView.Meta>
            </ChatListView.ItemContent>
          </ChatListView.Item>
        )}
      </ChatListView>,
    );
    const list = screen.getByRole("grid", { name: "Recent chats" });
    expect(list.getAttribute("aria-label")).toBe("Recent chats");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Launch planning")).toBeTruthy();
    expect(screen.getByText("Summarise last week")).toBeTruthy();
  });

  it("passes density and unknown props through", () => {
    render(
      <ChatListView label="Chats" items={threads} density="compact" data-testid="list">
        {(thread) => (
          <ChatListView.Item id={thread.id} textValue={thread.title}>
            <ChatListView.ItemContent>
              <ChatListView.Title>{thread.title}</ChatListView.Title>
            </ChatListView.ItemContent>
          </ChatListView.Item>
        )}
      </ChatListView>,
    );
    expect(screen.getByTestId("list").className).toContain("chat-list-view--compact");
  });

  it("carries HeroUI Pro's own parts and types the name as label", () => {
    for (const part of [
      "Item",
      "ItemContent",
      "Icon",
      "Text",
      "Title",
      "Preview",
      "Meta",
    ] as const) {
      expect(ChatListView[part]).toBe(HeroChatListView[part]);
    }
    expectTypeOf<ChatListViewProps<Thread>>().toHaveProperty("label");
  });
});
