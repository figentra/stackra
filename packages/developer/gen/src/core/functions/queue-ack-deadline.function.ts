/**
 * Stackra file contract:
 * Purpose: `queueAckDeadline`, the ack deadline of a queue's Encore subscription in seconds: the largest
 *          `visibilityTimeoutSeconds` any environment of the service's runway gives the queue, so a job still running is
 *          never handed to a second worker in any environment (STA-2050).
 * Boundary: pure; reads `ir.queueSettings` only. Encore parses a subscription's settings when it builds the app, so one
 *           value serves every environment, and the largest is the safe one. Encore needs at least one second, so 0
 *           becomes 1. Undefined when no environment sets the queue's timeout: Encore's default (30 seconds) applies.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (runway v3: a member's runway sizes its own queues); ADR 0148 (decisions 1, 3 and 6);
 *                     STA-2050.
 */
import type { MemberIR } from "#core/types/member-ir.type";

/** The shortest ack deadline Encore accepts, in seconds. */
const MIN_ACK_DEADLINE_SECONDS = 1;

/**
 * The ack deadline of `queue`'s subscription in seconds, or undefined when no environment sets one.
 *
 * @example
 * queueAckDeadline(ir, "billing"); // 300 when dev sets 30 and production 300
 */
export function queueAckDeadline(ir: MemberIR, queue: string): number | undefined {
  const timeouts = Object.values(ir.queueSettings ?? {}).flatMap((queues) => {
    const seconds = queues[queue]?.visibilityTimeoutSeconds;
    return seconds === undefined ? [] : [seconds];
  });
  return timeouts.length === 0 ? undefined : Math.max(MIN_ACK_DEADLINE_SECONDS, ...timeouts);
}
