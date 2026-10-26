/**
 * Stackra file contract:
 * Purpose: `AutomationExceedsPublisherError`, the refusal to publish an automation that calls an action block its
 *          publisher may not call: a 403, since an automation's grants are never more than its publisher's.
 * Boundary: a refusal; it names the automation, the revision and the blocks, never the document or the publisher's
 *           grants.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 2); ADR 0423 (decision 1); ADR 0140; ADR 0294 (decision 20).
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A publish past the publisher's own access.
 *
 * @example
 * throw AutomationExceedsPublisherError.create({ automationId, revision: 3, blocks: ["payments.refund"] });
 */
export class AutomationExceedsPublisherError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {
  /** The automation. */
  automationId!: PublicId<"wfa">;

  /** The revision that was to be published. */
  revision!: number;

  /** The action blocks the publisher may not call. */
  blocks!: string[];
}
