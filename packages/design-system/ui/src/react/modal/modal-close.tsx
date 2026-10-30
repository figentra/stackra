/**
 * Stackra file contract:
 * Purpose: the web `Modal.Close`: HeroUI's modal close trigger, a close button in React Aria's `close` slot, so a
 *          press closes the dialog and the button sits in its corner; named by the required `label` instead of
 *          HeroUI's English default.
 * Boundary: reached as `Modal.Close`; the barrel exports only its props type. It is the same contract as
 *           `CloseButton`, so an icon of its own and the disabled state work the same.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.5.8 and 4.1.2.
 */
import { Modal as HeroModal } from "@heroui/react";
import { use, type ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { closeControlOf } from "#react/drawer/close-control-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ModalCloseProps } from "#react/modal/modal-close.props";
import { ModalEscapeContext } from "#react/modal/modal-escape-context";

/**
 * The button in the modal's corner that closes it: by default the Escape key cap (the close mark on a touch screen),
 * named "Close, Esc" (the name holds the cap's visible "esc", SC 2.5.3); `closeButton="icon"` draws the close
 * mark (HeroUI's, or `icon`). A modal whose Escape is turned off passes `closeButton="icon"`.
 */
export function ModalClose({
  label,
  icon,
  isDisabled,
  onPress,
  closeButton = "esc",
  className,
  ...rest
}: ModalCloseProps): ReactElement | null {
  const t = useUiText();
  // A modal Escape does not close shows no key cap, which would promise what the key cannot do.
  const control = closeButton === "esc" && !use(ModalEscapeContext) ? "icon" : closeButton;
  if (control === "none") return null;
  const parts = closeControlOf(control, icon);
  const classes = [parts.className, typeof className === "string" ? className : undefined]
    .filter(Boolean)
    .join(" ");
  return (
    <HeroModal.CloseTrigger
      {...rest}
      {...omitUndefined({ isDisabled, onPress })}
      {...(classes ? { className: classes } : {})}
      aria-label={parts.isEsc ? t(UI_KEYS.ui.drawer.close_escape, { label }) : label}
    >
      {parts.children}
    </HeroModal.CloseTrigger>
  );
}
