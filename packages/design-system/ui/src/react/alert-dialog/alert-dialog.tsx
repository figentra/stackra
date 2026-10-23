/**
 * Stackra file contract:
 * Purpose: the web `AlertDialog` on HeroUI v3's AlertDialog: a modal `alertdialog` that asks the user to confirm or
 *          refuse one decision. One component draws the tone's icon, the title (which names the dialog), the
 *          description (which describes it) and the two buttons, maps the shared overlay contract (`isOpen`,
 *          `defaultOpen` and `onOpenChange` to a state that is controlled or its own; `isDismissable` and
 *          `isKeyboardDismissDisabled` to the backdrop) and passes every other React Aria dialog prop through to the
 *          dialog element.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. Two defaults differ from the
 *           other overlays, on purpose: `isDismissable` is false (a stray press outside must not decide a question),
 *           and Escape refuses the question, where HeroUI's AlertDialog disables it, because Escape lands on the
 *           safe button (cancel) and a keyboard user always has a way out (WCAG 2.2 SC 2.1.2). Focus starts on the
 *           cancel button, the least destructive choice, and returns to what opened the dialog when it closes (React
 *           Aria restores it). The dialog has no trigger: open it from state, from `useConfirmation()`, or from
 *           `defaultOpen`. The title is a level-2 heading, as in Modal, because React Aria's
 *           default of 3 would skip a level under a page's `h1`. A tone's colour never stands alone: the title and the button labels carry the meaning.
 *           The confirm button is `danger` for the `danger` tone and `primary` otherwise. The tone's icon is drawn by
 *           name; the kit registers the four tone icons itself, and an app's own icon of the same name wins.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI v3 on web); WAI-ARIA
 *          `alertdialog`; WCAG 2.2 SC 1.4.1, 2.1.2 and 4.1.2.
 */
import { AlertDialog as HeroAlertDialog, type AlertDialogDialogProps } from "@heroui/react";
import { useId, useState, type ReactElement } from "react";

import type { AlertDialogContractProps } from "#contracts/types/alert-dialog-contract-props.type";
import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";
import { Button } from "#react/button/button";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/**
 * Props of the web AlertDialog: the shared contract plus React Aria's dialog props, passed to the dialog element
 * (`className`, `id`, `aria-describedby`, `data-*`). HeroUI's `role` is fixed at `alertdialog`, and its children are
 * the contract's `title`, `description` and `children`, so the type refuses both. HeroUI's `status`, which is the
 * contract's `tone`, is not a dialog prop, so the type refuses that as well.
 */
export type AlertDialogProps = AlertDialogContractProps &
  Omit<AlertDialogDialogProps, keyof AlertDialogContractProps | "children" | "role">;

/**
 * A modal that interrupts the user to confirm or refuse one decision. Confirming calls `onConfirm` and closes it;
 * every other way out (cancel, Escape, a press outside when `isDismissable`) calls `onCancel` and closes it. Pair
 * `isOpen` with `onOpenChange` to control it, or leave both out and use `defaultOpen`.
 */
export function AlertDialog({
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  tone = "default",
  icon,
  isOpen,
  defaultOpen = false,
  onOpenChange,
  isDismissable = false,
  isKeyboardDismissDisabled = false,
  isConfirmDisabled = false,
  onConfirm,
  onCancel,
  ...rest
}: AlertDialogProps): ReactElement {
  const descriptionId = useId();
  const [ownIsOpen, setOwnIsOpen] = useState(defaultOpen);
  const isShown = isOpen ?? ownIsOpen;

  // The state is always handed to React Aria as controlled, so one rule closes it whoever asked: the buttons here, or
  // React Aria's own Escape and backdrop handling, which arrive through `onOpenChange` below.
  const setIsShown = (next: boolean) => {
    if (isOpen === undefined) setOwnIsOpen(next);
    onOpenChange?.(next);
  };
  const cancel = () => {
    onCancel?.();
    setIsShown(false);
  };
  const confirm = () => {
    onConfirm?.();
    setIsShown(false);
  };

  const drawn = icon === false ? undefined : (icon ?? FEEDBACK_BY_TONE[tone].icon);

  return (
    <HeroAlertDialog isOpen={isShown} onOpenChange={(next) => (next ? setIsShown(true) : cancel())}>
      <HeroAlertDialog.Backdrop
        isDismissable={isDismissable}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      >
        <HeroAlertDialog.Container>
          <HeroAlertDialog.Dialog
            {...(description == null ? {} : { "aria-describedby": descriptionId })}
            {...rest}
          >
            <HeroAlertDialog.Header>
              {drawn === undefined ? null : (
                <HeroAlertDialog.Icon status={tone}>
                  <SlotIcon icon={drawn} />
                </HeroAlertDialog.Icon>
              )}
              <HeroAlertDialog.Heading level={2}>{title}</HeroAlertDialog.Heading>
            </HeroAlertDialog.Header>
            <HeroAlertDialog.Body>
              {description == null ? null : <div id={descriptionId}>{description}</div>}
              {children}
            </HeroAlertDialog.Body>
            <HeroAlertDialog.Footer>
              <Button variant="secondary" autoFocus onPress={cancel}>
                {cancelLabel}
              </Button>
              <Button
                variant={tone === "danger" ? "danger" : "primary"}
                isDisabled={isConfirmDisabled}
                onPress={confirm}
              >
                {confirmLabel}
              </Button>
            </HeroAlertDialog.Footer>
          </HeroAlertDialog.Dialog>
        </HeroAlertDialog.Container>
      </HeroAlertDialog.Backdrop>
    </HeroAlertDialog>
  );
}
