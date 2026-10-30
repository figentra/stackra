/**
 * Stackra file contract:
 * Purpose: the native `Drawer.Back`: a ghost icon button with a back chevron (mirrored in right-to-left) that goes
 *          back one view of the drawer's `Drawer.ViewStack`, or, on the first view of a drawer stacked over another,
 *          closes this layer so the one under it shows again.
 * Boundary: closing is HeroUI Native's own open state (the sheet's or the panel dialog's), so a controlled drawer
 *           hears it through `onOpenChange(false)`. Each close lives in its own component because each reads a
 *           different HeroUI Native context.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); owner request 2026-10-29 (STA-1371).
 */
import { useBottomSheet, useDialog } from "heroui-native";
import { use, type ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { DrawerLayerContext } from "#native/drawer/drawer-layer-context";
import type { DrawerBackProps } from "#native/drawer/drawer-back.props";
import { IconButton } from "#native/icon-button/icon-button";
import { ViewStackContext } from "#native/view-stack/view-stack-context";
import { useUiText } from "#react/hooks/use-ui-text";

/** The button, with the close that applies when no view is left to pop. */
function BackButton({
  label,
  onPress,
  close,
}: DrawerBackProps & { readonly close: () => void }): ReactElement {
  const t = useUiText();
  const views = use(ViewStackContext);
  const back = () => {
    if (onPress) onPress();
    else if (views?.state.canGoBack) views.state.pop();
    else close();
  };
  return (
    <IconButton
      variant="ghost"
      size="sm"
      icon="chevron-left"
      label={label ?? t(UI_KEYS.ui.drawer.back)}
      onPress={back}
    />
  );
}

/** Back in a bottom sheet. */
function SheetBack(props: DrawerBackProps): ReactElement {
  const { onOpenChange } = useBottomSheet();
  return <BackButton {...props} close={() => onOpenChange(false)} />;
}

/** Back in a side panel. */
function PanelBack(props: DrawerBackProps): ReactElement {
  const { onOpenChange } = useDialog();
  return <BackButton {...props} close={() => onOpenChange(false)} />;
}

/** Goes back one view, or closes this layer of stacked drawers. */
export function DrawerBack(props: DrawerBackProps): ReactElement {
  return use(DrawerLayerContext)?.isPanel ? <PanelBack {...props} /> : <SheetBack {...props} />;
}
