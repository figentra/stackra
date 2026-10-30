/**
 * Stackra file contract:
 * Purpose: proves the native ConversationList draws the day groups as headers with pinned first, each row a button with
 *          its selected state, title, preview and relative time, reports the row pressed, hands the menu only the
 *          wired actions (named for the conversation) and calls them, and draws the empty state when there are none.
 * Boundary: React Native, the icon registry, Text, ActionMenu and EmptyState are recording stand-ins that render plain
 *           DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import type { MenuSection } from "#contracts/types/menu-section.type";
import { ConversationList } from "#native/conversation-list/conversation-list";

const state = vi.hoisted(() => ({
  pressables: [] as Record<string, unknown>[],
  headers: [] as string[],
  menus: [] as Record<string, unknown>[],
  empties: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as never);
  return {
    View: box,
    Pressable: (props: Record<string, unknown>) => {
      state.pressables.push(props);
      return box(props);
    },
  };
});
vi.mock("@stackra/icons/native", () => ({
  IconRegistryProvider: ({ children }: { children: unknown }) => children,
}));
vi.mock("#native/conversation-list/conversation-list-icons.constant", () => ({
  CONVERSATION_LIST_ICONS: {},
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: "ltr" }),
}));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      if (props["accessibilityRole"] === "header") state.headers.push(String(props["children"]));
      return createElement("span", null, props["children"] as never);
    },
  };
});
vi.mock("#native/action-menu/action-menu", () => ({
  ActionMenu: (props: Record<string, unknown>) => {
    state.menus.push(props);
    return null;
  },
}));
vi.mock("#native/empty-state/empty-state", () => ({
  EmptyState: (props: Record<string, unknown>) => {
    state.empties.push(props);
    return null;
  },
}));

const NOW = new Date(2026, 9, 30, 12, 0);

const CONVERSATIONS = [
  {
    id: "c1",
    title: "Return for order 2048",
    preview: "Your label is ready",
    updatedAt: new Date(2026, 9, 30, 11, 0),
  },
  { id: "c2", title: "Abaya sizes", updatedAt: new Date(2026, 9, 25) },
  { id: "c3", title: "Shipping to Riyadh", updatedAt: new Date(2026, 8, 1), isPinned: true },
];

describe("ConversationList (native)", () => {
  beforeEach(() => {
    state.pressables = [];
    state.headers = [];
    state.menus = [];
    state.empties = [];
  });

  it("draws the groups as headers and the rows as buttons with their state", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <ConversationList
        conversations={CONVERSATIONS}
        selectedId="c1"
        onSelect={onSelect}
        now={NOW}
      />,
    );
    expect(state.headers).toEqual(["Pinned", "Today", "Previous 7 days"]);
    expect(state.pressables.map((props) => props["accessibilityState"])).toEqual([
      { selected: false },
      { selected: true },
      { selected: false },
    ]);
    expect(container.textContent).toContain("Your label is ready");
    expect(container.textContent).toContain("1 hr. ago");
    (state.pressables[2]?.["onPress"] as () => void)?.();
    expect(onSelect).toHaveBeenCalledWith("c2");
    expect(state.menus).toHaveLength(0);
  });

  it("hands the menu only the wired actions and calls them", () => {
    const onRename = vi.fn();
    const onDelete = vi.fn();
    render(
      <ConversationList
        conversations={CONVERSATIONS}
        onRename={onRename}
        onDelete={onDelete}
        now={NOW}
      />,
    );
    const menu = state.menus[0] ?? {};
    expect(menu["label"]).toBe("Actions for Shipping to Riyadh");
    const items = (menu["sections"] as MenuSection[])[0]?.items ?? [];
    expect(items.map((item) => [item.id, item.label, item.tone])).toEqual([
      ["rename", "Rename", undefined],
      ["delete", "Delete", "danger"],
    ]);
    items[1]?.onPress?.();
    expect(onDelete).toHaveBeenCalledWith("c3");
  });

  it("draws the empty state when there is nothing", () => {
    render(<ConversationList conversations={[]} />);
    expect(state.empties[0]).toMatchObject({
      title: "No conversations yet",
      icon: "message-square",
    });
  });
});
