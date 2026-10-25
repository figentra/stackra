/**
 * Stackra file contract:
 * Purpose: `PackRejectedError`, the refusal of a market pack that must not be served: a wrong shape, a content hash
 *          that does not match, an untrusted key, a bad signature, or an overlay chain that loops. A service that
 *          meets it at start-up does not start.
 * Boundary: a refusal (`failed_precondition`, category `precondition_failed`); code `pack_rejected`, derived from the
 *           class name. The fields are codes only, never pack content.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 2 and 3); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

import type { PackRejection } from "#core/enums/pack-rejection.enum";

/**
 * A pack that was refused.
 *
 * @example
 * throw PackRejectedError.create({ reason: PackRejection.HashMismatch, pack: "eu@2.1.0" });
 */
export class PackRejectedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** Why it was refused. */
  reason!: PackRejection;

  /** The pack (`market@version`) or market code, when known. */
  pack?: string;
}
