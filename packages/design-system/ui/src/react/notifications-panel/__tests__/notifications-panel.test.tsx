/**
 * Stackra file contract:
 * Purpose: proves the web NotificationsPanel names its bell with the unread count, badges the count, opens a dialog
 *          with the items under their group headings, says "Unread" for unread rows, reports item presses, dismisses
 *          and mark-all-read, shows the empty state, and wiggles the bell and bumps the badge only when the unread
 *          count rises.
 * Boundary: jsdom with real HeroUI; jsdom has no `Element.animate`, so it is stubbed and its calls are checked.
 * Runtime: browser
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";

import type { NotificationItem } from "#contracts/types/notification-item.type";
import { NotificationsPanel } from "#react/notifications-panel/notifications-panel";

const press = (element: HTMLElement) => act(() => element.click());

const ITEMS: readonly NotificationItem[] = [
  {
    id: "1",
    title: "Low stock: oat milk",
    group: "Today",
    isUnread: true,
    tone: "warning",
    time: "5 min",
  },
  { id: "2", title: "Order #1042 refunded", group: "Today", isUnread: true },
  { id: "3", title: "Shift report ready", group: "Yesterday", tone: "success" },
];

describe("NotificationsPanel (web)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("names the bell with the unread count and badges it", () => {
    render(<NotificationsPanel items={ITEMS} />);
    const bell = screen.getByRole("button", { name: "Notifications, 2 unread" });
    expect(bell.parentElement?.textContent).toContain("2");
  });

  it("shows the panel in place when inline, with no bell", () => {
    render(<NotificationsPanel items={ITEMS} isInline />);
    const panel = screen.getByRole("region", { name: "Notifications" });
    expect(within(panel).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /Notifications/ })).toBeNull();
  });

  it("opens the items under their headings, with unread marks", () => {
    render(<NotificationsPanel items={ITEMS} />);
    press(screen.getByRole("button", { name: /Notifications/ }));
    const dialog = screen.getByRole("dialog", { name: "Notifications" });
    const today = within(dialog).getByRole("region", { name: "Today" });
    expect(within(today).getAllByRole("listitem")).toHaveLength(2);
    expect(within(today).getAllByText("Unread")).toHaveLength(2);
    expect(within(dialog).getByRole("region", { name: "Yesterday" }).textContent).toContain(
      "Shift report ready",
    );
  });

  it("reports item presses, dismisses and mark-all-read", () => {
    const onItemPress = vi.fn();
    const onDismiss = vi.fn();
    const onMarkAllRead = vi.fn();
    render(
      <NotificationsPanel
        items={ITEMS}
        onItemPress={onItemPress}
        onDismiss={onDismiss}
        onMarkAllRead={onMarkAllRead}
        defaultOpen
      />,
    );
    press(screen.getByRole("button", { name: /Order #1042 refunded/ }));
    expect(onItemPress).toHaveBeenCalledWith("2");
    press(screen.getAllByRole("button", { name: "Dismiss notification" })[2] as HTMLElement);
    expect(onDismiss).toHaveBeenCalledWith("3");
    press(screen.getByRole("button", { name: "Mark all as read" }));
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state, and no badge or mark-all with nothing unread", () => {
    render(<NotificationsPanel items={[]} onMarkAllRead={() => undefined} defaultOpen />);
    // The open popover is modal, so the bell behind it is hidden from the accessibility tree.
    expect(screen.getByRole("button", { name: "Notifications", hidden: true })).toBeTruthy();
    expect(screen.getByText("You're all caught up")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Mark all as read" })).toBeNull();
  });

  it("wiggles the bell and bumps the badge only when the unread count rises", () => {
    const animate = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "animate", { value: animate, configurable: true });
    const { rerender } = render(<NotificationsPanel items={ITEMS} />);
    expect(animate).not.toHaveBeenCalled();
    rerender(
      <NotificationsPanel items={[{ id: "4", title: "New order", isUnread: true }, ...ITEMS]} />,
    );
    expect(animate).toHaveBeenCalledTimes(2);
    rerender(<NotificationsPanel items={ITEMS} />);
    expect(animate).toHaveBeenCalledTimes(2);
    Reflect.deleteProperty(HTMLElement.prototype, "animate");
  });
});
