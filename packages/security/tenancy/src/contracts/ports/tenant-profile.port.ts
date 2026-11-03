/**
 * Stackra file contract:
 * Purpose: the `TenantProfile` client port: reads and updates the active tenant's profile, for `OrganizationPage`.
 * Boundary: an abstract class that is its own token. An app binds it to its generated client (`tenants.get-tenant` and
 *           the profile update the OS adds); it acts on the active tenant, so it takes no tenant id. The legal entities
 *           and domains are not here: the page takes them through props until their panel resources land.
 *           `MemoryTenantProfileDriver` in `./testing`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0263 (ports and drivers).
 */
import { Port } from "@stackra/contracts";

import type { TenantProfileView } from "#contracts/types/tenant-profile-view.type";

/**
 * The active tenant's profile.
 *
 * @example
 * const profile = useContainer().get(TenantProfile);
 * await profile.update({ name: "Acme Academy" });
 */
export abstract class TenantProfile extends Port {
  /** The profile. */
  abstract get(): Promise<TenantProfileView>;

  /** Changes the given fields and answers the profile as it now is. */
  abstract update(input: {
    readonly name?: string | undefined;
    readonly legalName?: string | undefined;
    readonly logo?: { readonly light: string | null; readonly dark: string | null } | undefined;
    readonly defaultLocale?: string | undefined;
    readonly timeZone?: string | undefined;
  }): Promise<TenantProfileView>;
}
