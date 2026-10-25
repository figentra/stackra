/**
 * Stackra file contract:
 * Purpose: `ResolvedNode`, a document node after `resolveDocument` checked it: the registered entry, the props parsed
 *          by the block's schema with every `LocalizedText` read in the visitor's locale, the accepted query and its
 *          input, and the resolved children.
 * Boundary: a type only; what a target's driver draws. Every node in it passed the checks, so a driver never sees an
 *           unknown key or refused props.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decisions 2 and 6); ADR 0112 (X9).
 */
import type { QueryRef } from "@stackra/clients";
import type { Json } from "@stackra/contracts";

import type { BlockEntry } from "#core/types/block-entry.type";

/** A checked node, ready to draw. */
export interface ResolvedNode {
  /** Where the node sits (`0.children.2`); a stable React key. */
  readonly path: string;

  /** The registered block of the node's key. */
  readonly entry: BlockEntry;

  /** The parsed props, with defaults applied and `LocalizedText` read in the locale. */
  readonly props: Readonly<Record<string, unknown>>;

  /** The query the block accepts, or `null`. */
  readonly accepts: QueryRef | null;

  /** The accepted query's input (`{}` when the node gave none). */
  readonly input: Json;

  /** The child nodes, resolved. */
  readonly children: readonly ResolvedNode[];
}
