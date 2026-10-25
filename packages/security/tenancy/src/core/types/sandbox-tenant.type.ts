/**
 * Stackra file contract:
 * Purpose: `SandboxTenant`, one sandbox of a live tenant: its own scope node, the live tenant it belongs to, its name,
 *          when it was made, when it lapses and when it was retired.
 * Boundary: a type only. A sandbox is a tenant of its own (its own rows, its own `tenant_id`), linked to its live
 *           tenant; promotion copies configuration only and never keys (ADR 0280 decisions 1 and 2), which is the
 *           OS tenancy and settings services' work. How many sandboxes a plan allows is a limit entitlement.
 * Runtime: isomorphic
 * Governing contract: ADR 0280 (decisions 1 to 3); ADR 0210 (decision 8).
 */
import type { PublicId } from "@stackra/contracts";

/** A sandbox tenant. */
export interface SandboxTenant {
  /** The sandbox's own tenant id (its scope node). */
  readonly id: PublicId<"scp">;

  /** The live tenant it was made from and promotes to. */
  readonly live: PublicId<"scp">;

  /** Its display name. */
  readonly name: string;

  /** When it was made. */
  readonly createdAt: Date;

  /** When it lapses; absent for a sandbox kept until retired. */
  readonly expiresAt?: Date;

  /** When it was retired; absent while in use. */
  readonly retiredAt?: Date;
}
