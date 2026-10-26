/**
 * Stackra file contract:
 * Purpose: `ListingRole`, what an app-market listing is: an app or a connector a tenant installs, an agency it hires,
 *          or a perk it redeems (a partner's offer: no install, redeemed by code, link or lead).
 * Boundary: an `Enum.of` value plus the type of the same name. Only `app` and `connector` install; a perk never
 *           reaches `planEditionInstall`. A new role is an ADR change.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 1); owner R1-OS-26, M3-7, R3-SO-18.
 */
import { Enum } from "@stackra/contracts";

/** The roles of a listing. */
export const ListingRole = Enum.of({
  /** An app the tenant installs. */
  App: "app",
  /** A connector the tenant installs and connects. */
  Connector: "connector",
  /** An agency the tenant hires; nothing installs. */
  Agency: "agency",
  /** A partner perk the tenant redeems; nothing installs. */
  Perk: "perk",
});

/** One of the codes above. */
export type ListingRole = Enum.Value<typeof ListingRole>;
