/**
 * Stackra file contract:
 * Purpose: `useBreadcrumb(crumb)`, how a matched route or a resource page publishes its crumb to the panel's trail while it
 *          is mounted.
 * Boundary: writes the shell's state in an effect and withdraws the crumb on unmount; `null` publishes nothing. Outside a
 *           shell it does nothing, so a page also renders on its own. The router adapter publishes route titles; a
 *           resource page its resource label.
 * Runtime: browser
 * Governing contract: ADR 0164; ADR 0303 (decision 1).
 */
import { use, useEffect, useId } from "react";

import type { Breadcrumb } from "#react/breadcrumbs/breadcrumb.type";
import { PanelContext } from "#react/panel-shell/panel-context";

/**
 * Publishes `crumb` while the component is mounted.
 *
 * @example
 * useBreadcrumb({ to: href, label: I18n.orders.resources.order.title });
 */
export function useBreadcrumb(crumb: Breadcrumb | null): void {
  const id = useId();
  const setCrumb = use(PanelContext)?.setCrumb;
  const to = crumb?.to;
  const label = crumb?.label;
  useEffect(() => {
    if (setCrumb === undefined || to === undefined || label === undefined) return;
    setCrumb(id, { to, label });
    return () => setCrumb(id, null);
  }, [setCrumb, id, to, label]);
}
