/**
 * Stackra file contract:
 * Purpose: `PublicationStatus`, the state of a `Publishable` record: a draft, scheduled for a time, or published.
 * Boundary: an `Enum.of` value plus the type of the same name; the code is the stored value. Who may publish is the
 *           calling action's permission; when a scheduled record goes live is its `publishAt`.
 * Runtime: isomorphic
 * Governing contract: ADR 0321 (decision 2: `Publishable`).
 */
import { Enum } from "@stackra/contracts";

/** The publication states. */
export const PublicationStatus = Enum.of({
  /** Not visible to readers. */
  Draft: "draft",
  /** Goes live at its `publishAt`. */
  Scheduled: "scheduled",
  /** Visible to readers. */
  Published: "published",
});

/** One of the codes above. */
export type PublicationStatus = Enum.Value<typeof PublicationStatus>;
