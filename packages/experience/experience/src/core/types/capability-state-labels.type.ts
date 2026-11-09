/**
 * Stackra file contract:
 * Purpose: `CapabilityStateLabels`, the words a capability matrix shows beside each state's icon.
 * Boundary: a type only; `Text` is `LocalizedText` in a document and `string` once resolved for drawing. The words are
 *           always shown, so a state never rests on colour or an icon alone.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0305 (rule 2); WCAG 2.2 1.4.1; STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

/** One word per state. */
export interface CapabilityStateLabels<Text = LocalizedText> {
  /** The label of an offered capability ("Yes"). */
  readonly yes: Text;

  /** The label of a capability not offered ("No"). */
  readonly no: Text;

  /** The label of a planned capability ("Coming"). */
  readonly coming: Text;
}
