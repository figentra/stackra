/**
 * Stackra file contract:
 * Purpose: `DeliverablePayload`, the body a webhook endpoint receives for a catalogue event: full, or thin (ids plus
 *          the event's named `thinFields`) when its payload carries a personal-data class.
 * Boundary: an `Enum.of` value plus the type of the same name; `deliverableEvents` picks it from the manifest.
 * Runtime: isomorphic
 * Governing contract: ADR 0224 (webhooks); ADR 0134 (personal-data classes); OS-212.
 */
import { Enum } from "@stackra/contracts";

/** The two payload shapes. */
export const DeliverablePayload = Enum.of({
  /** Ids plus the named fields only. */
  Thin: "thin",
  /** The whole event payload. */
  Full: "full",
});

/** One of the codes above. */
export type DeliverablePayload = Enum.Value<typeof DeliverablePayload>;
