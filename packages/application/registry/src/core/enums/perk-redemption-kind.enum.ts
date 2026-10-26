/**
 * Stackra file contract:
 * Purpose: `PerkRedemptionKind`, how a tenant redeems a perk: a code it uses at the partner, a link it follows, or a
 *          lead the partner receives after the tenant admin consents.
 * Boundary: an `Enum.of` value plus the type of the same name; which kind a perk uses is listing data.
 * Runtime: isomorphic
 * Governing contract: ADR 0393 (decision 1); owner M3-7.
 */
import { Enum } from "@stackra/contracts";

/** The ways to redeem a perk. */
export const PerkRedemptionKind = Enum.of({
  /** A code shown to the tenant. */
  Code: "code",
  /** A link the tenant follows. */
  Link: "link",
  /** The tenant's details sent to the partner, after consent. */
  Lead: "lead",
});

/** One of the codes above. */
export type PerkRedemptionKind = Enum.Value<typeof PerkRedemptionKind>;
