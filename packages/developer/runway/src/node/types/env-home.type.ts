/**
 * Stackra file contract:
 * Purpose: `EnvHome`, one deployable member and the rows it declares for one environment; their values live in the
 *          environment's sops scope (ADR 0525).
 * Boundary: type only; names and rules, never a value.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import type { EnvRow } from "#core/types/env-row.type";

/** One member's declared rows for an environment. */
export type EnvHome = {
  /** The deployable member key. */
  readonly member: string;

  /** The manifest rows the member declares for this environment. */
  readonly rows: readonly EnvRow[];
};
