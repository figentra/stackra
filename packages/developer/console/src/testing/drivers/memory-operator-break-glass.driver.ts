/**
 * Stackra file contract:
 * Purpose: `MemoryOperatorBreakGlassDriver`, the in-memory `OperatorBreakGlass`: sessions opened with `open`, for
 *          tests of audited commands in production.
 * Boundary: process memory only; it never checks an approver or a longest duration (the IAM service's).
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-018.
 */
import { Driver } from "@stackra/container";

import { OperatorBreakGlass } from "#contracts/ports/operator-break-glass.port";
import type { BreakGlassSession } from "#contracts/types/break-glass-session.type";

/**
 * Break-glass sessions in a map.
 *
 * @example
 * const breakGlass = new MemoryOperatorBreakGlassDriver().open("ada", 60_000, "incident 42");
 */
export class MemoryOperatorBreakGlassDriver extends Driver(OperatorBreakGlass) {
  /** The sessions by operator. */
  private readonly sessions = new Map<string, BreakGlassSession>();

  /** Opens a session for `operator` that ends `ms` from now (negative: one that has ended); returns this driver. */
  open(operator: string, ms: number, reason = "test"): this {
    this.sessions.set(operator, {
      id: `bg_${this.sessions.size + 1}`,
      operator,
      reason,
      expiresAt: new Date(Date.now() + ms),
    });
    return this;
  }

  /** Implements `OperatorBreakGlass.active`, documented there. */
  async active(operator: string): Promise<BreakGlassSession | undefined> {
    return this.sessions.get(operator);
  }
}
