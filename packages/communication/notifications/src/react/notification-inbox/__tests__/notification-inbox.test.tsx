/**
 * Stackra file contract:
 * Purpose: proves the web NotificationInbox names its bell with the host's label, opens a dialog titled by the host
 *          from the keyboard, lists the items, reports item presses and mark-all-read, shows the host's empty state,
 *          shows the list in place as a named region when inline, and keeps its names under `dir="rtl"`.
 * Boundary: unit tier, jsdom, the real @stackra/ui NotificationsPanel.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import type { NotificationItem } from "@stackra/ui/contracts";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import { NotificationInbox } from "#react/notification-inbox/notification-inbox";

const ITEMS: readonly NotificationItem[] = [
  { id: "1", title: "Order #1042 paid", group: "Today", isUnread: true, tone: "success" },
  { id: "2", title: "Low stock: oat milk", group: "Today", tone: "warning" },
];

describe("NotificationInbox (web)", () => {
  afterEach(cleanup);

  it("names the bell with the host's label and opens the host's title from the keyboard", async () => {
    render(<NotificationInbox items={ITEMS} label="Inbox, 1 new" title="Inbox" />);
    const bell = screen.getByRole("button", { name: "Inbox, 1 new" });
    bell.focus();
    await act(async () => {
      fireEvent.keyDown(bell, { key: "Enter" });
      fireEvent.keyUp(bell, { key: "Enter" });
    });
    const dialog = await screen.findByRole("dialog", { name: "Inbox" });
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(2);
  });

  it("reports item presses and mark-all-read", () => {
    const onItemPress = vi.fn();
    const onMarkAllRead = vi.fn();
    render(
      <NotificationInbox
        items={ITEMS}
        onItemPress={onItemPress}
        onMarkAllRead={onMarkAllRead}
        defaultOpen
      />,
    );
    act(() => screen.getByRole("button", { name: /Order #1042 paid/ }).click());
    expect(onItemPress).toHaveBeenCalledWith("1");
    act(() => screen.getByRole("button", { name: "Mark all as read" }).click());
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("shows the host's empty state", () => {
    render(<NotificationInbox items={[]} isInline title="Inbox" emptyState="Nothing new" />);
    expect(screen.getByText("Nothing new")).toBeTruthy();
  });

  it("shows the list in place as a named region when inline, with no bell", () => {
    render(<NotificationInbox items={ITEMS} isInline title="Inbox" />);
    const region = screen.getByRole("region", { name: "Inbox" });
    expect(within(region).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Inbox/ })).toBeNull();
  });

  it("keeps its names under dir=rtl", () => {
    render(
      <div dir="rtl">
        <NotificationInbox items={ITEMS} isInline title="الإشعارات" />
      </div>,
    );
    const region = screen.getByRole("region", { name: "الإشعارات" });
    expect(region.closest("[dir='rtl']")).toBeTruthy();
  });
});
