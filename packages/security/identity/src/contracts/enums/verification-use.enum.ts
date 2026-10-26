/**
 * Stackra file contract:
 * Purpose: `VerificationUse`, whose check it is: Figentra's own check of a tenant (platform KYB, KYC of owners,
 *          sanctions, bank account; use A) or a tenant's check of its own customers (use B).
 * Boundary: an `Enum.of` value plus the type of the same name. A platform check is answered only by platform (managed)
 *           Connections, never by a tenant's own account; a tenant check takes the tenant's own Connection first, then
 *           the managed one. Codes are stored on verification records, so a code never changes.
 * Runtime: isomorphic
 * Governing contract: owner decision R3-1 (2026-10-26); capability map M2; ADR 0376 (decision 1, verification Note).
 */
import { Enum } from "@stackra/contracts";

/** Whose check it is. */
export const VerificationUse = Enum.of({
  /** Figentra checks a tenant; pinned to platform Connections. */
  Platform: "platform",
  /** A tenant checks its own customer; its own Connection, else the managed one. */
  Tenant: "tenant",
});

/** One of the codes above. */
export type VerificationUse = Enum.Value<typeof VerificationUse>;
