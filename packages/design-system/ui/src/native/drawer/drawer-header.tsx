/**
 * Stackra file contract:
 * Purpose: the native `Drawer.Header`: the modal's header row (title and description, a close part at the row's end),
 *          ruled off from the body, with a back button at its start when there is somewhere to go back to (an earlier
 *          view of `Drawer.ViewStack`, or a drawer under this one).
 * Boundary: layout only; the back button is `Drawer.Back`, and one the caller wrote replaces the automatic one. Yoga's
 *           row follows the provider's direction, so the back button lands on the start edge in both directions.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); owner request 2026-10-29 (STA-1371).
 */
import { Children, isValidElement, use, type ReactElement, type ReactNode } from "react";

import { DrawerBack } from "#native/drawer/drawer-back";
import { DrawerLayerContext } from "#native/drawer/drawer-layer-context";
import { ModalHeader } from "#native/modal/modal-header";
import type { ModalSectionProps } from "#native/modal/modal-section.props";
import { ModalSection } from "#native/modal/modal-section";
import { ViewStackContext } from "#native/view-stack/view-stack-context";

/** Whether `child` is a back part. */
const isBack = (child: ReactNode): boolean => isValidElement(child) && child.type === DrawerBack;

/** The header row. */
export function DrawerHeader({ children, ...props }: ModalSectionProps): ReactElement {
  const layer = use(DrawerLayerContext);
  const views = use(ViewStackContext);
  const parts = Children.toArray(children);
  const backs = parts.filter(isBack);
  const rest = parts.filter((child) => !isBack(child));
  const canGoBack = (views?.state.canGoBack ?? false) || (layer?.depth ?? 1) > 1;
  const back = backs.length > 0 ? backs : canGoBack ? <DrawerBack /> : null;
  return (
    <ModalSection base="mb-3 flex-row items-center gap-2 border-b border-separator" {...props}>
      {back}
      <ModalHeader className="flex-1 pb-3">{rest}</ModalHeader>
    </ModalSection>
  );
}
