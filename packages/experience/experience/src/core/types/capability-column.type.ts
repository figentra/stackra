/**
 * Stackra file contract:
 * Purpose: `CapabilityColumn`, one capability of a capability matrix (rates, labels, pickups…).
 * Boundary: a type only; `Text` is `LocalizedText` in a document and `string` once resolved for drawing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0305 (rule 2); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

/** A column of the matrix. */
export interface CapabilityColumn<Text = LocalizedText> {
  /** The key the rows' cells use. */
  readonly id: string;

  /** The column's heading. */
  readonly label: Text;
}
