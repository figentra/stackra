/**
 * Stackra file contract:
 * Purpose: `DeliveryState`, where a cross-app delivery stands: pending (never tried), failing (tried and due again) or
 *          dead (dead-lettered). A delivered row is deleted, so it has no state.
 * Boundary: an `Enum.of` value plus the type of the same name; derived from `attempts` and `dead_at`, never stored.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 17, amendment of 2026-11-02); ADR 0231 (codes).
 */
import { Enum } from "@stackra/contracts";

/** The states of a cross-app delivery. */
export const DeliveryState = Enum.of({
  /** Written and not tried yet. */
  Pending: "pending",
  /** Tried at least once and due again after its backoff. */
  Failing: "failing",
  /** Dead-lettered: its last attempt failed or the subscriber refused it for good. */
  Dead: "dead",
});

/** One of the codes above. */
export type DeliveryState = Enum.Value<typeof DeliveryState>;
