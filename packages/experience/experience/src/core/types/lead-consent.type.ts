/**
 * Stackra file contract:
 * Purpose: `LeadConsent`, a lead form's optional marketing-consent box: the words shown beside it and the consent
 *          document and version they belong to, which the consent ledger records with the answer.
 * Boundary: a type only; `Text` is `LocalizedText` in a document and `string` once resolved for drawing. The box is
 *           never ticked by default, and a request is sent with it unticked.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0305 (rule 2); OS ADR 0059 d7 (the consent ledger); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

/** The consent box. */
export interface LeadConsent<Text = LocalizedText> {
  /** The words beside the box, sent with the answer so the ledger can keep their hash. */
  readonly text: Text;

  /** The consent document's key in the ledger (`marketing_email`). */
  readonly document: string;

  /** The document's version the words belong to. */
  readonly version: string;
}
