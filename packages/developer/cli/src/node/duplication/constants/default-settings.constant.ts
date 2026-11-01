/**
 * Stackra file contract:
 * Purpose: `DEFAULT_SETTINGS`, the settings a duplication baseline without its own values falls back to: jscpd's
 *          minimum token count and the cap for a member the baseline does not list yet.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: rule-gap B-9 (notes handover/testing/rule-gap-list.md); ADR 0022 (tests beside the code).
 */

/** The fallback jscpd `--min-tokens` and new-member cap (percent). */
export const DEFAULT_SETTINGS: { readonly minTokens: number; readonly newMemberCap: number } =
  Object.freeze({ minTokens: 50, newMemberCap: 5 });
