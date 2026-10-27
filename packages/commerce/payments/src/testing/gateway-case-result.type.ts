/**
 * Stackra file contract:
 * Purpose: `GatewayCaseResult`, what `runPayoutCase` and `runDisputeCase` report: the case, the gateway's answer (none
 *          when it refused) and every expectation or port rule it missed.
 * Boundary: a type only, in the `./testing` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0357; ADR 0269; owner decision D3 (2026-10-27).
 */

/**
 * The outcome of one recorded case.
 *
 * @example
 * expect((await runPayoutCase(connection, CASES[0])).mismatches).toEqual([]);
 */
export interface GatewayCaseResult<T> {
  /** The case's id. */
  readonly caseId: string;

  /** The gateway's answer; `null` when it refused. */
  readonly answer: T | null;

  /** Every miss; empty when the gateway passes the case. */
  readonly mismatches: readonly string[];
}
