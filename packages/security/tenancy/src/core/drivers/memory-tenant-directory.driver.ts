/**
 * Stackra file contract:
 * Purpose: `MemoryTenantDirectoryDriver`, a `TenantDirectory` held in memory, for tests and local runs.
 * Boundary: process-local and unsynchronised; never a production store. It mints an `scp_` id for each tenant.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-001; ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import { mintPublicId } from "@stackra/contracts";

import { TenantDirectory } from "#core/ports/tenant-directory.port";
import type { TenantDraft } from "#core/types/tenant-draft.type";
import type { TenantRecord } from "#core/types/tenant-record.type";

/**
 * Tenants held in memory.
 *
 * @example
 * const directory = new MemoryTenantDirectoryDriver();
 */
export class MemoryTenantDirectoryDriver extends Driver(TenantDirectory) {
  /** The tenants, oldest first. */
  private readonly tenants: TenantRecord[] = [];

  /** The tenants, oldest first. */
  list(): Promise<readonly TenantRecord[]> {
    return Promise.resolve([...this.tenants]);
  }

  /** Creates and keeps the tenant. */
  create(draft: TenantDraft): Promise<TenantRecord> {
    const record = Object.freeze({
      id: mintPublicId("scp"),
      name: draft.name,
      createdAt: new Date(),
    });
    this.tenants.push(record);
    return Promise.resolve(record);
  }
}
