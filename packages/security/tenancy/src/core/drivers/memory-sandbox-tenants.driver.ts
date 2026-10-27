/**
 * Stackra file contract:
 * Purpose: `MemorySandboxTenantsDriver`, a `SandboxTenants` held in memory, for tests and local runs.
 * Boundary: process-local and unsynchronised; never a production store. `save` replaces a sandbox with the same id.
 * Runtime: isomorphic
 * Governing contract: ADR 0280 (decision 3); ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { SandboxTenants } from "#core/ports/sandbox-tenants.port";
import type { SandboxTenant } from "#core/types/sandbox-tenant.type";

/**
 * Sandboxes held in memory.
 *
 * @example
 * const store = new MemorySandboxTenantsDriver();
 */
export class MemorySandboxTenantsDriver extends Driver(SandboxTenants) {
  /** Sandbox id to sandbox, in insertion order. */
  private readonly sandboxes = new Map<PublicId<"scp">, SandboxTenant>();

  /** Records `sandbox`, replacing one with the same id. */
  save(sandbox: SandboxTenant): Promise<void> {
    this.sandboxes.set(sandbox.id, Object.freeze({ ...sandbox }));
    return Promise.resolve();
  }

  /** The sandbox `id`, or `undefined`. */
  get(id: PublicId<"scp">): Promise<SandboxTenant | undefined> {
    return Promise.resolve(this.sandboxes.get(id));
  }

  /** The sandboxes of `live`, oldest first. */
  list(live: PublicId<"scp">): Promise<readonly SandboxTenant[]> {
    return Promise.resolve(
      [...this.sandboxes.values()]
        .filter((sandbox) => sandbox.live === live)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    );
  }
}
