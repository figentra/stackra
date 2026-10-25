/**
 * Stackra file contract:
 * Purpose: `PanelShell`, the frame of one panel around the app's layout: it shares the panel and the breadcrumb trail, and
 *          provides the confirmation dialog the action runner asks with.
 * Boundary: draws no chrome of its own: the app's layout (sidebar, top bar, outlet) is its child, so an app keeps its own
 *           shell and HeroUI Pro layout. Navigation items come from navigation, never from here.
 * Runtime: browser
 * Governing contract: ADR 0164 (panel shell); ADR 0139 (declared confirmation); ADR 0303 (decision 1).
 */
import { ConfirmationProvider } from "@stackra/ui/react";
import { useCallback, useMemo, useState, type ReactElement } from "react";

import type { Breadcrumb } from "#react/breadcrumbs/breadcrumb.type";
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
  const [crumbs, setCrumbs] = useState<ReadonlyMap<string, Breadcrumb>>(() => new Map());
  const setCrumb = useCallback((id: string, crumb: Breadcrumb | null) => {
    setCrumbs((current) => {
      if (crumb === null && !current.has(id)) return current;
      const next = new Map(current);
      if (crumb === null) next.delete(id);
      else next.set(id, crumb);
      return next;
    });
  }, []);
  const state = useMemo<PanelState>(() => ({ panel, crumbs, setCrumb }), [panel, crumbs, setCrumb]);
  return (
    <PanelContext value={state}>
      <ConfirmationProvider>{children}</ConfirmationProvider>
    </PanelContext>
  );
}
