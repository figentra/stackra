/**
 * Stackra file contract:
 * Purpose: `SequenceBlockClosedError`, the refusal of a claim, release or void on a reserved block that was already
 *          released or voided: its remaining numbers are back in the series or recorded as voids.
 * Boundary: a refusal (`conflict`); `block` is the block's public id. The device reserves a new block.
 * Runtime: node
 * Governing contract: ADR 0342 (decision 4); ADR 0140 (refusals); ADR 0328 (built with `create`).
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/** The block is closed. */
export class SequenceBlockClosedError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The block's public id. */
  block!: PublicId<"sqb">;
}
