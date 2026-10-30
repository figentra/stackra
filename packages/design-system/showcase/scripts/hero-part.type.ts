/**
 * Stackra file contract:
 * Purpose: `HeroPart`, one `### <Part>` table of a HeroUI page with its render-prop and animation sub-tables.
 * Boundary: a type only, in its own file (ADR 0305).
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import type { HeroRow } from "./hero-row.type.ts";

/** One part of a vendored HeroUI page. */
export interface HeroPart {
  readonly name: string;
  readonly props: readonly HeroRow[];
  renderProps?: readonly HeroRow[];
  animation?: readonly HeroRow[];
}
