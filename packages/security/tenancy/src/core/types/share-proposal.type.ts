/**
 * Stackra file contract:
 * Purpose: `ShareProposal`, what a tenant names when it proposes a share: the share's id, the two tenants, its record,
 *          the item kinds with their terms, and whether the tenants are in different regions.
 * Boundary: a type only, the part of `TenantShare` the proposer chooses; the state and the times are the service's.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decision 1).
 */
import type { TenantShare } from "#core/types/tenant-share.type";

/** What a tenant names when it proposes a share. */
export type ShareProposal = Pick<
  TenantShare,
  "id" | "proposer" | "receiver" | "source" | "items" | "crossRegion"
>;
