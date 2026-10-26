/**
 * Stackra file contract:
 * Purpose: `WebhookDeliveryTarget`, a `WebhookTarget` with the signing secret values of one delivery attempt: the
 *          current secret, plus the one a rotation replaced while it still signs.
 * Boundary: a type only, in the leaf entry. A store resolves the values at the moment of the attempt (from the secret
 *           store by name, or an encrypted column of the host's own table); the job signs with them and keeps them
 *           nowhere: not in a job input, a log row, an event or an error (ADR 0173).
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (decision 2); ADR 0308 (rule 17: two secrets during a rotation); ADR 0173.
 */
import type { WebhookTarget } from "#contracts/types/webhook-target.type";

/** A receiver ready to sign for. */
export interface WebhookDeliveryTarget extends WebhookTarget {
  /** The secret values to sign with, current first; never empty. */
  readonly secrets: readonly string[];
}
