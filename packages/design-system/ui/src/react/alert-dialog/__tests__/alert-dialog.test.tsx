/**
 * Stackra file contract:
 * Purpose: proves the web AlertDialog is an `alertdialog` named by its title and described by its description, draws
 *          each tone's icon (or none, or one of the caller's), confirms and refuses through the buttons, Escape and a
 *          press outside under the rules of `isDismissable` and `isKeyboardDismissDisabled`, starts focus on the cancel
 *          button, holds its own state or follows a controlled one, refuses a confirming press while it is disabled,
 *          colours the confirm button by tone, and that the type refuses HeroUI's own names and a missing label.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so exit animations end at once.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WAI-ARIA `alertdialog`; WCAG 2.2
 *          SC 2.1.2 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-102
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";

import type { AlertDialogContractProps } from "#contracts/types/alert-dialog-contract-props.type";
import { AlertDialog, type AlertDialogProps } from "#react/alert-dialog/alert-dialog";

const registry = defineIconRegistry({
  info: Info,
  "circle-check": CircleCheck,
  "triangle-alert": TriangleAlert,
  "circle-alert": CircleAlert,
});

/** The dialog as an app would draw it, with the icons registered. */
const ui = (props: Partial<AlertDialogProps> = {}): ReactElement => (
  <IconRegistryProvider registry={registry}>
    <AlertDialog
      title="Delete project?"
      description="This cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Keep"
      defaultOpen
      {...props}
    />
  </IconRegistryProvider>
);

const dialog = () => screen.getByRole("alertdialog");

/** A press on the backdrop, outside the dialog. */
const pressOutside = () => {
  const backdrop = document.querySelector('[data-slot="alert-dialog-backdrop"]');
  if (!backdrop) throw new Error("no backdrop");
  // Both families: React Aria listens to pointer events where the platform has them, mouse events otherwise.
  for (const type of ["pointerDown", "mouseDown", "pointerUp", "mouseUp"] as const)
    fireEvent[type](backdrop);
};
const button = (name: string) => screen.getByRole("button", { name });

describe("AlertDialog (web)", () => {
  it("is an alertdialog named by its title and described by its description", () => {
    render(ui());
    const found = screen.getByRole("alertdialog", { name: "Delete project?" });
    const describedBy = found.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")?.textContent).toBe("This cannot be undone.");
    // Level 2, so a page's `h1` is not followed by a skipped level.
    expect(screen.getByRole("heading", { level: 2, name: "Delete project?" })).toBeTruthy();
  });

  it("draws nothing while closed and opens from defaultOpen", () => {
    const { unmount } = render(ui({ defaultOpen: false }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    unmount();
    render(ui());
    expect(dialog()).toBeTruthy();
  });

  it("has no describedby when it has no description", () => {
    render(ui({ description: undefined }));
    expect(dialog().getAttribute("aria-describedby")).toBeNull();
  });

  it.each([
    ["default", "lucide-info"],
    ["accent", "lucide-info"],
    ["success", "lucide-circle-check"],
    ["warning", "lucide-triangle-alert"],
    ["danger", "lucide-circle-alert"],
  ] as const)("draws the %s tone's own icon", (tone, className) => {
    render(ui({ tone }));
    expect(dialog().querySelector(`[data-slot="alert-dialog-icon"] svg.${className}`)).toBeTruthy();
    expect(dialog().querySelector('[data-slot="alert-dialog-icon"]')?.className).toContain(
      `alert-dialog__icon--${tone}`,
    );
  });

  it("draws an icon of the caller's, or none", () => {
    const { unmount } = render(ui({ icon: "circle-check", tone: "danger" }));
    expect(dialog().querySelector("svg.lucide-circle-check")).toBeTruthy();
    expect(dialog().querySelector("svg.lucide-circle-alert")).toBeNull();
    unmount();
    render(ui({ icon: false }));
    expect(dialog().querySelector('[data-slot="alert-dialog-icon"]')).toBeNull();
  });

  it("starts focus on the cancel button", () => {
    render(ui({ tone: "danger" }));
    expect(document.activeElement).toBe(button("Keep"));
  });

  it("colours the confirm button danger for the danger tone and primary otherwise", () => {
    const { unmount } = render(ui({ tone: "danger" }));
    expect(button("Delete").className).toContain("button--danger");
    unmount();
    render(ui({ tone: "warning" }));
    expect(button("Delete").className).toContain("button--primary");
  });

  it("confirms: calls onConfirm once, never onCancel, reports closing and closes", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(ui({ onConfirm, onCancel, onOpenChange }));
    act(() => button("Delete").click());
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("refuses with the cancel button: calls onCancel once, never onConfirm, and closes", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(ui({ onConfirm, onCancel }));
    act(() => button("Keep").click());
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("refuses on Escape unless Escape is disabled", () => {
    const onCancel = vi.fn();
    const { unmount } = render(ui({ onCancel, isKeyboardDismissDisabled: true }));
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
    expect(dialog()).toBeTruthy();
    unmount();
    render(ui({ onCancel }));
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("ignores a press outside unless it is dismissable, then refuses", () => {
    const onCancel = vi.fn();
    const { unmount } = render(ui({ onCancel }));
    pressOutside();
    expect(onCancel).not.toHaveBeenCalled();
    expect(dialog()).toBeTruthy();
    unmount();
    render(ui({ onCancel, isDismissable: true }));
    pressOutside();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("follows a controlled isOpen and only asks to change it", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(ui({ isOpen: true, defaultOpen: false, onOpenChange }));
    act(() => button("Delete").click());
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(dialog()).toBeTruthy();
    rerender(ui({ isOpen: false, defaultOpen: false, onOpenChange }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    rerender(ui({ isOpen: true, defaultOpen: false, onOpenChange }));
    expect(dialog()).toBeTruthy();
  });

  it("refuses a confirming press while isConfirmDisabled", () => {
    const onConfirm = vi.fn();
    render(ui({ isConfirmDisabled: true, onConfirm }));
    const confirm = button("Delete") as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    act(() => confirm.click());
    expect(onConfirm).not.toHaveBeenCalled();
    expect(dialog()).toBeTruthy();
  });

  it("draws extra content under the description and passes dialog props through", () => {
    render(
      <AlertDialog
        title="Delete project?"
        confirmLabel="Delete"
        cancelLabel="Keep"
        defaultOpen
        className="mine"
        data-testid="ad"
      >
        <p>Type the name.</p>
      </AlertDialog>,
    );
    expect(dialog().getAttribute("data-testid")).toBe("ad");
    expect(dialog().className).toContain("mine");
    expect(screen.getByText("Type the name.")).toBeTruthy();
  });

  it("extends the contract and refuses HeroUI's names and a missing label", () => {
    expectTypeOf<AlertDialogProps>().toExtend<AlertDialogContractProps>();
    // @ts-expect-error HeroUI names the tone `status`; the contract's word is `tone`
    void (<AlertDialog title="t" confirmLabel="c" cancelLabel="x" status="danger" />);
    // @ts-expect-error the buttons' words are the app's, so the labels are required
    void (<AlertDialog title="t" />);
    // @ts-expect-error the title names the dialog, so it is required
    void (<AlertDialog confirmLabel="c" cancelLabel="x" />);
  });
});
