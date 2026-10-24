/**
 * Stackra file contract:
 * Purpose: proves the native Menu hands HeroUI Native's root the open state under its own names, wraps the trigger with
 *          `asChild`, opens as a popover or a bottom sheet with the same presentation on root and content, turns a
 *          logical side into a physical one by text direction, draws each section as a named group with a divider
 *          between, draws an action as an item with its icon in the item's tone, title and second line (a disabled
 *          action's reason in the description's place) and no shortcut, runs `onPress`, follows the `href` through the
 *          RouterProvider or the system browser and then calls `onAction`, scopes selection to a section in one flat
 *          list, nests a submenu, and that the type refuses HeroUI's own `isDefaultOpen`.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native and the native Icon are replaced by
 *           recording stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-107
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { MenuContractProps } from "#contracts/types/menu-contract-props.type";
import type { MenuSection } from "#contracts/types/menu-section.type";
import { Menu, type MenuProps } from "#native/menu/menu";
import { RouterProvider } from "#native/router-provider/router-provider";

/** What the stand-ins were last handed: by name, and every group, item and icon in draw order. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  groups: [] as Record<string, unknown>[],
  items: [] as Record<string, unknown>[],
  icons: [] as Record<string, unknown>[],
  isRtl: false,
  openURL: undefined as unknown as (url: string) => Promise<void>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    Linking: { openURL: (url: string) => received.openURL(url) },
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

vi.mock("#native/icon/icon", async () => {
  const { createElement } = await import("react");
  return {
    Icon: (props: Record<string, unknown>) => {
      received.icons.push(props);
      return createElement("i", { "data-testid": "icon", "data-name": String(props["name"]) });
    },
  };
});

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    if (name === "group") received.groups.push(props);
    if (name === "item") received.items.push(props);
    return createElement(
      "div",
      { "data-testid": name },
      name === "item"
        ? createElement(
            "button",
            { type: "button", onClick: () => (props["onPress"] as (() => void) | undefined)?.() },
            props["children"] as ReactNode,
          )
        : (props["children"] as ReactNode),
    );
  };
  return {
    Menu: Object.assign(record("root"), {
      Trigger: record("trigger"),
      Portal: record("portal"),
      Overlay: record("overlay"),
      Content: record("content"),
      Group: record("group"),
      Label: record("label"),
      Item: record("item"),
      ItemTitle: record("item-title"),
      ItemDescription: record("item-description"),
      ItemIndicator: record("item-indicator"),
    }),
    SubMenu: Object.assign(record("submenu"), {
      Trigger: record("submenu-trigger"),
      TriggerIndicator: record("submenu-indicator"),
      Content: record("submenu-content"),
    }),
    Separator: record("separator"),
    useIsRTL: () => received.isRtl,
  };
});

const propsOf = (name: string) => received.props[name] ?? {};
const count = (container: HTMLElement, name: string) =>
  container.querySelectorAll(`[data-testid="${name}"]`).length;

const SECTIONS: readonly MenuSection[] = [
  {
    id: "edit",
    title: "Edit",
    items: [
      { id: "rename", label: "Rename", shortcut: "⌘R", icon: "pencil" },
      { id: "duplicate", label: "Duplicate", description: "Make a copy" },
    ],
  },
  {
    id: "danger",
    title: "Danger zone",
    isTitleHidden: true,
    items: [
      { id: "delete", label: "Delete", tone: "danger", icon: "trash" },
      { id: "archive", label: "Archive", isDisabled: true, disabledReason: "Paid orders stay" },
    ],
  },
];

const trigger = <button type="button">Open</button>;

const renderMenu = (props: Partial<MenuProps> = {}) =>
  render(
    <Menu sections={SECTIONS} {...props}>
      {trigger}
    </Menu>,
  );

describe("Menu (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.groups = [];
    received.items = [];
    received.icons = [];
    received.isRtl = false;
    received.openURL = vi.fn(() => Promise.resolve());
  });

  it("hands the root the open state under HeroUI Native's names and wraps the trigger with asChild", () => {
    const onOpenChange = vi.fn();
    const { container } = renderMenu({ isOpen: true, defaultOpen: false, onOpenChange });
    expect(propsOf("root")).toMatchObject({ isOpen: true, isDefaultOpen: false, onOpenChange });
    expect(propsOf("root")).not.toHaveProperty("defaultOpen");
    expect(propsOf("trigger")["asChild"]).toBe(true);
    expect(container.querySelector('[data-testid="trigger"] button')?.textContent).toBe("Open");
  });

  it("leaves the open state out when the app gives none, and passes other props through", () => {
    renderMenu({ isDisabled: true });
    expect(propsOf("root")).not.toHaveProperty("isOpen");
    expect(propsOf("root")).not.toHaveProperty("isDefaultOpen");
    expect(propsOf("root")["isDisabled"]).toBe(true);
  });

  it("opens as a popover with the same presentation on root and content, or as a bottom sheet", () => {
    const { unmount } = renderMenu();
    expect(propsOf("root")["presentation"]).toBe("popover");
    expect(propsOf("content")["presentation"]).toBe("popover");
    unmount();
    renderMenu({ presentation: "bottom-sheet", placement: "end", align: "end" });
    expect(propsOf("root")["presentation"]).toBe("bottom-sheet");
    expect(propsOf("content")).toMatchObject({ presentation: "bottom-sheet" });
    // A sheet has no anchor, so it is given no side.
    expect(propsOf("content")).not.toHaveProperty("placement");
    expect(propsOf("content")).not.toHaveProperty("align");
  });

  it("turns a logical side into a physical one by text direction", () => {
    const { unmount } = renderMenu({ placement: "end", align: "start" });
    expect(propsOf("content")).toMatchObject({ placement: "right", align: "start" });
    unmount();
    received.isRtl = true;
    const second = renderMenu({ placement: "end" });
    expect(propsOf("content")["placement"]).toBe("left");
    second.unmount();
    renderMenu({ placement: "top" });
    expect(propsOf("content")["placement"]).toBe("top");
  });

  it("gives the content no side when the app gives none", () => {
    renderMenu();
    expect(propsOf("content")).not.toHaveProperty("placement");
    expect(propsOf("content")).not.toHaveProperty("align");
  });

  it("draws each section as a named group with a divider between, and a label only when its title shows", () => {
    const { container } = renderMenu();
    expect(received.groups.map((group) => group["accessibilityLabel"])).toEqual([
      "Edit",
      "Danger zone",
    ]);
    expect(count(container, "separator")).toBe(1);
    expect(count(container, "label")).toBe(1);
    expect(container.querySelector('[data-testid="label"]')?.textContent).toBe("Edit");
  });

  it("draws an action as an item with its title, second line, variant and disabled state", () => {
    const { container } = renderMenu();
    expect(received.items.map((item) => item["id"])).toEqual([
      "rename",
      "duplicate",
      "delete",
      "archive",
    ]);
    expect(received.items.map((item) => item["variant"])).toEqual([
      "default",
      "default",
      "danger",
      "default",
    ]);
    expect(received.items.map((item) => item["isDisabled"])).toEqual([false, false, false, true]);
    const descriptions = [...container.querySelectorAll('[data-testid="item-description"]')];
    // The disabled action says why in the description's place.
    expect(descriptions.map((node) => node.textContent)).toEqual([
      "Make a copy",
      "Paid orders stay",
    ]);
  });

  it("draws an icon name through Icon in the item's tone and an element as given, and no shortcut", () => {
    const sections: readonly MenuSection[] = [
      {
        id: "only",
        title: "Only",
        items: [
          { id: "a", label: "A", icon: "pencil", shortcut: "⌘A" },
          { id: "b", label: "B", icon: "trash", tone: "danger" },
          { id: "c", label: "C", icon: <i data-testid="own-icon" /> },
        ],
      },
    ];
    const { container } = renderMenu({ sections });
    expect(received.icons).toEqual([
      { name: "pencil", size: "sm", tone: "default" },
      { name: "trash", size: "sm", tone: "danger" },
    ]);
    expect(container.querySelector('[data-testid="own-icon"]')).toBeTruthy();
    expect(container.textContent).not.toContain("⌘A");
  });

  it("runs onPress, then the href, then onAction with the key", () => {
    const calls: string[] = [];
    const navigate = vi.fn((href: string) => calls.push(`navigate:${href}`));
    const sections: readonly MenuSection[] = [
      {
        id: "only",
        title: "Only",
        items: [
          {
            id: "view",
            label: "View",
            href: "/orders/ord_1",
            onPress: () => calls.push("onPress"),
          },
        ],
      },
    ];
    render(
      <RouterProvider navigate={navigate}>
        <Menu sections={sections} onAction={(id) => calls.push(`onAction:${id}`)}>
          {trigger}
        </Menu>
      </RouterProvider>,
    );
    fireEvent.click(screen.getByText("View").closest("button") as HTMLElement);
    expect(calls).toEqual(["onPress", "navigate:/orders/ord_1", "onAction:view"]);
  });

  it("opens an absolute URL in the system browser, and an app path through the router or, without one, the browser", () => {
    const sections: readonly MenuSection[] = [
      {
        id: "only",
        title: "Only",
        items: [
          { id: "docs", label: "Docs", href: "https://example.com/docs" },
          { id: "path", label: "Path", href: "/orders" },
        ],
      },
    ];
    const navigate = vi.fn();
    const { unmount } = render(
      <RouterProvider navigate={navigate}>
        <Menu sections={sections}>{trigger}</Menu>
      </RouterProvider>,
    );
    fireEvent.click(screen.getByText("Docs").closest("button") as HTMLElement);
    expect(received.openURL).toHaveBeenCalledExactlyOnceWith("https://example.com/docs");
    expect(navigate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Path").closest("button") as HTMLElement);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/orders");
    unmount();

    // `vi.fn` records calls across the two renders, so a fresh one proves the second.
    received.openURL = vi.fn(() => Promise.resolve());
    renderMenu({ sections });
    fireEvent.click(screen.getByText("Path").closest("button") as HTMLElement);
    expect(received.openURL).toHaveBeenCalledExactlyOnceWith("/orders");
  });

  it("warns without the URL when the system browser refuses it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    received.openURL = vi.fn(() => Promise.reject(new Error("no")));
    const sections: readonly MenuSection[] = [
      {
        id: "only",
        title: "Only",
        items: [{ id: "docs", label: "Docs", href: "https://x.test/?t=secret" }],
      },
    ];
    renderMenu({ sections });
    fireEvent.click(screen.getByText("Docs").closest("button") as HTMLElement);
    await vi.waitFor(() => expect(warn).toHaveBeenCalledOnce());
    expect(String(warn.mock.calls[0]?.[0])).not.toContain("secret");
    warn.mockRestore();
  });

  it("scopes selection to a section and keeps one flat list", () => {
    const onChange = vi.fn();
    const sections: readonly MenuSection[] = [
      {
        id: "order",
        title: "Order",
        items: [
          { id: "asc", label: "Ascending" },
          { id: "desc", label: "Descending" },
        ],
      },
      {
        id: "by",
        title: "Sort by",
        items: [
          { id: "name", label: "Name" },
          { id: "date", label: "Date" },
        ],
      },
    ];
    const { container } = renderMenu({
      sections,
      selectionMode: "single",
      defaultValue: ["asc", "name"],
      onChange,
    });
    expect(received.groups.map((group) => group["selectionMode"])).toEqual(["single", "single"]);
    expect(received.groups.map((group) => group["selectedKeys"])).toEqual([["asc"], ["name"]]);
    expect(count(container, "item-indicator")).toBe(4);
    const change = received.groups[0]?.["onSelectionChange"] as (keys: Set<string>) => void;
    change(new Set(["desc"]));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(["name", "desc"]);
  });

  it("follows `value` when controlled and draws no selection mark without a selection mode", () => {
    const { container, rerender } = renderMenu({ selectionMode: "multiple", value: ["delete"] });
    expect(received.groups.map((group) => group["selectedKeys"])).toEqual([[], ["delete"]]);
    received.groups = [];
    rerender(<Menu sections={SECTIONS}>{trigger}</Menu>);
    expect(received.groups.map((group) => group["selectionMode"])).toEqual(["none", "none"]);
    expect(count(container, "item-indicator")).toBe(0);
  });

  it("nests a submenu whose items are not selectable", () => {
    const onAction = vi.fn();
    const sections: readonly MenuSection[] = [
      {
        id: "file",
        title: "File",
        items: [{ id: "export", label: "Export", items: [{ id: "pdf", label: "As PDF" }] }],
      },
    ];
    const { container } = renderMenu({ sections, selectionMode: "multiple", onAction });
    expect(propsOf("submenu-trigger")["textValue"]).toBe("Export");
    expect(container.querySelector('[data-testid="submenu-content"]')?.textContent).toContain(
      "As PDF",
    );
    expect(count(container, "item-indicator")).toBe(0);
    fireEvent.click(screen.getByText("As PDF").closest("button") as HTMLElement);
    expect(onAction).toHaveBeenCalledExactlyOnceWith("pdf");
  });

  it("types: extends the contract and refuses HeroUI Native's `isDefaultOpen`", () => {
    expectTypeOf<MenuProps>().toExtend<MenuContractProps>();
    void (
      (
        // @ts-expect-error the starting state is `defaultOpen`
        <Menu sections={SECTIONS} isDefaultOpen>
          {trigger}
        </Menu>
      )
    );
    void (
      (
        // @ts-expect-error a menu needs its sections
        <Menu>{trigger}</Menu>
      )
    );
  });
});
