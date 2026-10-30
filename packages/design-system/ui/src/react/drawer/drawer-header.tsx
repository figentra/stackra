/**
 * Stackra file contract:
 * Purpose: the web `Drawer.Header`: one row, ruled off from what follows: a back button at the start when there is
 *          somewhere to go back to (an earlier view of `Drawer.ViewStack`, or a drawer under this one), then the
 *          title and description, then the expand toggle (a drawer with `isExpandable`; pressed while expanded), an
 *          Esc hint (when Escape closes the drawer, on a fine pointer only) and any `Drawer.Close`, which belongs at
 *          the row's end wherever the caller wrote it.
 * Boundary: layout only; the back button is `Drawer.Back`, and one the caller wrote replaces the automatic one. The
 *           Esc hint is decorative (hidden from assistive technology): Escape itself is React Aria's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); owner request 2026-10-29 (STA-1371).
 */
import { Drawer as HeroDrawer, Kbd } from "@heroui/react";
import {
  Children,
  cloneElement,
  isValidElement,
  use,
  type ReactElement,
  type ReactNode,
} from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { DrawerBack } from "#react/drawer/drawer-back";
import { DrawerClose } from "#react/drawer/drawer-close";
import type { DrawerCloseProps } from "#react/drawer/drawer-close.props";
import { DrawerLayerContext } from "#react/drawer/drawer-layer-context";
import type { DrawerHeaderProps } from "#react/drawer/drawer-header.props";
import { ViewStackContext } from "#react/view-stack/view-stack-context";

/** Whether `child` is an element of `type`. */
const isOf = (child: ReactNode, type: unknown): boolean =>
  isValidElement(child) && child.type === type;

/** The header row. */
export function DrawerHeader({
  children,
  className,
  closeButton,
  ...rest
}: DrawerHeaderProps): ReactElement {
  const t = useUiText();
  const layer = use(DrawerLayerContext);
  const views = use(ViewStackContext);
  const parts = Children.toArray(children as ReactNode);
  // The header's `closeButton` reaches each Close that sets none of its own.
  const closes = parts
    .filter((child) => isOf(child, DrawerClose))
    .map((child) =>
      closeButton !== undefined &&
      isValidElement<DrawerCloseProps>(child) &&
      child.props.closeButton === undefined
        ? cloneElement(child, { closeButton })
        : child,
    );
  const backs = parts.filter((child) => isOf(child, DrawerBack));
  const text = parts.filter((child) => !isOf(child, DrawerClose) && !isOf(child, DrawerBack));
  const canGoBack = (views?.state.canGoBack ?? false) || (layer?.depth ?? 1) > 1;
  return (
    <HeroDrawer.Header
      {...rest}
      className={[
        "shrink-0 flex-row items-center gap-2 border-b border-separator px-6 py-4 [&_[data-slot=drawer-close-trigger]]:static",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {backs.length > 0 ? backs : canGoBack ? <DrawerBack /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">{text}</div>
      {layer?.isExpandable ? (
        <IconButton
          variant="ghost"
          size="sm"
          icon={layer.isExpanded ? "minimize-2" : "maximize-2"}
          label={t(UI_KEYS.ui.drawer.expand)}
          aria-pressed={layer.isExpanded}
          onPress={() => layer.setExpanded(!layer.isExpanded)}
        />
      ) : null}
      {/* No Close: the Escape hint alone, unless asked for none. */}
      {closes.length === 0 && layer?.isKeyboardDismissable && closeButton !== "none" ? (
        <Kbd aria-hidden className="hidden pointer-fine:inline-flex">
          <Kbd.Content>{"esc"}</Kbd.Content>
        </Kbd>
      ) : null}
      {closes}
    </HeroDrawer.Header>
  );
}
