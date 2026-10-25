/**
 * Stackra file contract:
 * Purpose: `BreadcrumbsContext`, the React context `BreadcrumbsProvider` gives the tree under it: the published crumbs
 *          by publisher id and the setter pages and route adapters publish with.
 * Boundary: internal to the `./react` entry (not exported); read through `useBreadcrumb` and `useBreadcrumbs`.
 * Runtime: browser
 * Governing contract: ADR 0164; ADR 0294 (decision 23: Provider means a React context component).
 */
import { createContext } from "react";

import type { Breadcrumb } from "#react/breadcrumbs/breadcrumb.type";

/** The trail's state; `null` outside a `BreadcrumbsProvider`. */
export const BreadcrumbsContext = createContext<{
  /** The published crumbs by publisher id, in publication order. */
  readonly crumbs: ReadonlyMap<string, Breadcrumb>;
  /** Publishes `crumb` under `id`, or withdraws it with `null`. */
  readonly setCrumb: (id: string, crumb: Breadcrumb | null) => void;
} | null>(null);
