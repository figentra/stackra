/**
 * Stackra file contract:
 * Purpose: `InAppEntry`, one stored message of a person's in-app inbox: the appended `InAppMessage` with its id, when
 *          it arrived and when it was read.
 * Boundary: a type only; what `InAppStore.append` returns and `list` answers. The id is the store's public id of the
 *           entry; the recipient is not repeated, because every read names the recipient.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0135 (public ids).
 */
import type { PublicId } from "@stackra/contracts";

import type { InAppMessage } from "#contracts/types/in-app-message.type";

/**
 * A message in an inbox.
 *
 * @example
 * const unread = (await inbox.list(principalId, { unreadOnly: true })).length;
 */
export interface InAppEntry extends InAppMessage {
  /** The entry's public id. */
  readonly id: PublicId;

  /** When it was appended. */
  readonly createdAt: Date;

  /** When the recipient read it; `null` while unread. */
  readonly readAt: Date | null;
}
