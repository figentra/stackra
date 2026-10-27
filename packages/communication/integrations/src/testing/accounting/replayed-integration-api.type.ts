/**
 * Stackra file contract:
 * Purpose: `ReplayedIntegrationApi`, the managed client `replayIntegrationApi` returns: an `IntegrationApi` that answers
 *          from a recording, plus `done()`, which refuses when a recorded call was never made.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0443 (decision 8).
 */
import type { IntegrationApi } from "#core/index";

/**
 * A managed client replaying a recording.
 *
 * @example
 * const api: ReplayedIntegrationApi = replayIntegrationApi("ledger", exchanges);
 */
export interface ReplayedIntegrationApi extends IntegrationApi {
  /** How many recorded calls were made so far. */
  readonly calls: number;

  /**
   * Checks every recorded call was made.
   *
   * @throws TypeError naming the first call left.
   */
  done(): void;
}
