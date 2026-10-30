/**
 * Stackra file contract:
 * Purpose: proves the native ConversationList's row menu offers pin on an unpinned row and unpin on a pinned one (with
 *          the matching icon) and reports the flipped state, calls rename and delete with the row's id, nests its own
 *          icon registry, and names the list by `label` with the caller's class.
 * Boundary: React Native, the icon registry, Text, ActionMenu and EmptyState are recording stand-ins that render plain
 *           DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import type { MenuItem } from "#contracts/types/menu-item.type";
import type { MenuSection } from "#contracts/types/menu-section.type";
import { ConversationList } from "#native/conversation-list/conversation-list";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  menus: [] as Record<string, unknown>[],
  registries: [] as unknown[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as never);
    },
    Pressable: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as never),
  };
});
vi.mock("@stackra/icons/native", () => ({
  IconRegistryProvider: ({ children, registry }: { children: unknown; registry: unknown }) => {
    state.registries.push(registry);
    return children;
  },
}));
vi.mock("#native/conversation-list/conversation-list-icons.constant", () => ({
  CONVERSATION_LIST_ICONS: { name: "conversation-list-icons" },
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: "ltr" }),
}));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as never),
  };
});
vi.mock("#native/action-menu/action-menu", () => ({
  ActionMenu: (props: Record<string, unknown>) => {
    state.menus.push(props);
    return null;
  },
}));
vi.mock("#native/empty-state/empty-state", () => ({ EmptyState: () => null }));

const NOW = new Date(2026, 9, 30, 12, 0);

const CONVERSATIONS = [
  { id: "pinned", title: "Shipping to Riyadh", updatedAt: new Date(2026, 8, 1), isPinned: true },
  { id: "today", title: "Abaya sizes", updatedAt: new Date(2026, 9, 30, 9, 0) },
];

/** The items of each menu, in draw order. */
const menuItems = (): (readonly MenuItem[])[] =>
  state.menus.map((menu) => (menu["sections"] as MenuSection[])[0]?.items ?? []);

describe("ConversationList menu (native)", () => {
  beforeEach(() => {
    state.views = [];
    state.menus = [];
    state.registries = [];
  });

  it("pins, unpins, renames and deletes by id", () => {
    const onPinChange = vi.fn();
    const onRename = vi.fn();
    const onDelete = vi.fn();
    render(
      <ConversationList
        conversations={CONVERSATIONS}
        onPinChange={onPinChange}
        onRename={onRename}
        onDelete={onDelete}
        now={NOW}
      />,
    );
    const [pinned = [], today = []] = menuItems();
    expect(pinned.map((item) => [item.id, item.label, item.icon])).toEqual([
      ["pin", "Unpin", "pin-off"],
      ["rename", "Rename", "pencil"],
      ["delete", "Delete", "trash"],
    ]);
    expect(today[0]).toMatchObject({ label: "Pin", icon: "pin" });
    pinned[0]?.onPress?.();
    expect(onPinChange).toHaveBeenLastCalledWith("pinned", false);
    today[0]?.onPress?.();
    expect(onPinChange).toHaveBeenLastCalledWith("today", true);
    today[1]?.onPress?.();
    expect(onRename).toHaveBeenCalledWith("today");
    pinned[2]?.onPress?.();
    expect(onDelete).toHaveBeenCalledWith("pinned");
  });

  it("names the list, keeps the class and nests its own icons", () => {
    render(
      <ConversationList conversations={CONVERSATIONS} label="Chats" className="p-2" now={NOW} />,
    );
    expect(state.views[0]).toMatchObject({ accessibilityLabel: "Chats" });
    expect(String(state.views[0]?.["className"])).toContain("p-2");
    expect(state.registries).toEqual([{ name: "conversation-list-icons" }]);
    render(<ConversationList conversations={[]} />);
    expect(state.registries).toHaveLength(2);
  });
});
