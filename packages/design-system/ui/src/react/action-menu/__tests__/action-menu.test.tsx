/**
 * Stackra file contract:
 * Purpose: proves the web ActionMenu is an icon-only button named by `label` that opens a Menu of grouped actions, draws
 *          the `ellipsis` icon unless given another, takes the contract's variant, size and disabled state, refuses to
 *          open while disabled, runs an action's `onPress` and then `onAction`, keeps a click or an Enter on the button
 *          or inside the menu from reaching the row around it, passes the Menu's own props through, and that the type
 *          needs a label and sections and refuses a trigger and a selection.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement); WCAG 2.2 SC 4.1.2.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-106 sta-350:FR-108
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Ellipsis } from "lucide-react";

import type { ActionMenuContractProps } from "#contracts/types/action-menu-contract-props.type";
import type { MenuSection } from "#contracts/types/menu-section.type";
import { ActionMenu, type ActionMenuProps } from "#react/action-menu/action-menu";

const press = (element: HTMLElement) => act(() => element.click());

const SECTIONS: readonly MenuSection[] = [
  {
    id: "edit",
    title: "Edit",
    isTitleHidden: true,
    items: [
      { id: "rename", label: "Rename", shortcut: "⌘R", icon: <i data-testid="rename-icon" /> },
      { id: "archive", label: "Archive", isDisabled: true, disabledReason: "Paid orders stay" },
    ],
  },
  {
    id: "danger",
    title: "Danger zone",
    isTitleHidden: true,
    items: [{ id: "delete", label: "Delete", tone: "danger" }],
  },
];

const icon = <i data-testid="icon" />;
const moreButton = () => screen.getByRole<HTMLButtonElement>("button", { name: "More" });

describe("ActionMenu (web)", () => {
  it("is an icon-only button named by its label that opens a menu", () => {
    render(<ActionMenu label="Actions for order 1001" icon={icon} sections={SECTIONS} />);
    const button = screen.getByRole("button", { name: "Actions for order 1001" });
    expect(button.classList.contains("button--icon-only")).toBe(true);
    expect(button.querySelector('[data-testid="icon"]')).toBeTruthy();
    press(button);
    expect(screen.getByRole("menu", { name: "Actions for order 1001" })).toBeTruthy();
  });

  it("draws the ellipsis icon unless given another", () => {
    render(
      <IconRegistryProvider registry={defineIconRegistry({ ellipsis: Ellipsis })}>
        <ActionMenu label="More" sections={SECTIONS} />
      </IconRegistryProvider>,
    );
    expect(
      screen.getByRole("button", { name: "More" }).querySelector("svg.lucide-ellipsis"),
    ).toBeTruthy();
  });

  it("draws grouped actions with icons, shortcut hints, a danger tone and a disabled reason", () => {
    render(<ActionMenu label="More" icon={icon} sections={SECTIONS} />);
    press(screen.getByRole("button", { name: "More" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getAllByRole("group")).toHaveLength(2);
    const rename = within(menu).getByRole("menuitem", { name: /^Rename/ });
    expect(rename.querySelector('[data-testid="rename-icon"]')).toBeTruthy();
    expect(rename.querySelector("kbd")?.textContent).toBe("⌘R");
    expect(
      within(menu)
        .getByRole("menuitem", { name: /^Delete/ })
        .classList.contains("menu-item--danger"),
    ).toBe(true);
    const archive = within(menu).getByRole("menuitem", { name: /^Archive/ });
    expect(archive.getAttribute("aria-disabled")).toBe("true");
    expect(within(archive).getByText("Paid orders stay")).toBeTruthy();
  });

  it("takes the variant, the size and the disabled state, and never opens while disabled", () => {
    const { rerender } = render(
      <ActionMenu label="More" icon={icon} sections={SECTIONS} variant="secondary" size="lg" />,
    );
    expect(moreButton().classList.contains("button--secondary")).toBe(true);
    expect(moreButton().classList.contains("button--lg")).toBe(true);
    rerender(<ActionMenu label="More" icon={icon} sections={SECTIONS} />);
    expect(moreButton().classList.contains("button--ghost")).toBe(true);
    rerender(<ActionMenu label="More" icon={icon} sections={SECTIONS} isDisabled />);
    expect(moreButton().disabled).toBe(true);
    press(moreButton());
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("runs an action's onPress and then onAction with its key", () => {
    const calls: string[] = [];
    const sections: readonly MenuSection[] = [
      {
        id: "edit",
        title: "Edit",
        isTitleHidden: true,
        items: [{ id: "rename", label: "Rename", onPress: () => calls.push("onPress") }],
      },
    ];
    render(
      <ActionMenu
        label="More"
        icon={icon}
        sections={sections}
        onAction={(id) => calls.push(`onAction:${id}`)}
      />,
    );
    press(screen.getByRole("button", { name: "More" }));
    press(screen.getByRole("menuitem", { name: /^Rename/ }));
    expect(calls).toEqual(["onPress", "onAction:rename"]);
  });

  it("keeps a click on the button or in the menu from reaching the row around it", () => {
    const onRowClick = vi.fn();
    render(
      // A row that opens its record on a click, as a table row does.
      // oxlint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- the test row stands in for a clickable table row
      <div onClick={onRowClick}>
        <ActionMenu label="More" icon={icon} sections={SECTIONS} />
      </div>,
    );
    press(screen.getByRole("button", { name: "More" }));
    press(screen.getByRole("menuitem", { name: /^Rename/ }));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("keeps Enter and Space inside the menu from reaching the row's key handler", () => {
    const onRowKeyDown = vi.fn();
    render(
      // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- the test row stands in for a keyboard-aware table row
      <div onKeyDown={onRowKeyDown}>
        <ActionMenu label="More" icon={icon} sections={SECTIONS} />
      </div>,
    );
    press(screen.getByRole("button", { name: "More" }));
    const rename = screen.getByRole("menuitem", { name: /^Rename/ });
    fireEvent.keyDown(rename, { key: "Enter" });
    fireEvent.keyDown(rename, { key: " " });
    expect(onRowKeyDown).not.toHaveBeenCalled();
  });

  it("passes the Menu's own props through and opens by `defaultOpen`", () => {
    render(<ActionMenu label="More" icon={icon} sections={SECTIONS} defaultOpen trigger="press" />);
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("types: extends the contract, needs a label and sections, and refuses a trigger and a selection", () => {
    expectTypeOf<ActionMenuProps>().toExtend<ActionMenuContractProps>();
    // Elements are made, not rendered: the point is what the compiler refuses.
    // @ts-expect-error nothing else names an icon-only button
    void (<ActionMenu sections={SECTIONS} />);
    // @ts-expect-error a menu needs its actions
    void (<ActionMenu label="More" />);
    void (
      (
        // @ts-expect-error the button is the component's own
        <ActionMenu label="More" sections={SECTIONS}>
          x
        </ActionMenu>
      )
    );
    // @ts-expect-error an action menu keeps no selection
    void (<ActionMenu label="More" sections={SECTIONS} selectionMode="single" />);
  });
});
