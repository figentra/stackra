/**
 * Stackra file contract:
 * Purpose: `MemoryAppleDeveloperDriver`, the in-memory driver of the `AppleDeveloper` port: bundles and app records
 *          live in maps and every call is recorded in order, so tests and dry runs see exactly what onboarding would
 *          call.
 * Boundary: calls nothing outside the process. Seed `bundles` and `apps` to stand for what Apple already has.
 * Runtime: node
 * Governing contract: ADR 0482 (decision 4).
 */
import { Driver } from "@stackra/container";

import type { AppleCapability } from "#core/enums/apple-capability.enum";
import { AppleDeveloper } from "#core/ports/apple-developer.port";
import type { AppleBundle } from "#core/types/apple-bundle.type";

/**
 * Apple in memory.
 *
 * @example
 * const apple = new MemoryAppleDeveloperDriver();
 * apple.apps.set("com.figentra.commerce.staff", "6400000000");
 */
export class MemoryAppleDeveloperDriver extends Driver(AppleDeveloper) {
  /** Registered bundles by identifier. */
  readonly bundles = new Map<string, AppleBundle>();

  /** App Store Connect app ids by bundle identifier. */
  readonly apps = new Map<string, string>();

  /** Every call, in order, as `<method> <arguments>`. */
  readonly calls: string[] = [];

  /** The bundle `identifier`, or `null`. */
  override async findBundle(identifier: string): Promise<AppleBundle | null> {
    return this.bundles.get(identifier) ?? null;
  }

  /** Registers the bundle with no capability. */
  override async registerBundle(identifier: string, name: string): Promise<string> {
    this.calls.push(`registerBundle ${identifier} ${name}`);
    const id = `bundle-${this.bundles.size + 1}`;
    this.bundles.set(identifier, { id, capabilities: [] });
    return id;
  }

  /** Adds the capability to the bundle with resource id `bundle`. */
  override async enableCapability(bundle: string, capability: AppleCapability): Promise<void> {
    this.calls.push(`enableCapability ${bundle} ${capability}`);
    for (const [identifier, entry] of this.bundles)
      if (entry.id === bundle)
        this.bundles.set(identifier, {
          id: entry.id,
          capabilities: [...entry.capabilities, capability],
        });
  }

  /** The app id of `identifier`, or `null`. */
  override async findApp(identifier: string): Promise<string | null> {
    return this.apps.get(identifier) ?? null;
  }
}
