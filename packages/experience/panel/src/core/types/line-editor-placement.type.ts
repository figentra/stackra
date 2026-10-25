/**
 * Stackra file contract:
 * Purpose: `LineEditorPlacement`, one line editor placed in a `LineEntry` slot: its key, the slot, and the layer it was
 *          placed in.
 * Boundary: a type only; gen records them in the manifest. The base fills the slot at the owner layer; an edition
 *           replaces it at layer 2b with a block bound to the base's `Line` schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0350 (decision 6); ADR 0306 (rules 7 and 8).
 */
import type { PlacementLayer } from "#core/enums/placement-layer.enum";

/** One line editor placement. */
export interface LineEditorPlacement {
  /** The editor's key (the block that edits the lines). */
  readonly key: string;

  /** The `LineEntry` slot's key. */
  readonly slot: string;

  /** The layer it was placed in. */
  readonly layer: PlacementLayer;
}
