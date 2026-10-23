/**
 * Stackra file contract:
 * Purpose: proves the web Menu opens from its trigger and names itself by it, draws each section as a named group with a
 *          divider between sections and a heading only when its title shows, draws an action with its icon, label,
 *          second line and shortcut hint, shows a disabled action's reason as its second line and refuses it, colours a
 *          danger action, makes a link of an action with an `href`, runs `onPress` and then `onAction` with the key and
 *          closes, keeps selection scoped to a section in one flat list (single, multiple, controlled), opens a
 *          submenu, runs controlled and uncontrolled, passes Dropdown's own props through, and that the type refuses a
 *          missing section list and trigger.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement); WCAG 2.2 SC 4.1.2.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-107
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import type { MenuContractProps } from "#contracts/types/menu-contract-props.type";
import type { MenuSection } from "#contracts/types/menu-section.type";
import { Button } from "#react/button/button";
import { Menu, type MenuProps } from "#react/menu/menu";

const press = (element: HTMLElement) => act(() => element.click());

/** Opens the menu the way a user does and returns it. */
const open = () => {
  press(screen.getByRole("button", { name: "Open" }));
  return screen.getByRole("menu", { name: "Open" });
};

const SECTIONS: readonly MenuSection[] = [
  {
    id: "edit",
    title: "Edit",
    items: [
      { id: "rename", label: "Rename", shortcut: "⌘R", icon: <i data-testid="rename-icon" /> },
      { id: "duplicate", label: "Duplicate", description: "Make a copy" },
    ],
  },
  {
    id: "danger",
    title: "Danger zone",
    isTitleHidden: true,
    items: [
      { id: "delete", label: "Delete", tone: "danger" },
      { id: "archive", label: "Archive", isDisabled: true, disabledReason: "Paid orders stay" },
    ],
  },
];

const renderMenu = (props: Partial<MenuProps> = {}) =>
  render(
    <Menu sections={SECTIONS} {...props}>
      <Button>Open</Button>
    </Menu>,
  );

describe("Menu (web)", () => {
  it("opens from its trigger and is named by it", () => {
    renderMenu();
    expect(screen.queryByRole("menu")).toBeNull();
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("true");
    open();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("draws each section as a named group, with a divider between and a heading only when its title shows", () => {
    renderMenu();
    const menu = open();
    expect(within(menu).getByRole("group", { name: "Edit" })).toBeTruthy();
    expect(within(menu).getByRole("group", { name: "Danger zone" })).toBeTruthy();
    // The shown title is a heading; the hidden one only names its group.
    expect(within(menu).getByText("Edit")).toBeTruthy();
    expect(within(menu).queryByText("Danger zone")).toBeNull();
    expect(within(menu).getAllByRole("separator")).toHaveLength(1);
  });

  it("draws an action with its icon, label, second line and shortcut hint", () => {
    renderMenu();
    const menu = open();
    const rename = within(menu).getByRole("menuitem", { name: "Rename" });
    expect(rename.querySelector('[data-testid="rename-icon"]')).toBeTruthy();
    expect(rename.querySelector("kbd")?.textContent).toBe("⌘R");
    const duplicate = within(menu).getByRole("menuitem", { name: "Duplicate" });
    expect(duplicate.getAttribute("aria-describedby")).toContain(
      within(duplicate).getByText("Make a copy").id,
    );
  });

  it("shows why a disabled action is refused as its second line, and refuses it", () => {
    const onPress = vi.fn();
    const onAction = vi.fn();
    const sections: readonly MenuSection[] = [
      {
        id: "only",
        title: "Only",
        items: [
          {
            id: "archive",
            label: "Archive",
            isDisabled: true,
            disabledReason: "Paid orders stay",
            onPress,
          },
        ],
      },
    ];
    renderMenu({ sections, onAction });
    const archive = within(open()).getByRole("menuitem", { name: "Archive" });
    expect(archive.getAttribute("aria-disabled")).toBe("true");
    expect(archive.getAttribute("aria-describedby")).toContain(
      within(archive).getByText("Paid orders stay").id,
    );
    press(archive);
    expect(onPress).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("colours a danger action and leaves the others default", () => {
    renderMenu();
    const menu = open();
    expect(
      within(menu)
        .getByRole("menuitem", { name: "Delete" })
        .classList.contains("menu-item--danger"),
    ).toBe(true);
    expect(
      within(menu)
        .getByRole("menuitem", { name: "Rename" })
        .classList.contains("menu-item--default"),
    ).toBe(true);
  });

  it("makes a link of an action with an href", () => {
    const sections: readonly MenuSection[] = [
      {
        id: "go",
        title: "Go",
        items: [{ id: "view", label: "View order", href: "/orders/ord_1" }],
      },
    ];
    renderMenu({ sections });
    const link = within(open()).getByRole("menuitem", { name: "View order" });
    expect(link.getAttribute("href")).toBe("/orders/ord_1");
  });

  it("runs the action's onPress, then onAction with its key, and closes", async () => {
    const calls: string[] = [];
    const sections: readonly MenuSection[] = [
      {
        id: "edit",
        title: "Edit",
        items: [{ id: "rename", label: "Rename", onPress: () => calls.push("onPress") }],
      },
    ];
    renderMenu({ sections, onAction: (id) => calls.push(`onAction:${id}`) });
    press(within(open()).getByRole("menuitem", { name: "Rename" }));
    expect(calls).toEqual(["onPress", "onAction:rename"]);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("keeps a single choice per section in one flat list", () => {
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
    renderMenu({ sections, selectionMode: "single", defaultValue: ["asc", "name"], onChange });
    const menu = open();
    const checked = (name: string) =>
      within(menu).getByRole("menuitemradio", { name }).getAttribute("aria-checked");
    expect(checked("Ascending")).toBe("true");
    expect(checked("Name")).toBe("true");
    press(within(menu).getByRole("menuitemradio", { name: "Descending" }));
    // The other section's choice stays; the changed section's replaces its own.
    expect(onChange).toHaveBeenCalledExactlyOnceWith(["name", "desc"]);
  });

  it("keeps several choices with `multiple`", () => {
    const onChange = vi.fn();
    const sections: readonly MenuSection[] = [
      {
        id: "columns",
        title: "Columns",
        items: [
          { id: "a", label: "Alpha" },
          { id: "b", label: "Beta" },
        ],
      },
    ];
    renderMenu({ sections, selectionMode: "multiple", defaultValue: ["a"], onChange });
    press(within(open()).getByRole("menuitemcheckbox", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(["a", "b"]);
  });

  it("shows `value` when controlled", () => {
    const sections: readonly MenuSection[] = [
      {
        id: "columns",
        title: "Columns",
        items: [
          { id: "a", label: "Alpha" },
          { id: "b", label: "Beta" },
        ],
      },
    ];
    renderMenu({ sections, selectionMode: "multiple", value: ["b"], defaultOpen: true });
    const menu = screen.getByRole("menu");
    const checked = (name: string) =>
      within(menu).getByRole("menuitemcheckbox", { name }).getAttribute("aria-checked");
    expect(checked("Alpha")).toBe("false");
    expect(checked("Beta")).toBe("true");
  });

  it("opens a submenu from an action that has items", async () => {
    const onAction = vi.fn();
    const onPress = vi.fn();
    const sections: readonly MenuSection[] = [
      {
        id: "file",
        title: "File",
        items: [
          {
            id: "export",
            label: "Export",
            items: [
              { id: "pdf", label: "As PDF", onPress },
              { id: "csv", label: "As CSV" },
            ],
          },
        ],
      },
    ];
    renderMenu({ sections, onAction });
    const parent = within(open()).getByRole("menuitem", { name: "Export" });
    expect(parent.getAttribute("aria-haspopup")).toBe("menu");
    fireEvent.keyDown(parent, { key: "ArrowRight" });
    press(await screen.findByRole("menuitem", { name: "As PDF" }));
    expect(onPress).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledExactlyOnceWith("pdf");
  });

  it("opens by `defaultOpen`, and runs controlled by `isOpen` reporting `onOpenChange`", () => {
    const { unmount } = renderMenu({ defaultOpen: true });
    expect(screen.getByRole("menu")).toBeTruthy();
    unmount();

    const onOpenChange = vi.fn();
    renderMenu({ isOpen: true, onOpenChange });
    press(screen.getByRole("button", { name: "Open" }));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    // Controlled: the app did not close it, so it stays open.
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("passes Dropdown's own props through", () => {
    renderMenu({ trigger: "longPress" });
    press(screen.getByRole("button", { name: "Open" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("types: extends the contract and needs its sections and one trigger", () => {
    expectTypeOf<MenuProps>().toExtend<MenuContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    void (
      (
        // @ts-expect-error a menu needs its sections
        <Menu>
          <Button>Open</Button>
        </Menu>
      )
    );
    // @ts-expect-error the trigger is the menu's one child element, never text
    void (<Menu sections={SECTIONS}>Open</Menu>);
  });
});
