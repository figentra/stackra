/**
 * Stackra file contract:
 * Purpose: `SequenceOptions`, what `Sequence({ key, ... })` takes: the written key, the series dimensions beyond the
 *          scope, the format pattern, the reset rule and the reservation block size for offline issue.
 * Boundary: a type only; `Sequence` checks and records the options, and `SequenceService` reads them through `kindOf`.
 *           The scope is always a dimension (the `ScopeRef` a call passes), so `series` names only the others.
 * Runtime: node
 * Governing contract: ADR 0342 (decisions 1, 2 and 4); ADR 0294 (decision 20: the key is written once).
 */

/** The options of a sequence. */
export interface SequenceOptions {
  /** The written key (`invoice`, `receipt.e_receipt`); gen derives and locks `<module>.<key>`. */
  readonly key: string;

  /** The dimensions beyond the scope, camelCase, such as `["legalEntityId", "locationId"]`; none by default. */
  readonly series?: readonly string[];

  /** The pattern: `{n}`, `{n:06}` (zero-padded to six) and `{year}` (yearly sequences only); `"{n}"` by default. */
  readonly format?: string;

  /** `never` (the default) or `yearly`: a yearly sequence counts from 1 again each year and its format has `{year}`. */
  readonly reset?: "never" | "yearly";

  /** `{ size }` lets a device reserve blocks of up to `size` numbers for offline issue; `false` (the default) is online only. */
  readonly reserve?: { readonly size: number } | false;
}
