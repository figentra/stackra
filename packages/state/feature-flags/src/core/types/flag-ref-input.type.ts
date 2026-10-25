/**
 * Stackra file contract:
 * Purpose: `FlagRefInput`, the written-out form of a flag `flagRefs` takes for a flag this member does not declare: a
 *          flag of a consumed manifest, which gen spells as data because the producer's class is not importable.
 * Boundary: a type only. `key` and `default` are required; the other fields take the same defaults as a declared
 *           flag (platform and tenant scopes, no expiry, no removal issue, the derived label key).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20); ADR 0307 (decision 25); registry v3.1 section 5 (gen emits `flags`).
 */
import type { FlagScope } from "#core/types/flag-scope.type";

/** A flag declared elsewhere, as gen writes it. */
export interface FlagRefInput {
  /** The producer's derived key (`orders.quick_order`). */
  readonly key: string;

  /** The producer's declared default. */
  readonly default: boolean;

  /** The producer's scopes; platform and tenant when absent. */
  readonly scopes?: readonly FlagScope[];

  /** The producer's expiry, `YYYY-MM-DD`. */
  readonly expires?: string | null;

  /** The producer's removal issue. */
  readonly removalIssue?: string | null;

  /** The i18n key of the label; `<module>::flags.<name>.label` when absent. */
  readonly label?: string;
}
