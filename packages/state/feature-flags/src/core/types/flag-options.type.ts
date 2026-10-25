/**
 * Stackra file contract:
 * Purpose: `FlagOptions`, what `Flag({...})` takes: the default value, the optional expiry and removal issue, and the
 *          scopes the flag may be set at.
 * Boundary: a type only. The owner is derived from the module (its CODEOWNERS entry), and the key and the label from
 *           the class name, so none of them is an option. A flag is a release switch or an experiment arm, never a
 *           commercial right (ADR 0213 decision 7).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: the Flag row); ADR 0307 (decision 25: `scopes`); ADR 0213 (decision 3).
 */
import type { FlagScope } from "#core/types/flag-scope.type";

/** The options of a flag class. */
export interface FlagOptions {
  /** The value wherever no provider answers: an anonymous caller, an unreachable provider, an unset flag. */
  readonly default: boolean;

  /** The last day the flag may live, `YYYY-MM-DD`; gen warns after it. A release switch has none. */
  readonly expires?: string;

  /** The issue that removes the flag (`STA-412`), for an experiment with an end. */
  readonly removalIssue?: string;

  /** The scopes it may be set at; platform and tenant by default. */
  readonly scopes?: readonly FlagScope[];
}
