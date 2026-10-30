/**
 * Stackra file contract:
 * Purpose: the web `Drawer.Back`: a ghost icon button with a back chevron (mirrored in right-to-left) that goes back
 *          one view of the drawer's `Drawer.ViewStack`, or, on the first view of a drawer stacked over another,
 *          closes this layer so the one under it shows again.
 * Boundary: `Drawer.Header` draws one at its start by itself when there is somewhere to go back to. Closing a layer is
 *           React Aria's overlay state, so a controlled drawer hears it through `onOpenChange(false)`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); owner request 2026-10-29 (STA-1371); WCAG 2.2
 *          SC 2.4.3 and 4.1.2.
 */
import { use, type ReactElement } from "react";
import { OverlayTriggerStateContext } from "react-aria-components";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { ViewStackContext } from "#react/view-stack/view-stack-context";
import type { DrawerBackProps } from "#react/drawer/drawer-back.props";

/** Goes back one view, or closes this layer of stacked drawers. */
export function DrawerBack({ label, onPress }: DrawerBackProps): ReactElement {
  const t = useUiText();
  const views = use(ViewStackContext);
  const overlay = use(OverlayTriggerStateContext);
  const back = () => {
    if (onPress) onPress();
    else if (views?.state.canGoBack) views.state.pop();
    else overlay?.close();
  };
  return (
    <IconButton
      variant="ghost"
      size="sm"
      icon="chevron-left"
      label={label ?? t(UI_KEYS.ui.drawer.back)}
      onPress={back}
      data-slot="drawer-back"
    />
  );
}
