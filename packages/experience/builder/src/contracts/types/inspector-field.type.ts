/**
 * Stackra file contract:
 * Purpose: `InspectorField`, the descriptor of one editable prop of a block: its key, label, kind, whether it is
 *          required and, for an enum, its options.
 * Boundary: a type only, in the leaf entry. A descriptor describes; it holds no value and renders nothing, so the
 *           console draws the control from it with @stackra/ui.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: the block inspector).
 */
import type { InspectorFieldKind } from "#contracts/enums/inspector-field-kind.enum";

/** One prop of a block, as the inspector shows it. */
export interface InspectorField {
  /** The prop's name in the block's props. */
  readonly key: string;

  /** The schema's `title` metadata, else the key as words (`heroTitle` reads `Hero title`). */
  readonly label: string;

  /** What control the prop needs. */
  readonly kind: InspectorFieldKind;

  /** True when the schema refuses the prop being absent. */
  readonly required: boolean;

  /** The allowed values of an `enum` field; empty for every other kind. */
  readonly options: readonly string[];
}
