/**
 * Stackra file contract:
 * Purpose: `ApprovalSettingsReader`, the settings reader an `ApprovalCondition` receives: it answers only the keys the
 *          condition listed in its static `reads`, and throws on any other (N2).
 * Boundary: a type only; `limitedSettingsReader` builds one over a source function that gen wires to the settings
 *           reader. Each listed key must itself be a key marked `approval`, so a threshold cannot be lowered without a
 *           second person (S9; gen refuses otherwise).
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (conditions read their threshold from data); STA-1724 FR-002.
 */

/** A settings reader limited to the keys one condition declared. */
export interface ApprovalSettingsReader {
  /**
   * The value of `key`.
   *
   * @throws RangeError when `key` is not in the condition's `reads`.
   */
  readonly get: (key: string) => Promise<unknown>;
}
