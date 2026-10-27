/**
 * Stackra file contract:
 * Purpose: `useLayoutData<typeof X>(key)`, what a layout's loader resolved for the current page, read anywhere below
 *          it by the layout's key (`useLayoutData<typeof SiteLayout>("site")`).
 * Boundary: reads the matched routes: the one whose id is the key, or ends with `/<key>` (a locale mount's copy,
 *           `ar-sa/site`). `undefined` when no such layout is matched; the page's own guard decides what that means.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16).
 */
import type { AnyClass } from "@stackra/container";
import { useMatches } from "react-router";

import type { Layout } from "#core/bases/layout.base";
import type { ClassInstance } from "#core/types/class-instance.type";
import type { LoaderData } from "#core/types/loader-data.type";

/**
 * The data of the layout keyed `key`.
 *
 * @example
 * const layout = useLayoutData<typeof SiteLayout>("site");
 * if (!layout) throw SiteContextMissingError.create();
 */
export function useLayoutData<L extends AnyClass<Layout>>(
  key: string,
): LoaderData<ClassInstance<L>> | undefined {
  const match = useMatches().find(({ id }) => id === key || id.endsWith(`/${key}`));
  return match?.data as LoaderData<ClassInstance<L>> | undefined;
}
