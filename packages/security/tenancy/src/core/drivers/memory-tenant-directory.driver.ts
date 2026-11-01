/**
 * Stackra file contract:
 * Purpose: `MemoryTenantDirectoryDriver`, a `TenantDirectory` held in memory, for tests and local runs.
 * Boundary: process-local and unsynchronised; never a production store. It mints an `scp_` id for each tenant.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-001; ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import { mintPublicId } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";

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
  /** Each call's operator, as `list:<operator>` or `create:<operator>`, oldest first. */
  readonly calls: string[] = [];

  /** The tenants, oldest first. */
  private readonly tenants: TenantRecord[] = [];

  /** The operations tenant, when one is marked. */
  private operations: PublicId<"scp"> | undefined;

  /** Marks `id` as the platform's operations tenant; returns this driver. */
  markOperations(id: PublicId<"scp">): this {
    this.operations = id;
    return this;
  }

  /** The tenants, oldest first. */
  list(operator: string): Promise<readonly TenantRecord[]> {
    this.calls.push(`list:${operator}`);
    return Promise.resolve([...this.tenants]);
  }

  /** The marked operations tenant. */
  operationsTenant(): Promise<PublicId<"scp"> | undefined> {
    return Promise.resolve(this.operations);
  }

  /** Creates and keeps the tenant. */
  create(draft: TenantDraft, operator: string): Promise<TenantRecord> {
    this.calls.push(`create:${operator}`);
    const record = Object.freeze({
      id: mintPublicId("scp"),
      name: draft.name,
      createdAt: new Date(),
    });
    this.tenants.push(record);
    return Promise.resolve(record);
  }
}
