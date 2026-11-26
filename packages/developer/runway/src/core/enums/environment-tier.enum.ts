/**
 * Stackra file contract:
 * Purpose: `EnvironmentTier`, the size an environment runs at, from the finance tiers (the cost plan of 2026-11-06):
 *          `staging` (one small task, a micro database), `launch` (the first customers) and `growth` (the ADR 0004
 *          year-1 load).
 * Boundary: an `Enum.of` value plus the type of the same name. The sizes behind each tier are `TIER_SIZES`.
 * Runtime: isomorphic
 * Governing contract: ADR 0524; ADR 0004 (year-1 load); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per tier. */
export const EnvironmentTier = Enum.of({
  /** One 0.25 vCPU task, db.t4g.micro single-AZ, serverless Valkey, one NAT gateway. */
  Staging: "staging",
  /** Two 0.5 vCPU tasks, db.t4g.medium Multi-AZ, serverless Valkey, one NAT gateway; production's default. */
  Launch: "launch",
  /** Two to ten 1 vCPU tasks, db.m7g.large Multi-AZ, two m7g cache nodes, three NAT gateways. */
  Growth: "growth",
});

/** One of the tiers above. */
export type EnvironmentTier = Enum.Value<typeof EnvironmentTier>;
