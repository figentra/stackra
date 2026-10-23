/**
 * Stackra file contract:
 * Purpose: proves the ChatListView page sits at /pro-chat-list-view in the Pro category, titles the page and the document, and draws the threads in a named list in two densities, with a title and the time of each.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProChatListView } from "#src/routes/pro-chat-list-view/pro-chat-list-view";
import { ProChatListViewRoute } from "#src/routes/pro-chat-list-view/pro-chat-list-view.route";

describe("ProChatListView", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-chat-list-view in the Pro category, and titles the page and the document", () => {
    render(<ProChatListView />);
    expect(ProChatListViewRoute.path).toBe("/pro-chat-list-view");
    expect(ProChatListViewRoute.category).toBe("Pro");
    expect(
      screen.getByRole("heading", { level: 1, name: ProChatListViewRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("ChatListView · Stackra Playground");
  });

  it("draws the threads in two named lists", () => {
    render(<ProChatListView />);
    const names = screen.getAllByRole("grid").map((list) => list.getAttribute("aria-label"));
    expect(names).toEqual(["Recent chats", "Recent chats, compact"]);
    expect(screen.getAllByText("Product launch planning")).toHaveLength(2);
    expect(screen.getAllByText("Yesterday")).toHaveLength(2);
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Default", "Compact"]);
  });
});
