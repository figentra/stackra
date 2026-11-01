/**
 * Stackra file contract:
 * Purpose: the `ApprovalBindingStore` port: the owning service's own tenant-owned record of each parked call
 *          (`ApprovalBinding`), inserted by the pipeline at park, read by the verify step and the executor, and deleted
 *          only by the daily prune.
 * Boundary: an abstract class that is its own token, keyed `actions.ApprovalBindingStore`. Insert-only: there is no
 *           update (N7). `find` answers only a binding of the tenant the call runs in (row-level security in the
 *           Postgres driver; the memory driver is for tests and single-process dev). `@stackra/tenancy` ships the
 *           Postgres driver because actions sits below tenancy and cannot use `BelongsToTenant`. An action that
 *           declares `approval` fails closed with none bound. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (the binding, B1, N7); ADR 0260; STA-1724 FR-007.
 */
import { Port } from "@stackra/contracts";

import type { ApprovalBinding } from "#contracts/types/approval-binding.type";

/**
 * Stores bindings.
 *
 * @example
 * export class PostgresApprovalBindingStoreDriver extends Driver(ApprovalBindingStore) {
 *   async insert(binding: ApprovalBinding): Promise<void> {
 *     await this.bindings.insert(ApprovalBindingModel.from(binding));
 *   }
 * }
 */
export abstract class ApprovalBindingStore extends Port {
  /** Type-only port key, so `DriverName<ApprovalBindingStore>` narrows to this port's drivers. */
  declare readonly "~key": "actions.ApprovalBindingStore";

  /** Inserts `binding`; the id is unique, so a second insert of it rejects. */
  abstract insert(binding: ApprovalBinding): Promise<void>;

  /** The binding with `approvalId` in the current tenant, or `undefined` when there is none. */
  abstract find(approvalId: string): Promise<ApprovalBinding | undefined>;

  /**
   * Deletes the bindings whose `expiresAt` is before `cutoff`; resolves to how many it deleted. Only the prune job
   * calls it, in a system run for the tenant it prunes.
   */
  abstract prune(cutoff: Date): Promise<number>;
}
