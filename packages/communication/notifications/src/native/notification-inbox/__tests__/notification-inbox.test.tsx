/**
 * Stackra file contract:
 * Purpose: proves the native NotificationInbox hands @stackra/ui's native NotificationsPanel every prop unchanged (the
 *          items, the host's words, the open state and the handlers), so a press and a dismissal reach the host, and
 *          renders under `dir="rtl"`.
 * Boundary: unit tier, jsdom. React Native does not render in vitest, so `@stackra/ui/native` is replaced by a DOM
 *           stand-in of the panel that records its props and keeps its roles (a named region, a button per row).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import type { NotificationItem } from "@stackra/ui/contracts";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { NotificationInbox } from "#native/notification-inbox/notification-inbox";
import type { NotificationInboxProps } from "#native/notification-inbox/notification-inbox.props";

/** The props the stand-in panel was last handed. */
const received = vi.hoisted(() => ({ props: undefined as unknown }));

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  return {
    NotificationsPanel: (props: NotificationInboxProps) => {
      received.props = props;
      return createElement(
        "section",
        { role: "region", "aria-label": props.title },
        props.items.map((item) =>
          createElement(
            "button",
            { key: item.id, type: "button", onClick: () => props.onItemPress?.(item.id) },
            item.title,
          ),
        ),
      );
    },
  };
});

const ITEMS: readonly NotificationItem[] = [
  { id: "1", title: "Order #1042 paid", group: "Today", isUnread: true },
  { id: "2", title: "Shift report ready", group: "Yesterday" },
];

describe("NotificationInbox (native)", () => {
  afterEach(cleanup);

  it("hands the panel every prop unchanged", () => {
    const props: NotificationInboxProps = {
      items: ITEMS,
      title: "Inbox",
      label: "Inbox, 1 new",
      emptyState: "Nothing new",
      isInline: true,
      onDismiss: vi.fn(),
      onMarkAllRead: vi.fn(),
    };
    render(<NotificationInbox {...props} />);
    expect(received.props).toEqual(props);
    expect(screen.getByRole("region", { name: "Inbox" })).toBeTruthy();
  });

  it("reports a pressed item to the host", () => {
    const onItemPress = vi.fn();
    render(<NotificationInbox items={ITEMS} isInline title="Inbox" onItemPress={onItemPress} />);
    fireEvent.click(screen.getByRole("button", { name: "Shift report ready" }));
    expect(onItemPress).toHaveBeenCalledWith("2");
  });

  it("renders under dir=rtl", () => {
    render(
      <div dir="rtl">
        <NotificationInbox items={ITEMS} isInline title="الإشعارات" />
      </div>,
    );
    expect(screen.getByRole("region", { name: "الإشعارات" }).closest("[dir='rtl']")).toBeTruthy();
  });
});
