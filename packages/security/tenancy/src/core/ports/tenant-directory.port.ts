/**
 * Stackra file contract:
 * Purpose: the `TenantDirectory` port: the tenants a host knows: list them and create one.
 * Boundary: an abstract class that is its own token, kept in `.` beside the `TenantRecord` and `TenantDraft` types it
 *           names. The OS tenancy service implements it over its tenant registry (and creates the scope node);
 *           `MemoryTenantDirectoryDriver` serves tests and single-process hosts. The `tenant:*` commands use it, so
 *           they write no SQL.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-001; ADR 0172; ADR 0263.
 */
import { Port } from "@stackra/contracts";

import type { TenantDraft } from "#core/types/tenant-draft.type";
import type { TenantRecord } from "#core/types/tenant-record.type";

/**
 * Lists and creates tenants.
 *
 * @example
 * const acme = await directory.create({ name: "Acme" });
 */
export abstract class TenantDirectory extends Port {
  /** Every tenant, oldest first. */
  abstract list(): Promise<readonly TenantRecord[]>;

  /** Creates the tenant `draft` describes and returns it. */
  abstract create(draft: TenantDraft): Promise<TenantRecord>;
}
