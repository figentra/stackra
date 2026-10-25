/**
 * Stackra file contract:
 * Purpose: `AwardNotGrantableError`, the refusal of a grant the kind does not allow for this recipient: archived, of
 *          another model, a missing, unknown or not higher level, a missing or already awarded period. A 412.
 * Boundary: a refusal; it names the kind and the `GrantRefusal` code, never the recipient or the level typed.
 * Runtime: isomorphic
 * Governing contract: ADR 0368 (decision 3); ADR 0140 (error envelope); ADR 0294 (decision 20: the code from the class
 *                     name).
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

import type { GrantRefusal } from "#contracts/index";

/**
 * A grant the kind refuses.
 *
 * @example
 * throw AwardNotGrantableError.create({ kindId, reason: GrantRefusal.PeriodTaken });
 */
export class AwardNotGrantableError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The kind refused. */
  kindId!: PublicId<"awk">;

  /** Why. */
  reason!: GrantRefusal;
}
