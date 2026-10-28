/**
 * Stackra file contract:
 * Purpose: `ConsentModeSignals`, Google Consent Mode v2's four signals as `consentModeSignals` derives them from the
 *          ledger, ready for `gtag("consent", "update", signals)` or a server tag that forwards them.
 * Boundary: a type only; the property names are Google's and stay snake_case. Each is `granted` or `denied`, nothing
 *           else: an undecided category reads `denied`.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0294 (decision 16).
 */

/** Google Consent Mode v2's signals. */
export interface ConsentModeSignals {
  /** Ad cookies and storage; follows `marketing`. */
  readonly ad_storage: "granted" | "denied";

  /** Sending user data to Google for advertising; follows `marketing`. */
  readonly ad_user_data: "granted" | "denied";

  /** Personalised advertising; follows `marketing`. */
  readonly ad_personalization: "granted" | "denied";

  /** Analytics cookies and storage; follows `analytics`. */
  readonly analytics_storage: "granted" | "denied";
}
