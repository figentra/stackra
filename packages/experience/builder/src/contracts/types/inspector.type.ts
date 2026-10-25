/**
 * Stackra file contract:
 * Purpose: `Inspector`, what `useInspector` returns: the selected block's id, the descriptors of its props, their
 *          current values and the setter that edits one.
 * Boundary: a type only, in the leaf entry. `set` goes through the editor's set-prop change, so it is undoable.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: the block inspector, the undo and redo command stack).
 */
import type { Json } from "@stackra/contracts";

import type { InspectorField } from "#contracts/types/inspector-field.type";

/** The inspector's view of the selected block. */
export interface Inspector {
  /** The id of the inspected block (the first selected one); `undefined` while nothing is selected. */
  readonly id: string | undefined;

  /** The editable props of the block, in schema order; empty while nothing is selected. */
  readonly fields: readonly InspectorField[];

  /** The block's props as they stand, keyed like `fields`; a prop never set is absent. */
  readonly values: Readonly<Record<string, Json>>;

  /** Sets the prop `key` of the inspected block, or clears it with `undefined`; does nothing without a block. */
  set(key: string, value: Json | undefined): void;
}
