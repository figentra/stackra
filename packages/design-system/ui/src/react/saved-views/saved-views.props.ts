/**
 * Stackra file contract:
 * Purpose: `SavedViewsProps`, the props of the web `SavedViews` in `saved-views.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); product audit 2026-10-28 (saved views and facet chips).
 */
import type { ComponentPropsWithoutRef } from "react";

import type { SavedViewsContractProps } from "#contracts/types/saved-views-contract-props.type";

/** Props of SavedViews: the shared contract plus the attributes of its root. */
export type SavedViewsProps = SavedViewsContractProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof SavedViewsContractProps | "children">;
