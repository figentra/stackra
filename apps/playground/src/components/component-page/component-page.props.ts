/**
 * Stackra file contract:
 * Purpose: `ComponentPageProps`, props of the generic component page: which registry entry to render.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); showcase redesign spec (2026-10-27) section 4.
 */
import type { ComponentTier } from "@stackra/showcase";
import type { ReactNode } from "react";

/** Props of `ComponentPage`. */
export interface ComponentPageProps {
  /** The registry tier of the entry. */
  readonly tier: ComponentTier;
  /** The entry's slug within its tier. */
  readonly slug: string;
  /** A page's own block under the pillars, such as the typography specimen or the icon search. */
  readonly lead?: ReactNode;
}
