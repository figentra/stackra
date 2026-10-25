/**
 * Stackra file contract:
 * Purpose: `BreadcrumbsProvider`, the holder of one breadcrumb trail: the pages and route adapters under it publish
 *          their crumbs with `useBreadcrumb`, and the frame reads the trail with `useBreadcrumbs`.
 * Boundary: holds the crumbs in React state and draws nothing of its own. A panel's shell mounts one; an app frame
 *           without a panel may mount its own.
 * Runtime: browser
 * Governing contract: ADR 0164 (the panel shell's trail); ADR 0303 (decision 1: router-aware UI is navigation's);
 *                     ADR 0294 (decision 23).
 */
import { useCallback, useMemo, useState, type ReactElement, type ReactNode } from "react";

import type { Breadcrumb } from "#react/breadcrumbs/breadcrumb.type";
import { BreadcrumbsContext } from "#react/breadcrumbs/breadcrumbs-context";

/**
 * Holds the breadcrumb trail of `children`.
 *
 * @example
 * <BreadcrumbsProvider><AppLayout ...><Outlet /></AppLayout></BreadcrumbsProvider>
 */
export function BreadcrumbsProvider({ children }: { readonly children?: ReactNode }): ReactElement {
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
  const state = useMemo(() => ({ crumbs, setCrumb }), [crumbs, setCrumb]);
  return <BreadcrumbsContext value={state}>{children}</BreadcrumbsContext>;
}
