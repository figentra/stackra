/**
 * Stackra file contract:
 * Purpose: `TenantRecord`, one tenant as the directory lists it: its id, its name and when it was created.
 * Boundary: a type only. The registry keeps more per tenant (region, cell, plan); the directory shows the three the
 *           operator needs to recognise one.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-001; ADR 0172.
 */
import type { PublicId } from "@stackra/contracts";

/** A tenant in the directory. */
export interface TenantRecord {
  /** The tenant's id (its scope node). */
  readonly id: PublicId<"scp">;

  /** Its display name. */
  readonly name: string;

  /** When it was created. */
  readonly createdAt: Date;
}
