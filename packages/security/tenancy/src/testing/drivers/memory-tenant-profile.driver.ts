/**
 * Stackra file contract:
 * Purpose: `MemoryTenantProfileDriver`, a `TenantProfile` held in memory, for tests, the showcase and local runs:
 *          `set` names the profile; `update` merges the given fields into it.
 * Boundary: process-local; never a production store. `get` before `set` rejects, as a tenant that cannot be read does.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `memory`); ADR 0266 (memory first); ADR 0269
 *                     (decision 3).
 */
import { Driver } from "@stackra/container";

import { TenantProfile } from "#contracts/ports/tenant-profile.port";
import type { TenantProfileView } from "#contracts/types/tenant-profile-view.type";

/**
 * A profile held in memory.
 *
 * @example
 * const profile = new MemoryTenantProfileDriver().set(acme);
 */
export class MemoryTenantProfileDriver extends Driver(TenantProfile) {
  /** Each update's input, oldest first, for a test to read. */
  readonly updates: Parameters<TenantProfile["update"]>[0][] = [];

  /** The profile, once set. */
  private profile: TenantProfileView | undefined;

  /** Replaces the profile; returns this driver. */
  set(profile: TenantProfileView): this {
    this.profile = { ...profile };
    return this;
  }

  /** Answers the profile; rejects while none is set. */
  get(): Promise<TenantProfileView> {
    if (this.profile === undefined) return Promise.reject(new Error("no profile is set"));
    return Promise.resolve(this.profile);
  }

  /** Records the input and merges its defined fields into the profile; rejects while none is set. */
  update(input: Parameters<TenantProfile["update"]>[0]): Promise<TenantProfileView> {
    this.updates.push(input);
    if (this.profile === undefined) return Promise.reject(new Error("no profile is set"));
    const defined = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Partial<TenantProfileView>;
    this.profile = { ...this.profile, ...defined };
    return Promise.resolve(this.profile);
  }
}
