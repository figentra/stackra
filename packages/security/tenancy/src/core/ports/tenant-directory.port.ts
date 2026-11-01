/**
 * Stackra file contract:
 * Purpose: the `TenantDirectory` port: the tenants a host knows: list them and create one on an operator's behalf,
 *          and name the platform's operations tenant (the one whose chain holds console audit entries).
 * Boundary: an abstract class that is its own token, kept in `.` beside the `TenantRecord` and `TenantDraft` types it
 *           names. The OS tenancy service implements it over its tenant registry (and creates the scope node);
 *           `MemoryTenantDirectoryDriver` serves tests and single-process hosts. The `tenant:*` commands use it, so
 *           they write no SQL.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-001 and FR-018 (the owner's S4 and S5 decisions); ADR 0172; ADR 0263.
 */
import { Port } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";

import type { TenantDraft } from "#core/types/tenant-draft.type";
import type { TenantRecord } from "#core/types/tenant-record.type";

/**
 * Lists and creates tenants.
 *
 * @example
 * const acme = await directory.create({ name: "Acme" }, "ada");
 */
export abstract class TenantDirectory extends Port {
  /** Every tenant, oldest first, as `operator` asked for them (the registry authorises and attributes the read). */
  abstract list(operator: string): Promise<readonly TenantRecord[]>;

  /** Creates the tenant `draft` describes on `operator`'s behalf and returns it. */
  abstract create(draft: TenantDraft, operator: string): Promise<TenantRecord>;

  /** The id of the platform's operations tenant, or `undefined` when the registry marks none. */
  abstract operationsTenant(): Promise<PublicId<"scp"> | undefined>;
}
