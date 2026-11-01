/**
 * Stackra file contract:
 * Purpose: the `OperatorBreakGlass` port: whether an operator has an open break-glass session, which an audited
 *          command needs in production.
 * Boundary: an abstract class that is its own token; the host implements it over its IAM service, which opens, time-
 *           limits and audits the sessions. With no binding, an audited command in production is refused.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-018; ADR 0188 (SC12); ADR 0208 (decision 3).
 */
import { Port } from "@stackra/contracts";

import type { BreakGlassSession } from "#contracts/types/break-glass-session.type";

/**
 * Reads open break-glass sessions.
 *
 * @example
 * export class IamOperatorBreakGlassDriver extends Driver(OperatorBreakGlass) {
 *   async active(operator: string): Promise<BreakGlassSession | undefined> {
 *     return this.grants.openFor(operator);
 *   }
 * }
 */
export abstract class OperatorBreakGlass extends Port {
  /** The open session of `operator`, or `undefined` when there is none. */
  abstract active(operator: string): Promise<BreakGlassSession | undefined>;
}
