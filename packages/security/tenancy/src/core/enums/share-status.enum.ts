/**
 * Stackra file contract:
 * Purpose: `ShareStatus`, where a cross-tenant share stands: proposed by one tenant, active once the other accepts,
 *          declined, or revoked by either.
 * Boundary: an `Enum.of` value plus the type of the same name. Codes are stored on the share, so a code never changes.
 *           Only `TenantShareService` moves a share between them.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decisions 1 and 5); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The states of a share. */
export const ShareStatus = Enum.of({
  /** One tenant proposed; the other has not answered. */
  Proposed: "proposed",
  /** Both consented; copies flow (in one region) or are released (across regions). */
  Active: "active",
  /** The receiving tenant refused the proposal. */
  Declined: "declined",
  /** Either tenant ended it; nothing more crosses. */
  Revoked: "revoked",
});

/** One of the codes above. */
export type ShareStatus = Enum.Value<typeof ShareStatus>;
