/**
 * Stackra file contract:
 * Purpose: `RegionKey`, the tenant region keys an environment's `region` names: `me`, `eu` and `ksa`.
 * Boundary: an `Enum.of` value plus the type of the same name. The cloud, location and account of each key are
 *           figentra/infra's (`ref:aws.accounts.<region>`), never code here; a new key needs an OS 0001 amendment.
 * Runtime: isomorphic
 * Governing contract: OS ADR 0001 (tenant regions), ADR 0524 (account layout), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per tenant region. */
export const RegionKey = Enum.of({
  /** The Middle East: AWS me-central-1, UAE. */
  Me: "me",
  /** Europe: AWS eu-central-1, Frankfurt. */
  Eu: "eu",
  /** Saudi Arabia, in-country: GCP me-central2, Dammam. */
  Ksa: "ksa",
});

/** One of the codes above. */
export type RegionKey = Enum.Value<typeof RegionKey>;
