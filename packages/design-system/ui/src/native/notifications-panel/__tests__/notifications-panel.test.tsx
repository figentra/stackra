/**
 * Stackra file contract:
 * Purpose: proves the native NotificationsPanel names its bell with the unread count and badges it in the locale's
 *          digits, opens the drawer on press with the items under their headings and unread marks, reports presses
 *          and mark-all-read, plays a notification haptic and wiggles the bell when the unread count rises (haptic
 *          only under reduced motion), and that a row's long horizontal swipe dismisses it while a short one springs
 *          back.
 * Boundary: React Native, Reanimated, HeroUI Native and the Stackra parts are recording stand-ins; the PanResponder
 *          handlers are called directly with gesture values, not dragged on a device.
 * Runtime: node
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import type { NotificationItem } from "#contracts/types/notification-item.type";
import { NotificationsPanel } from "#native/notifications-panel/notifications-panel";

type Gesture = { dx: number; dy: number };
type Responder = {
  onPanResponderTerminate: () => void;
  onMoveShouldSetPanResponder: (event: unknown, gesture: Gesture) => boolean;
  onPanResponderMove: (event: unknown, gesture: Gesture) => void;
  onPanResponderRelease: (event: unknown, gesture: Gesture) => void;
};

const state = vi.hoisted(() => ({
  reduced: false,
  locale: "en",
  played: [] as string[],
  sets: [] as unknown[],
  drawer: {} as Record<string, unknown>,
  responders: [] as Responder[],
  animated: [] as Record<string, unknown>[],
}));

vi.mock("react-native-reanimated", async () => {
  const { createElement, useRef } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.animated.push(props);
        return createElement("div", null, props["children"] as never);
      },
    },
    useSharedValue: (initial: unknown) => {
      const ref = useRef<{ get: () => unknown; set: (next: unknown) => void } | null>(null);
      if (!ref.current) {
        let value = initial;
        ref.current = {
          get: () => (typeof value === "number" ? value : 0),
          set: (next) => {
            value = next;
            state.sets.push(next);
          },
        };
      }
      return ref.current;
    },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    withTiming: (to: number) => ({ timing: to }),
    withSpring: (to: number) => ({ spring: to }),
    withSequence: (...steps: unknown[]) => ({ sequence: steps }),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as never);
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        props["accessibilityLabel"]
          ? { "aria-label": props["accessibilityLabel"], role: "img" }
          : null,
        props["children"] as never,
      ),
    ScrollView: box,
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] },
        props["children"] as never,
      ),
    PanResponder: {
      create: (config: Responder) => {
        state.responders.push(config);
        return { panHandlers: {} };
      },
    },
  };
});

vi.mock("heroui-native", () => ({ useThemeColor: (name: string) => `color:${name}` }));
vi.mock("@stackra/icons/native/lucide-icons", () => ({ Bell: () => null }));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: state.locale }),
}));
vi.mock("#native/haptics/use-haptic", () => ({
  useHaptic: () => ({ play: (kind: string) => state.played.push(kind) }),
}));

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as never),
  };
});
vi.mock("#native/card/card", async () => {
  const { createElement } = await import("react");
  const part = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as never);
  return { Card: Object.assign(part, { Header: part, Title: part, Content: part }) };
});
vi.mock("#native/feedback-icon/feedback-icon", () => ({ FeedbackIcon: () => null }));
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: ({ label, onPress }: { label: string; onPress: () => void }) =>
      createElement("button", { type: "button", "aria-label": label, onClick: onPress }),
  };
});
vi.mock("#native/close-button/close-button", async () => {
  const { createElement } = await import("react");
  return {
    CloseButton: ({ label, onPress }: { label: string; onPress: () => void }) =>
      createElement("button", { type: "button", "aria-label": label, onClick: onPress }),
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] },
        props["children"] as never,
      ),
  };
});
vi.mock("#native/badge/badge", async () => {
  const { createElement } = await import("react");
  const Badge = (props: Record<string, unknown>) =>
    createElement("output", null, props["children"] as never);
  const Anchor = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as never);
  return { Badge: Object.assign(Badge, { Anchor }) };
});
vi.mock("#native/drawer/drawer", async () => {
  const { createElement } = await import("react");
  const part = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as never);
  const Drawer = (props: Record<string, unknown>) => {
    state.drawer = props;
    return props["isOpen"] ? createElement("section", null, props["children"] as never) : null;
  };
  return { Drawer: Object.assign(Drawer, { Header: part, Title: part, Body: part }) };
});

const press = (element: HTMLElement) => act(() => element.click());

const ITEMS: readonly NotificationItem[] = [
  { id: "1", title: "Low stock: oat milk", group: "Today", isUnread: true },
  { id: "2", title: "Order #1042 refunded", group: "Today", isUnread: true },
  { id: "3", title: "Shift report ready", group: "Yesterday" },
];

describe("NotificationsPanel (native)", () => {
  beforeEach(() => {
    state.reduced = false;
    state.locale = "en";
    state.played = [];
    state.sets = [];
    state.drawer = {};
    state.responders = [];
    state.animated = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("names and badges the bell, and opens the grouped items on press", () => {
    state.locale = "ar-EG";
    render(<NotificationsPanel items={ITEMS} />);
    expect(screen.getByRole("status").textContent).toBe("٢");
    expect(screen.queryByText("Today")).toBeNull();
    press(screen.getByRole("button", { name: "Notifications, 2 unread" }));
    expect(state.drawer["isOpen"]).toBe(true);
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("Yesterday")).toBeTruthy();
    expect(screen.getAllByRole("img", { name: "Unread" })).toHaveLength(2);
  });

  it("shows the panel in place when inline, with no bell", () => {
    render(<NotificationsPanel items={ITEMS} isInline />);
    expect(screen.getByText("Notifications")).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Notifications/ })).toBeNull();
  });

  it("reports presses and mark-all-read", () => {
    const onItemPress = vi.fn();
    const onMarkAllRead = vi.fn();
    render(
      <NotificationsPanel
        items={ITEMS}
        onItemPress={onItemPress}
        onMarkAllRead={onMarkAllRead}
        defaultOpen
      />,
    );
    press(screen.getByText("Shift report ready"));
    expect(onItemPress).toHaveBeenCalledWith("3");
    press(screen.getByText("Mark all as read"));
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("plays a notification haptic and wiggles the bell when the unread count rises", () => {
    const { rerender } = render(<NotificationsPanel items={ITEMS} />);
    expect(state.played).toEqual([]);
    rerender(
      <NotificationsPanel items={[{ id: "4", title: "New order", isUnread: true }, ...ITEMS]} />,
    );
    expect(state.played).toEqual(["success"]);
    expect(state.sets).toContainEqual(expect.objectContaining({ sequence: expect.any(Array) }));
    state.sets = [];
    state.reduced = true;
    rerender(
      <NotificationsPanel
        items={[
          { id: "5", title: "Another", isUnread: true },
          { id: "4", title: "New order", isUnread: true },
          ...ITEMS,
        ]}
      />,
    );
    expect(state.played).toEqual(["success", "success"]);
    expect(state.sets).toEqual([]);
  });

  it("dismisses a row on a long horizontal swipe and springs back from a short one", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<NotificationsPanel items={ITEMS} onDismiss={onDismiss} defaultOpen />);
    const responder = state.responders.at(-1) as Responder;
    expect(responder.onMoveShouldSetPanResponder(null, { dx: 30, dy: 2 })).toBe(true);
    expect(responder.onMoveShouldSetPanResponder(null, { dx: 4, dy: 30 })).toBe(false);
    responder.onPanResponderRelease(null, { dx: 40, dy: 0 });
    expect(state.sets).toContainEqual({ spring: 0 });
    act(() => responder.onPanResponderRelease(null, { dx: -300, dy: 0 }));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(180));
    expect(onDismiss).toHaveBeenCalledWith("3");
    press(screen.getAllByRole("button", { name: "Dismiss notification" })[0] as HTMLElement);
    expect(onDismiss).toHaveBeenCalledWith("1");
  });

  it("says it is empty in its own words, the caller's or the caller's node", () => {
    const { rerender } = render(<NotificationsPanel items={[]} isInline title="Inbox" />);
    expect(screen.getByText("Inbox")).toBeTruthy();
    expect(screen.getByText("You're all caught up")).toBeTruthy();
    rerender(<NotificationsPanel items={[]} isInline emptyState="Nothing new" />);
    expect(screen.getByText("Nothing new")).toBeTruthy();
    rerender(
      <NotificationsPanel items={[]} isInline emptyState={<p>Quiet</p>} footer={<b>All</b>} />,
    );
    expect(screen.getByText("Quiet")).toBeTruthy();
    expect(screen.getByText("All")).toBeTruthy();
  });

  it("takes its own label, draws no badge when all is read and follows the owner's open state", () => {
    const onOpenChange = vi.fn();
    render(
      <NotificationsPanel
        items={[{ id: "9", title: "Read", description: "More", time: "2m" }]}
        label="Alerts"
        isOpen={false}
        onOpenChange={onOpenChange}
        onMarkAllRead={vi.fn()}
      />,
    );
    expect(screen.queryByRole("status")).toBeNull();
    press(screen.getByRole("button", { name: "Alerts" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(state.drawer["isOpen"]).toBe(false);
    act(() => (state.drawer["onOpenChange"] as (next: boolean) => void)(false));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("names the bell plainly with nothing unread and draws an ungrouped row's details", () => {
    render(
      <NotificationsPanel
        items={[{ id: "9", title: "Read", description: "More", time: "2m" }]}
        defaultOpen
      />,
    );
    expect(screen.getByRole("button", { name: "Notifications" })).toBeTruthy();
    expect(screen.getByText("More")).toBeTruthy();
    expect(screen.getByText("2m")).toBeTruthy();
    expect(screen.queryByText("Mark all as read")).toBeNull();
  });

  it("follows a swipe, measures its row, settles when cancelled and dismisses at once when reduced", () => {
    state.reduced = true;
    const onDismiss = vi.fn();
    render(<NotificationsPanel items={ITEMS} onDismiss={onDismiss} defaultOpen />);
    const responder = state.responders.at(-1) as Responder;
    const row = [...state.animated].reverse().find((props) => props["onLayout"]);
    act(() =>
      (row?.["onLayout"] as ((event: unknown) => void) | undefined)?.({
        nativeEvent: { layout: { width: 90 } },
      }),
    );
    responder.onPanResponderMove(null, { dx: 25, dy: 0 });
    expect(state.sets).toContain(25);
    responder.onPanResponderTerminate();
    expect(state.sets.at(-1)).toBe(0);
    responder.onPanResponderRelease(null, { dx: 40, dy: 0 });
    expect(onDismiss).toHaveBeenCalledWith("3");
  });
});
