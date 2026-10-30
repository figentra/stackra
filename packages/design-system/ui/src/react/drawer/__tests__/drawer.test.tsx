/**
 * Stackra file contract:
 * Purpose: proves the web Drawer opens from its trigger, `defaultOpen` and `isOpen`, reports every change through
 *          `onOpenChange`, is a dialog named by its title or its `label`, closes on a press outside and on Escape
 *          unless `isDismissable` or `isKeyboardDismissDisabled` says otherwise, opens on the `end` edge by default and
 *          gives HeroUI the edge for each logical side (`start` is its `left` and `end` its `right`, whatever the
 *          text direction, because HeroUI lays them out with flexbox), shows the drag handle on the bottom edge only,
 *          passes dialog props through, draws a title at level 2 or the level asked for, closes from `Drawer.Close`
 *          and from a `slot="close"` button, and refuses the raw HeroUI names the contract replaces.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks, and
 *           the edge the drawer really sits on in each direction is the e2e suite's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decisions 1 and 2); ADR 0060 (right-to-left); WCAG 2.2 SC 2.1.2
 *          and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-099
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";

import type { DrawerContractProps } from "#contracts/types/drawer-contract-props.type";
import type { OverlayTitleContractProps } from "#contracts/types/overlay-title-contract-props.type";
import { Button } from "#react/button/button";
import { Drawer } from "#react/drawer/drawer";
import type { DrawerProps } from "#react/drawer/drawer.props";
import type { DrawerTitleProps } from "#react/drawer/drawer-title.props";

const press = (element: HTMLElement) => act(() => element.click());

/** A drawer with a trigger and the usual parts; the caller's props win over the defaults. */
function sample(props: Partial<DrawerProps> = {}): ReactElement {
  return (
    <Drawer trigger={<Button>Open</Button>} {...props}>
      <Drawer.Close label="Close" />
      <Drawer.Header>
        <Drawer.Title>Order details</Drawer.Title>
      </Drawer.Header>
      <Drawer.Body>Body</Drawer.Body>
      <Drawer.Footer>
        <Button slot="close">Cancel</Button>
      </Drawer.Footer>
    </Drawer>
  );
}

/** The backdrop, which React Aria treats as "outside" the dialog. */
const backdrop = () => {
  const found = document.querySelector('[data-slot="drawer-backdrop"]');
  if (!found) throw new Error("the drawer is not open");
  return found as HTMLElement;
};

/** A press on the backdrop, sent as the pointer events and as the mouse events, so either path of React Aria sees it. */
const pressOutside = () =>
  act(() => {
    const target = backdrop();
    for (const type of ["pointerDown", "pointerUp", "mouseDown", "mouseUp", "click"] as const)
      fireEvent[type](target);
  });

const pressEscape = () => fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

/** The edge HeroUI drew the open drawer on, read from its content element. */
const edge = () =>
  screen
    .getByRole("dialog")
    .closest('[data-slot="drawer-content"]')
    ?.getAttribute("data-placement");

describe("Drawer (web)", () => {
  it("stays closed until its trigger is pressed, then is a dialog named by its title", () => {
    render(sample());
    expect(screen.queryByRole("dialog")).toBeNull();
    // Held before opening: React Aria hides the page behind an open drawer, so a role query would not find it then.
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    press(trigger);
    expect(screen.getByRole("dialog", { name: "Order details" })).toBeTruthy();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("opens at once from `defaultOpen`", () => {
    render(sample({ defaultOpen: true }));
    expect(screen.getByRole("dialog", { name: "Order details" })).toBeTruthy();
  });

  it("is driven by `isOpen` when controlled", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(sample({ isOpen: false, onOpenChange }));
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(sample({ isOpen: true, onOpenChange }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    // A controlled drawer asks to close and stays open until the app agrees.
    press(screen.getByRole("button", { name: "Close, Esc" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeTruthy();
    rerender(sample({ isOpen: false, onOpenChange }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("reports opening and closing through `onOpenChange`", () => {
    const onOpenChange = vi.fn();
    render(sample({ onOpenChange }));
    press(screen.getByRole("button", { name: "Open" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    press(screen.getByRole("button", { name: "Close, Esc" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is named by `label` when it has no title", () => {
    render(
      <Drawer defaultOpen label="Filters">
        <Drawer.Body>Body</Drawer.Body>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeTruthy();
  });

  it("closes on a press outside it, unless `isDismissable` is false", () => {
    const onOpenChange = vi.fn();
    const { unmount } = render(sample({ defaultOpen: true, onOpenChange }));
    pressOutside();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();
    const stay = vi.fn();
    render(sample({ defaultOpen: true, isDismissable: false, onOpenChange: stay }));
    pressOutside();
    expect(stay).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("closes on Escape, unless `isKeyboardDismissDisabled` is set", () => {
    const { unmount } = render(sample({ defaultOpen: true }));
    pressEscape();
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();
    const stay = vi.fn();
    render(sample({ defaultOpen: true, isKeyboardDismissDisabled: true, onOpenChange: stay }));
    pressEscape();
    expect(stay).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("opens on the end edge by default", () => {
    render(sample({ defaultOpen: true }));
    expect(edge()).toBe("right");
  });

  it.each([
    ["start", "left"],
    ["end", "right"],
    ["top", "top"],
    ["bottom", "bottom"],
  ] as const)("gives HeroUI the %s edge as its %s", (placement, expected) => {
    render(sample({ defaultOpen: true, placement }));
    expect(edge()).toBe(expected);
  });

  it("shows the drag handle on the bottom edge only", () => {
    const { unmount } = render(sample({ defaultOpen: true, placement: "bottom" }));
    expect(document.querySelector('[data-slot="drawer-handle"]')).not.toBeNull();
    unmount();
    render(sample({ defaultOpen: true, placement: "end" }));
    expect(document.querySelector('[data-slot="drawer-handle"]')).toBeNull();
  });

  it("passes dialog props through", () => {
    render(sample({ defaultOpen: true, id: "order-drawer", className: "extra" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.id).toBe("order-drawer");
    expect(dialog.classList.contains("extra")).toBe(true);
    expect(dialog.getAttribute("data-slot")).toBe("drawer-dialog");
  });

  it("draws the parts in HeroUI's slots", () => {
    render(sample({ defaultOpen: true }));
    const dialog = screen.getByRole("dialog");
    for (const slot of ["close-trigger", "header", "heading", "body", "footer"])
      expect(dialog.querySelector(`[data-slot="drawer-${slot}"]`), slot).not.toBeNull();
  });

  it("draws the title as a level-2 heading, or the level asked for", () => {
    const { rerender } = render(sample({ defaultOpen: true }));
    expect(screen.getByRole("heading", { level: 2, name: "Order details" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Order details" }).classList.contains("drawer__heading"),
    ).toBe(true);
    rerender(
      <Drawer defaultOpen>
        <Drawer.Title level={5}>Deep</Drawer.Title>
      </Drawer>,
    );
    expect(screen.getByRole("heading", { level: 5, name: "Deep" })).toBeTruthy();
  });

  it("closes from `Drawer.Close`, named by its label, and from a `slot=close` button", () => {
    const { unmount } = render(sample({ defaultOpen: true }));
    const close = screen.getByRole("button", { name: "Close, Esc" });
    expect(close.getAttribute("data-slot")).toBe("drawer-close-trigger");
    press(close);
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();
    render(sample({ defaultOpen: true }));
    press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("lets `Drawer.Close` take its own icon, press handler and disabled state", () => {
    const onPress = vi.fn();
    render(
      <Drawer defaultOpen label="Close test">
        <Drawer.Close label="Close panel" onPress={onPress} icon={<i data-testid="mine" />} />
        <Drawer.Close label="Disabled" isDisabled />
      </Drawer>,
    );
    expect(
      within(screen.getByRole("button", { name: "Close panel, Esc" })).getByTestId("mine"),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Disabled, Esc" }).hasAttribute("disabled")).toBe(
      true,
    );
    press(screen.getByRole("button", { name: "Close panel, Esc" }));
    expect(onPress).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("types: extends the contracts and refuses the raw names the contract replaces", () => {
    expectTypeOf<DrawerProps>().toExtend<DrawerContractProps>();
    expectTypeOf<DrawerTitleProps>().toExtend<OverlayTitleContractProps>();
    // HeroUI's physical edges are the logical sides, and native's `isDefaultOpen` is `defaultOpen`.
    expectTypeOf<DrawerProps["placement"]>().toEqualTypeOf<
      "top" | "bottom" | "start" | "end" | undefined
    >();
    expectTypeOf<DrawerProps>().not.toHaveProperty("isDefaultOpen");
    expectTypeOf<DrawerProps>().not.toHaveProperty("isCloseOnPress");
  });

  it("opens a bottom drawer at its first snap point and steps through them from the handle", () => {
    render(sample({ defaultOpen: true, placement: "bottom", snapPoints: [240, "80%"] }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.style.height).toBe("240px");
    act(() => fireEvent.click(screen.getByRole("button", { name: "Resize panel" })));
    expect(dialog.style.height).toBe("80dvh");
    act(() => fireEvent.click(screen.getByRole("button", { name: "Resize panel" })));
    expect(dialog.style.height).toBe("240px");
  });
  it("resizes a side drawer from its inner edge and expands it from the header", () => {
    render(sample({ defaultOpen: true, isResizable: true, isExpandable: true, size: "sm" }));
    const dialog = screen.getByRole("dialog");
    const handle = within(dialog).getByRole("separator", { name: "Resize panel" });
    expect(handle.getAttribute("aria-valuenow")).toBe("400");
    // On the end edge the inner edge is the start: moving it towards the start widens the drawer.
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(handle.getAttribute("aria-valuenow")).toBe("416");
    expect(dialog.style.width).toBe("416px");
    fireEvent.keyDown(handle, { key: "Home" });
    expect(dialog.style.width).toBe("320px");
    const expand = within(dialog).getByRole("button", { name: "Expand panel" });
    expect(expand.getAttribute("aria-pressed")).toBe("false");
    press(expand);
    expect(dialog.className).toContain("w-full");
    expect(dialog.style.width).toBe("");
    expect(within(dialog).queryByRole("separator")).toBeNull();
    expect(
      within(dialog).getByRole("button", { name: "Expand panel" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });
  it("draws no handle or expand button by default, nor on a bottom drawer", () => {
    const { unmount } = render(sample({ defaultOpen: true }));
    expect(screen.queryByRole("separator")).toBeNull();
    expect(screen.queryByRole("button", { name: "Expand panel" })).toBeNull();
    unmount();
    render(
      sample({ defaultOpen: true, placement: "bottom", isResizable: true, isExpandable: true }),
    );
    expect(screen.queryByRole("separator")).toBeNull();
    expect(screen.queryByRole("button", { name: "Expand panel" })).toBeNull();
  });
});
