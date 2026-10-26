/**
 * Stackra file contract:
 * Purpose: `MentionNotAllowedError`, the refusal of a mention the floors forbid: an external participant on an internal
 *          comment, the assistant while it has no handle, a target with no id, or a target the directory does not know.
 *          A 400.
 * Boundary: a refusal; it names the mention kind only, never the target.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 3); ADR 0140 (error envelope); OS-226.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

import type { MentionKind } from "#contracts/enums/mention-kind.enum";

/**
 * A mention refused.
 *
 * @example
 * throw MentionNotAllowedError.create({ kind: MentionKind.ExternalParticipant });
 */
export class MentionNotAllowedError extends Refusal({
  kind: ErrorKind.InvalidArgument,
  retryable: false,
}) {
  /** The refused mention's kind. */
  kind!: MentionKind;
}
