/**
 * Stackra file contract:
 * Purpose: `NotifierAddressMessage`, one notification prepared for one mail address with no account
 *          (`Recipient.address`), as the `notifications` Notifier driver hands it to its target's `addressPayload`:
 *          a `NotifierMessage` with the address in place of the principal.
 * Boundary: a type only. The address is the one the producer named, trimmed and lower-cased; it travels to the target
 *           service only, for a person who has no principal yet (an invitation), never for one who has (ADR 0134).
 * Runtime: node
 * Governing contract: ADR 0422 (decision 1, as amended by STA-1235); ADR 0134.
 */
import type { NotifierMessage } from "#node/types/notifier-message.type";

/** A notification for one mail address, ready for the target's `addressPayload`. */
export interface NotifierAddressMessage extends Omit<NotifierMessage, "principalId"> {
  /** The recipient's mail address. */
  readonly email: string;
}
