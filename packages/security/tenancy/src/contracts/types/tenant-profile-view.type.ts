/**
 * Stackra file contract:
 * Purpose: `TenantProfileView`, the active tenant's profile as the `TenantProfile` port reads and updates it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); OS `tenants.get-tenant`.
 */
import type { PublicId } from "@stackra/contracts";

/** The active tenant's profile. */
export interface TenantProfileView {
  /** The tenant's public id. */
  readonly tenantId: PublicId<"scp">;
  /** The tenant's handle, fixed at sign-up. */
  readonly handle: string;
  /** The name people see. */
  readonly name: string;
  /** The registered name, when it differs or is known. */
  readonly legalName: string | null;
  /** The logo for each colour scheme, as image URLs. */
  readonly logo: { readonly light: string | null; readonly dark: string | null };
  /** The market the tenant is placed in, fixed at sign-up. */
  readonly market: string;
  /** The BCP 47 locale the tenant's people start in, such as `ar-SA`. */
  readonly defaultLocale: string;
  /** The IANA time zone, such as `Asia/Riyadh`. */
  readonly timeZone: string;
  /** When the tenant was created. */
  readonly createdAt: Date;
}
