/**
 * Stackra file contract:
 * Purpose: `EnvHome`, one deployable member's Infisical home (`/runtime/<member>`) and the rows declared for one
 *          environment.
 * Boundary: type only; names and rules, never a value.
 * Runtime: node
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import type { EnvRow } from "#core/types/env-row.type";

/** One member's declared rows for an environment, with its home. */
export type EnvHome = {
  readonly member: string;
  readonly path: string;
  readonly rows: readonly EnvRow[];
};
