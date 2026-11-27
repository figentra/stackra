/**
 * Stackra file contract:
 * Purpose: `RegionKey`, the named region presets an environment's `region` may name: `me`, `eu` and `ksa`, Figentra's
 *          tenant regions. Any other provider region (`us-east-1`, `europe-west1`) is named by its own id instead
 *          (`resolveRegion`).
 * Boundary: an `Enum.of` value plus the type of the same name. Each preset's cloud and location are
 *           `REGION_PRESETS`; its account stays figentra/infra's (one account per product, `ref:aws.account`); a new
 *           preset needs an OS 0001 amendment.
 * Runtime: isomorphic
 * Governing contract: OS ADR 0001 (tenant regions), ADR 0524 (account layout; amendment 2026-11-27, STA-2896),
 *                     ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per named preset. */
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
