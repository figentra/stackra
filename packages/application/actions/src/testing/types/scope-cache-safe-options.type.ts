/**
 * Stackra file contract:
 * Purpose: `ScopeCacheSafeOptions`, the third argument of `expectScopeCacheSafe(...)`: the callers of one scope node
 *          to compare (`as`) and the request facts a test wants other than the defaults.
 * Boundary: a type only; each caller runs as `RunOptions` with that caller as `as`.
 * Runtime: node
 * Governing contract: ADR 0269 (testing helpers); ADR 0305 (rule 31, as amended 2026-10-28).
 */
import type { Actor } from "@stackra/contracts";

import type { RunOptions } from "#testing/types/run-options.type";

/** How a test checks a scope-wide cached query. */
export type ScopeCacheSafeOptions = Omit<RunOptions, "as"> & {
  /** Two or more callers of the same tenant, ideally with different roles. */
  readonly as: readonly Actor[];
};
