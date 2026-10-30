/**
 * Stackra file contract:
 * Purpose: proves the web Modal stays closed until its trigger is pressed, opens from `defaultOpen` and `isOpen`,
 *          reports every change through `onOpenChange`, is a dialog named by its title or its `label`, closes on a
 *          press outside and on Escape unless `isDismissable` or `isKeyboardDismissDisabled` says otherwise, maps
 *          `size` and `position` onto HeroUI's classes, passes dialog props through, draws a title at level 2 or the
 *          level asked for, closes from `Modal.Close` and from a `slot="close"` button, and refuses the raw HeroUI
 *          names the contract replaces.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks, and
 *           focus return and the real look are the e2e suite's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 2.1.2 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-099
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";

import type { ModalContractProps } from "#contracts/types/modal-contract-props.type";
import type { OverlayTitleContractProps } from "#contracts/types/overlay-title-contract-props.type";
import { Button } from "#react/button/button";
import { Modal } from "#react/modal/modal";
import type { ModalProps } from "#react/modal/modal.props";
import type { ModalTitleProps } from "#react/modal/modal-title.props";

const press = (element: HTMLElement) => act(() => element.click());

/** A modal with a trigger and the usual parts; the caller's props win over the defaults. */
function sample(props: Partial<ModalProps> = {}): ReactElement {
  return (
    <Modal trigger={<Button>Open</Button>} {...props}>
      <Modal.Close label="Close" />
      <Modal.Header>
        <Modal.Title>Edit order</Modal.Title>
      </Modal.Header>
      <Modal.Body>Body</Modal.Body>
      <Modal.Footer>
        <Button slot="close">Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
}

/** The backdrop, which React Aria treats as "outside" the dialog. */
const backdrop = () => {
  const found = document.querySelector('[data-slot="modal-backdrop"]');
  if (!found) throw new Error("the modal is not open");
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

describe("Modal (web)", () => {
  it("stays closed until its trigger is pressed, then is a dialog named by its title", () => {
    render(sample());
    expect(screen.queryByRole("dialog")).toBeNull();
    // Held before opening: React Aria hides the page behind an open modal, so a role query would not find it then.
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    press(trigger);
    expect(screen.getByRole("dialog", { name: "Edit order" })).toBeTruthy();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("opens at once from `defaultOpen`", () => {
    render(sample({ defaultOpen: true }));
    expect(screen.getByRole("dialog", { name: "Edit order" })).toBeTruthy();
  });

  it("is driven by `isOpen` when controlled", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(sample({ isOpen: false, onOpenChange }));
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(sample({ isOpen: true, onOpenChange }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    // A controlled modal asks to close and stays open until the app agrees.
    press(screen.getByRole("button", { name: "Close, Esc" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeTruthy();
    rerender(sample({ isOpen: false, onOpenChange }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("draws the close mark, named by its label alone, when Escape does not close the modal", () => {
    render(sample({ isOpen: true, isKeyboardDismissDisabled: true }));
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Close, Esc" })).toBeNull();
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
      <Modal defaultOpen label="Settings">
        <Modal.Body>Body</Modal.Body>
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeTruthy();
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

  it("keeps Escape working when only `isDismissable` is false, and the outside press when only Escape is off", () => {
    const { unmount } = render(sample({ defaultOpen: true, isDismissable: false }));
    pressEscape();
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();
    render(sample({ defaultOpen: true, isKeyboardDismissDisabled: true }));
    pressOutside();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("defaults to the medium size and an automatic position", () => {
    render(sample({ defaultOpen: true }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.classList.contains("modal__dialog--md")).toBe(true);
    expect(dialog.closest('[data-slot="modal-container"]')?.getAttribute("data-placement")).toBe(
      "auto",
    );
  });

  it.each(["sm", "md", "lg", "full"] as const)("maps the %s size onto HeroUI's class", (size) => {
    render(sample({ defaultOpen: true, size }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.classList.contains(`modal__dialog--${size}`)).toBe(true);
    expect(
      dialog.closest('[data-slot="modal-container"]')?.classList.contains("modal__container--full"),
    ).toBe(size === "full");
  });

  it.each(["auto", "top", "center", "bottom"] as const)(
    "maps the %s position onto HeroUI's placement",
    (position) => {
      render(sample({ defaultOpen: true, position }));
      expect(
        screen
          .getByRole("dialog")
          .closest('[data-slot="modal-container"]')
          ?.getAttribute("data-placement"),
      ).toBe(position);
    },
  );

  it("passes dialog props through", () => {
    render(
      sample({
        defaultOpen: true,
        id: "edit-dialog",
        className: "extra",
        "aria-describedby": "note",
      }),
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.id).toBe("edit-dialog");
    expect(dialog.classList.contains("extra")).toBe(true);
    expect(dialog.classList.contains("modal__dialog")).toBe(true);
    expect(dialog.getAttribute("aria-describedby")).toBe("note");
  });

  it("draws the parts in HeroUI's slots", () => {
    render(sample({ defaultOpen: true }));
    const dialog = screen.getByRole("dialog");
    for (const slot of ["close-trigger", "header", "heading", "body", "footer"])
      expect(dialog.querySelector(`[data-slot="modal-${slot}"]`), slot).not.toBeNull();
  });

  it("draws the title as a level-2 heading, or the level asked for", () => {
    const { rerender } = render(sample({ defaultOpen: true }));
    expect(screen.getByRole("heading", { level: 2, name: "Edit order" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Edit order" }).classList.contains("modal__heading"),
    ).toBe(true);
    rerender(
      <Modal defaultOpen>
        <Modal.Title level={4}>Deep</Modal.Title>
      </Modal>,
    );
    expect(screen.getByRole("heading", { level: 4, name: "Deep" })).toBeTruthy();
  });

  it("closes from `Modal.Close`, named by its label, and from a `slot=close` button", () => {
    const { unmount } = render(sample({ defaultOpen: true }));
    const close = screen.getByRole("button", { name: "Close, Esc" });
    expect(close.getAttribute("data-slot")).toBe("modal-close-trigger");
    press(close);
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();
    render(sample({ defaultOpen: true }));
    press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("lets `Modal.Close` take its own icon, press handler and disabled state", () => {
    const onPress = vi.fn();
    render(
      <Modal defaultOpen label="Close test">
        <Modal.Close label="Close panel" onPress={onPress} icon={<i data-testid="mine" />} />
        <Modal.Close label="Disabled" isDisabled />
      </Modal>,
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
    expectTypeOf<ModalProps>().toExtend<ModalContractProps>();
    expectTypeOf<ModalTitleProps>().toExtend<OverlayTitleContractProps>();
    // The vertical place is `position`; `placement` is Placement's word (ADR 0312), and native's `isDefaultOpen` is `defaultOpen`.
    expectTypeOf<ModalProps>().not.toHaveProperty("placement");
    expectTypeOf<ModalProps>().not.toHaveProperty("isDefaultOpen");
    expectTypeOf<ModalProps>().not.toHaveProperty("isCloseOnPress");
    expectTypeOf<ModalProps["size"]>().toEqualTypeOf<"sm" | "md" | "lg" | "full" | undefined>();
  });

  it("enters by its motion: a side panel slides from the inline end at the top of the screen", () => {
    render(sample({ defaultOpen: true, motion: "slide-side" }));
    const container = screen.getByRole("dialog").closest('[data-slot="modal-container"]');
    expect(container?.getAttribute("data-placement")).toBe("top");
    expect(container?.className).toContain("slide-in-from-end");
    expect(screen.getByRole("dialog").className).toContain("rounded-e-none");
  });
});
