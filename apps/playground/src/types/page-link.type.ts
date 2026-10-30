/**
 * Stackra file contract:
 * Purpose: what the shell needs of a playground page: its path, the registry entry it renders (the title, category,
 *          tier and status all come from there) and whether it draws its own `main`. A route class carries only its
 *          path and `ownsMain`; everything else is read from `@stackra/showcase` by the path.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14, rule R7 as amended by the showcase redesign spec
 *          section 2.2).
 */
import type { ComponentEntry } from "@stackra/showcase";

/** A page the playground links to. */
export interface PageLink {
  /** The URL path, `/<route folder>`. */
  readonly path: string;
  /** The registry entry the page renders. */
  readonly entry: ComponentEntry;
  /** Whether the page draws its own `main` landmark (an app-shell page may); the shell then adds none, so a page has one. */
  readonly ownsMain?: boolean;
}
