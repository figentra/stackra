/**
 * Stackra file contract:
 * Purpose: `BlockClass<Q>`, the class `Block({...})` returns and an author extends (`class HeroSectionBlock extends
 *          Block({ category, icon }) {}`), carrying the accepted query's type for `BlockProps`.
 * Boundary: a type only: one abstract construct signature and a type-only static, so the declaration emit of an
 *           author's block names an exported type (ADR 0305 rule 43). `~accepts` never exists at runtime; the
 *           renderer reads the query from the kind registry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25); ADR 0305 (rule 43).
 */
import type { QueryRef } from "@stackra/clients";

import type { Block } from "#core/bases/block.base";

/** A block kind base, accepting the query `Q` (or none). */
export type BlockClass<Q extends QueryRef | undefined = QueryRef | undefined> =
  (abstract new () => Block) & {
    /** Type-only: the query whose output the renderer passes the component as `data`. */
    readonly "~accepts"?: Q;
  };
