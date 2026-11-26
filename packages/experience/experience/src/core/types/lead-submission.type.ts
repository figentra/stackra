/**
 * Stackra file contract:
 * Purpose: `LeadSubmission`, the JSON body a lead form posts to its action: the answers by field id, the consent
 *          answer with the words shown, the page it came from and the named inputs a verification slot added.
 * Boundary: a type only, shared by the block and whatever receives it (a landing's edge Worker, which forwards it as
 *           a service). Nothing here is trusted: the receiver validates every value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0305 (rule 2); STA-2041.
 */

/** What the form sends. */
export interface LeadSubmission {
  /** Each field's answer by its id; an empty optional field is an empty string. */
  readonly fields: Readonly<Record<string, string>>;

  /** Null when the form has no consent box. */
  readonly consent: {
    readonly document: string;
    readonly version: string;
    /** The words shown, in the page's language. */
    readonly text: string;
    readonly granted: boolean;
  } | null;

  /** The page's path (`/contact`). */
  readonly sourcePage: string;

  /** Inputs the verification slot added (a challenge token), by name. */
  readonly verification: Readonly<Record<string, string>>;
}
