/**
 * Stackra file contract:
 * Purpose: the web `Drawer.Close`: HeroUI's drawer close trigger, a close button in React Aria's `close` slot, so a
 *          press closes the dialog; named by the required `label` instead of HeroUI's English default.
 * Boundary: reached as `Drawer.Close`; the barrel exports only its props type. It is the same contract as
 *           `CloseButton`, so an icon of its own and the disabled state work the same.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; WCAG 2.2 SC 2.5.8 and 4.1.2.
 */
import { Drawer as HeroDrawer } from "@heroui/react";
import { use, type ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { closeControlOf } from "#react/drawer/close-control-of.function";
import type { DrawerCloseProps } from "#react/drawer/drawer-close.props";
import { DrawerLayerContext } from "#react/drawer/drawer-layer-context";
import { useUiText } from "#react/hooks/use-ui-text";

/**
 * The button that closes the drawer: by default the Escape key cap (the close mark on a touch screen), named
 * "Close, Esc" (the name holds the cap's visible "esc", SC 2.5.3); `closeButton="icon"` draws the close mark
 * (HeroUI's, or `icon`).
 */
export function DrawerClose({
  label,
  icon,
  isDisabled,
  onPress,
  closeButton = "esc",
  className,
  ...rest
}: DrawerCloseProps): ReactElement | null {
  const t = useUiText();
  const layer = use(DrawerLayerContext);
  const isEscapable = layer?.isKeyboardDismissable ?? true;
  // A drawer Escape does not close shows no key cap, which would promise what the key cannot do.
  const control = closeButton === "esc" && !isEscapable ? "icon" : closeButton;
  if (control === "none") return null;
  const parts = closeControlOf(control, icon);
  const classes = [parts.className, typeof className === "string" ? className : undefined]
    .filter(Boolean)
    .join(" ");
  return (
    <HeroDrawer.CloseTrigger
      {...rest}
      {...omitUndefined({ isDisabled, onPress })}
      {...(classes ? { className: classes } : {})}
      aria-label={parts.isEsc ? t(UI_KEYS.ui.drawer.close_escape, { label }) : label}
    >
      {parts.children}
    </HeroDrawer.CloseTrigger>
  );
}
