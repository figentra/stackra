/**
 * Stackra file contract:
 * Purpose: `ChangeCursor`, how far one change consumer has read the change log, and how its last delivery went:
 *          attempts, when it is next due, its last failure, and when it stalled after its last attempt.
 * Boundary: a type only, one per consumer class (keyed by class name). No position means the start of the retained
 *           log. A stalled cursor is skipped until `ChangeFeedService.resume` or `replay`; nothing is dropped.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment: per-consumer cursors replace delete-on-deliver
 *                     for changes).
 */
import type { OutboxError } from "#contracts/types/outbox-error.type";

/** One consumer's place in the change log. */
export interface ChangeCursor {
  /** The consumer class's name. */
  readonly consumer: string;

  /** The position of the last change it handled; absent before its first, so it reads from the log's start. */
  readonly position?: string;

  /** Failed deliveries since its last success. */
  readonly attempts: number;

  /** When it is next due. */
  readonly availableAt: Date;

  /** How its last delivery failed. */
  readonly lastError?: OutboxError;

  /** When it stalled after its last attempt; the relay skips it from then on. */
  readonly stalledAt?: Date;
}
