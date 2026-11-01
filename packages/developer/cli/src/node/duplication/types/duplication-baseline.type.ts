/**
 * Stackra file contract:
 * Purpose: `DuplicationBaseline`, the parsed duplication baseline: its settings and each member's duplicated
 *          percentages of `src` and of its tests.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: rule-gap B-9 (notes handover/testing/rule-gap-list.md); ADR 0022 (tests beside the code).
 */

/** The baseline document. */
export type DuplicationBaseline = {
  /** The smallest clone jscpd counts, its `--min-tokens` value. */
  readonly minTokens?: number | undefined;

  /** The highest source percentage a member that is not listed yet may have. */
  readonly newMemberCap?: number | undefined;

  /** Each member folder to its two percentages; absent in the placeholder file. */
  readonly members?:
    | Readonly<Record<string, { readonly src: number; readonly tests: number }>>
    | undefined;
};
