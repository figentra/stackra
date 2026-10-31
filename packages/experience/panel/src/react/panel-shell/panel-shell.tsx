/**
 * Stackra file contract:
 * Purpose: `PanelShell`, the frame of one panel around the app's layout: it shares the panel, holds the breadcrumb
 *          trail (navigation's `BreadcrumbsProvider`, which pages publish to with `useBreadcrumb`), and provides the
 *          confirmation dialog the action runner asks with.
 * Boundary: draws no chrome of its own: the app's layout (sidebar, top bar, outlet) is its child, so an app keeps its own
 *           shell and layout. Navigation items and the trail come from navigation, never from here.
 * Runtime: browser
 * Governing contract: ADR 0164 (panel shell); ADR 0139 (declared confirmation); ADR 0303 (decision 1).
 */
import { BreadcrumbsProvider } from "@stackra/navigation/react";
import { ConfirmationProvider } from "@stackra/ui/react";
import { useMemo, type ReactElement } from "react";

import { PanelContext } from "#react/panel-shell/panel-context";
import type { PanelShellProps } from "#react/panel-shell/panel-shell.props";
import type { PanelState } from "#react/panel-shell/panel-state.type";

/**
 * Frames `children` as the panel `panel`.
 *
 * @example
 * <PanelShell panel={Panels.Admin}>
 *   <AppLayout navbar={...} sidebar={...}><Outlet /></AppLayout>
 * </PanelShell>
 */
export function PanelShell({ panel, children }: PanelShellProps): ReactElement {
  const state = useMemo<PanelState>(() => ({ panel }), [panel]);
  return (
    <PanelContext value={state}>
      <BreadcrumbsProvider>
        <ConfirmationProvider>{children}</ConfirmationProvider>
      </BreadcrumbsProvider>
    </PanelContext>
  );
}
