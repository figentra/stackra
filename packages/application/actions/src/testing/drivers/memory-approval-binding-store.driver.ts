/**
 * Stackra file contract:
 * Purpose: `MemoryApprovalBindingStoreDriver`, the "memory" `ApprovalBindingStore`: bindings in a map by approval id,
 *          insert-only, with the prune.
 * Boundary: test only, and single-process dev. It has no row-level security, so it cannot show another tenant's binding
 *           is invisible: `@stackra/tenancy`'s Postgres driver proves that. It stores frozen copies, so a caller cannot
 *           edit a binding after the insert.
 * Runtime: node
 * Governing contract: ADR 0509 (the binding, B1, N7); ADR 0266 (memory first); STA-1724 FR-007.
 */
import { Driver } from "@stackra/container";

import { ApprovalBindingStore } from "#contracts/ports/approval-binding-store.port";
import type { ApprovalBinding } from "#contracts/types/approval-binding.type";

/**
 * Keeps bindings in memory.
 *
 * @example
 * const bindings = new MemoryApprovalBindingStoreDriver();
 * await bindings.insert(binding);
 * await bindings.find(binding.approvalId); // the binding
 */
export class MemoryApprovalBindingStoreDriver extends Driver(ApprovalBindingStore) {
  private readonly rows = new Map<string, ApprovalBinding>();

  /** Inserts a copy of `binding`. */
  async insert(binding: ApprovalBinding): Promise<void> {
    if (this.rows.has(binding.approvalId))
      throw new RangeError(`An approval binding ${binding.approvalId} already exists`);
    this.rows.set(binding.approvalId, Object.freeze({ ...binding }));
  }

  /** The binding with `approvalId`, or `undefined`. */
  async find(approvalId: string): Promise<ApprovalBinding | undefined> {
    return this.rows.get(approvalId);
  }

  /** Deletes the bindings that expired before `cutoff`. */
  async prune(cutoff: Date): Promise<number> {
    let deleted = 0;
    for (const [id, row] of this.rows)
      if (row.expiresAt.getTime() < cutoff.getTime()) {
        this.rows.delete(id);
        deleted += 1;
      }
    return deleted;
  }
}
