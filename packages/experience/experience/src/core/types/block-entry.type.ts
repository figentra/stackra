/**
 * Stackra file contract:
 * Purpose: `BlockEntry`, one registered block on one target: its derived key, its block class and the component that
 *          draws it there, as the generated wiring passes them to `registerBlocks`.
 * Boundary: a type only. The component is `unknown` here because this entry names no runtime: on the web and native
 *           targets it is a React component (`hero-section.tsx` or `hero-section.native.tsx`), which the target's
 *           driver draws.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 3: the palette is code); ADR 0294 (decisions 14 and 20); ADR 0112 (X9).
 */
import type { BlockClass } from "#core/types/block-class.type";

/** A block and its component on the current target. */
export interface BlockEntry {
  /** The derived key (`web.hero_section`), locked in `stackra.manifest.json`. */
  readonly key: string;

  /** The block class: its fields are the props. */
  readonly block: BlockClass;

  /** The component that draws the block on this target. */
  readonly component: unknown;
}
