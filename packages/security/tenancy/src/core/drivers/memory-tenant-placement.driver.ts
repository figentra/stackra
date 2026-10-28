/**
 * Stackra file contract:
 * Purpose: `MemoryTenantPlacementDriver`, the in-memory `TenantPlacement`: a map of tenant id to placement, for tests
 *          and single-process hosts.
 * Boundary: process memory only; never shared between instances. `place` sets a tenant's region and, by default, the
 *           primary cell.
 * Runtime: isomorphic
 * Governing contract: ADR 0172 (decision 3); ADR 0186 (decision 6); stackra-310.
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { PRIMARY_CONNECTION } from "@stackra/database/contracts";

import { TenantPlacement } from "#core/ports/tenant-placement.port";
import type { Placement } from "#core/types/placement.type";

/**
 * Placements in a map.
 *
 * @example
 * const placements = new MemoryTenantPlacementDriver().place(tenantId, "me");
 */
export class MemoryTenantPlacementDriver extends Driver(TenantPlacement) {
  /** The placements by tenant id. */
  private readonly placements = new Map<PublicId<"scp">, Placement>();

  /** Places `tenant` in `region` and `cell` (the primary cell by default); returns this driver. */
  place(tenant: PublicId<"scp">, region: string, cell: string = PRIMARY_CONNECTION): this {
    this.placements.set(tenant, { region, cell });
    return this;
  }

  /** Implements `TenantPlacement.of`, documented there. */
  async of(tenant: PublicId<"scp">): Promise<Placement | undefined> {
    return this.placements.get(tenant);
  }
}
