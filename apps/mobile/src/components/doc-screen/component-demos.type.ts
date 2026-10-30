/**
 * Stackra file contract:
 * Purpose: `ComponentDemos`, what the generated demo map holds for one entry: a live demo and its source per example
 *          id, and the loader of the entry's native ApiDoc.
 * Boundary: a type only, in its own file.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0305 (one declaration per file).
 */
import type { ApiDoc } from "@stackra/showcase";
import type { ComponentType } from "react";

/** The demos and API of one entry on native. */
export interface ComponentDemos {
  /** By example id: the demo component and its source, as shown in the Usage tab. */
  readonly examples: Readonly<
    Record<string, { readonly Demo: ComponentType; readonly code: string }>
  >;
  /** Loads the entry's generated ApiDoc; absent until the generator has run for it. */
  readonly api?: () => ApiDoc;
}
