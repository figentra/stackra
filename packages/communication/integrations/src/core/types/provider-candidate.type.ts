/**
 * Stackra file contract:
 * Purpose: `ProviderCandidate`, one entry of the ordered failover list `ProviderResolver#candidates` answers: the
 *          provider code, the loaded Connection and whether it is the caller's own or the Market's managed one.
 * Boundary: a type only. The list is in the order to try: the caller's own Connections first, then the platform's, each
 *           group in the Market's order. The caller tries the next on a retryable failure and records the mode.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decisions 2 to 4 and 7); ADR 0422 (decision 3).
 */
import type { ProviderMode } from "#contracts/enums/provider-mode.enum";
import type { Connection } from "#core/bases/connection.base";

/** One Connection to try, with its provider and mode. */
export interface ProviderCandidate<T = unknown> {
  /** The Integration's provider code. */
  readonly provider: string;

  /** The Connection, loaded with its credentials. */
  readonly connection: Connection & T;

  /** Whether it is the caller's own Connection or the Market's managed one. */
  readonly mode: ProviderMode;
}
