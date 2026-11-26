/**
 * Stackra file contract:
 * Purpose: `CapabilityRow`, one subject of a capability matrix (a carrier, a provider, a plan) with its state per
 *          column.
 * Boundary: a type only; `Text` is `LocalizedText` in a document and `string` once resolved for drawing. A cell is a
 *           `CapabilityState` code, or a short note in words; a column the row leaves out is drawn empty.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0305 (rule 2); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import type { CapabilityState } from "#core/enums/capability-state.enum";

/** A row of the matrix. */
export interface CapabilityRow<Text = LocalizedText> {
  /** The subject's name, as its owner writes it (never translated). */
  readonly name: string;

  /** A second line under the name (a market, a tier). */
  readonly group?: Text;

  /** The state, or a short note, per column id. */
  readonly cells: Readonly<Record<string, CapabilityState | Text>>;
}
