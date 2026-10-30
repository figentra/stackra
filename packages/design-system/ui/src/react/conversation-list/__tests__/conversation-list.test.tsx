/**
 * Stackra file contract:
 * Purpose: proves the web ConversationList is a named grid of rows in day groups with pinned first, each row its title,
 *          preview and relative time, selects a row and reports it, offers only the wired menu actions (named for the
 *          conversation) and calls them, and shows the empty state when there are none.
 * Boundary: jsdom with real React Aria and HeroUI.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { ConversationSummary } from "#contracts/types/conversation-summary.type";
import { ConversationList } from "#react/conversation-list/conversation-list";

const NOW = new Date(2026, 9, 30, 12, 0);

const CONVERSATIONS: readonly ConversationSummary[] = [
  {
    id: "c1",
    title: "Return for order 2048",
    preview: "Your label is ready",
    updatedAt: new Date(2026, 9, 30, 11, 0),
  },
  { id: "c2", title: "Abaya sizes", updatedAt: new Date(2026, 9, 29, 9, 0) },
  { id: "c3", title: "Shipping to Riyadh", updatedAt: new Date(2026, 8, 1), isPinned: true },
];

const rowNamed = (name: string) => screen.getByRole("row", { name });

const press = (element: HTMLElement) => act(() => element.click());

describe("ConversationList (web)", () => {
  it("groups the rows under their headers, pinned first, with preview and time", () => {
    render(<ConversationList conversations={CONVERSATIONS} now={NOW} />);
    const grid = screen.getByRole("grid", { name: "Conversations" });
    expect(
      within(grid)
        .getAllByRole("rowheader")
        .map((header) => header.textContent),
    ).toEqual(["Pinned", "Today", "Yesterday"]);
    const rows = within(grid)
      .getAllByRole("row")
      .filter((row) => row.getAttribute("data-key"));
    expect(rows.map((row) => row.getAttribute("data-key"))).toEqual(["c3", "c1", "c2"]);
    expect(rows[1]?.textContent).toContain("Your label is ready");
    expect(rows[1]?.textContent).toContain("1 hr. ago");
  });

  it("draws the selected row selected and reports a newly chosen one", () => {
    const onSelect = vi.fn();
    render(
      <ConversationList
        conversations={CONVERSATIONS}
        selectedId="c1"
        onSelect={onSelect}
        now={NOW}
      />,
    );
    expect(rowNamed("Return for order 2048").getAttribute("aria-selected")).toBe("true");
    fireEvent.pointerDown(rowNamed("Abaya sizes"), { pointerType: "mouse", button: 0 });
    fireEvent.pointerUp(rowNamed("Abaya sizes"), { pointerType: "mouse", button: 0 });
    fireEvent.click(rowNamed("Abaya sizes"));
    expect(onSelect).toHaveBeenCalledWith("c2");
  });

  it("offers only the wired actions, named for the conversation, and calls them", () => {
    const onPinChange = vi.fn();
    const onDelete = vi.fn();
    render(
      <ConversationList
        conversations={CONVERSATIONS}
        onPinChange={onPinChange}
        onDelete={onDelete}
        now={NOW}
      />,
    );
    press(screen.getByRole("button", { name: "Actions for Shipping to Riyadh" }));
    const menu = screen.getByRole("menu");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["Unpin", "Delete"]);
    press(within(menu).getByRole("menuitem", { name: "Unpin" }));
    expect(onPinChange).toHaveBeenCalledWith("c3", false);
  });

  it("draws no menu when no action is wired, and the empty state when there is nothing", () => {
    const { rerender } = render(<ConversationList conversations={CONVERSATIONS} now={NOW} />);
    expect(screen.queryByRole("button", { name: /^Actions for/ })).toBeNull();
    rerender(<ConversationList conversations={[]} />);
    expect(screen.getByRole("heading", { name: "No conversations yet" })).toBeTruthy();
  });
});
