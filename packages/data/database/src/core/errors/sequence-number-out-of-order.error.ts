/**
 * Stackra file contract:
 * Purpose: `SequenceNumberOutOfOrderError`, the refusal of an offline-issued number that is not ahead of the block's
 *          last accepted number or lies outside the block: accepting it would reuse a number or take one the block
 *          does not hold.
 * Boundary: a refusal (`conflict`); `expected` is the lowest number the block accepts next and `received` the number
 *           sent. A number ahead of `expected` is accepted, and the numbers it skips are recorded as voids.
 * Runtime: node
 * Governing contract: ADR 0342 (decisions 3 and 4); ADR 0140 (refusals); ADR 0328 (built with `create`).
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/** The number is behind the block's last accepted number, or outside the block. */
export class SequenceNumberOutOfOrderError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The block's public id. */
  block!: PublicId<"sqb">;

  /** The lowest number the block accepts next. */
  expected!: number;

  /** The number that was sent. */
  received!: number;
}
