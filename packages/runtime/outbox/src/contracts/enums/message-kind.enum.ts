/**
 * Stackra file contract:
 * Purpose: `MessageKind`, what an outbox message carries: an integration event the relay publishes, or a row change
 *          the relay hands to the change consumers registered for its model.
 * Boundary: an `Enum.of` value plus the type of the same name; the codes are the `kind` column of `outbox.messages`.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decision 4); ADR 0221 (decision 5: indexing through the outbox); ADR 0294
 *                     (decision 16); ADR 0231 (codes).
 */
import { Enum } from "@stackra/contracts";

/** The kinds of outbox message. */
export const MessageKind = Enum.of({
  /** An integration event, published through the `EventPublisher` under its wire name. */
  Event: "event",
  /** A row change of a watched model, handed to its change consumers in this service. */
  Change: "change",
});

/** One of the codes above. */
export type MessageKind = Enum.Value<typeof MessageKind>;
