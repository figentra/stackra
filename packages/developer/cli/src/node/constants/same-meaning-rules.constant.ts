/**
 * Stackra file contract:
 * Purpose: `SAME_MEANING_RULES`, the rule pairs of two `stackra check` phases that report the same problem on the same
 *          file: `<phase>:<rule>` of the later phase to the `<phase>:<rule>` of the earlier phase whose finding is
 *          kept. `dropSameMeaning` reports such a file once, with a note that the later phase agrees.
 * Boundary: data only; add a pair here when two tools overlap, never a special case in a phase.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); the stackra core baseline of 2026-10-27 (459 files counted twice).
 */

/** Later phase's `<phase>:<rule>` to the earlier phase's `<phase>:<rule>` that stays. */
export const SAME_MEANING_RULES: Readonly<Record<string, string>> = {
  "gen:two_declarations_in_file": "lint:stackra(one-declaration-per-file)",
};
