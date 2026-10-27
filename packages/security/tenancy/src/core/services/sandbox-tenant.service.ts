/**
 * Stackra file contract:
 * Purpose: `SandboxTenantService`, the rules of sandbox tenants: register a sandbox of a live tenant (never of another
 *          sandbox), list the ones in use, tell which environment a tenant is, find the live tenant a sandbox promotes
 *          to, and retire a sandbox.
 * Boundary: over `SandboxTenants` and `Clock`. The sandbox's scope node is the OS tenancy service's to create; this
 *           service records the link. How many sandboxes a plan allows is a limit entitlement on the creating action,
 *           not a number here; a lapse date is the caller's (plan data). A lapsed or retired sandbox is not in use.
 * Runtime: isomorphic
 * Governing contract: ADR 0280 (decisions 1 to 3 and 5); ADR 0210 (decision 8).
 */
import { Service } from "@stackra/container";
import type { Clock, PublicId } from "@stackra/contracts";

import { TenantEnvironment } from "#core/enums/tenant-environment.enum";
import { SandboxNotFoundError } from "#core/errors/sandbox-not-found.error";
import type { SandboxTenants } from "#core/ports/sandbox-tenants.port";
import type { SandboxTenant } from "#core/types/sandbox-tenant.type";

/**
 * Sandbox tenants of live tenants.
 *
 * @example
 * await sandboxes.register({ id: node.id, live: acme.id, name: "Checkout redesign" });
 */
export class SandboxTenantService extends Service {
  /** The store. */
  private readonly store: SandboxTenants;

  /** The current time. */
  private readonly clock: Clock;

  /**
   * @param store - where sandboxes are kept.
   * @param clock - the current time.
   */
  constructor(store: SandboxTenants, clock: Clock) {
    super();
    this.store = store;
    this.clock = clock;
  }

  /**
   * Registers `draft.id` as a sandbox of `draft.live`.
   *
   * @throws RangeError when the two ids are the same, the live tenant is itself a sandbox, the id is already a sandbox,
   *         or the lapse date is not in the future.
   */
  async register(draft: Omit<SandboxTenant, "createdAt" | "retiredAt">): Promise<SandboxTenant> {
    const now = this.clock.now();
    if (draft.id === draft.live) throw new RangeError("a tenant cannot be its own sandbox");
    if ((await this.store.get(draft.live)) !== undefined)
      throw new RangeError("a sandbox is made from a live tenant, not from another sandbox");
    if ((await this.store.get(draft.id)) !== undefined)
      throw new RangeError(`${draft.id} is already a sandbox`);
    if (draft.expiresAt !== undefined && draft.expiresAt.getTime() <= now.getTime())
      throw new RangeError("a sandbox lapses after it is made");
    const sandbox: SandboxTenant = { ...draft, createdAt: now };
    await this.store.save(sandbox);
    return sandbox;
  }

  /** The sandboxes of `live` still in use: not retired and not lapsed. */
  async inUse(live: PublicId<"scp">): Promise<readonly SandboxTenant[]> {
    const now = this.clock.now().getTime();
    return (await this.store.list(live)).filter(
      (sandbox) =>
        sandbox.retiredAt === undefined &&
        (sandbox.expiresAt === undefined || sandbox.expiresAt.getTime() > now),
    );
  }

  /** Whether `tenant` is a sandbox or a live tenant. */
  async environmentOf(tenant: PublicId<"scp">): Promise<TenantEnvironment> {
    return (await this.store.get(tenant)) === undefined
      ? TenantEnvironment.Live
      : TenantEnvironment.Sandbox;
  }

  /**
   * The live tenant `sandbox` promotes to.
   *
   * @throws SandboxNotFoundError when `sandbox` is not a sandbox.
   */
  async liveOf(sandbox: PublicId<"scp">): Promise<PublicId<"scp">> {
    const found = await this.store.get(sandbox);
    if (found === undefined) throw SandboxNotFoundError.create();
    return found.live;
  }

  /**
   * Retires `sandbox` of `live`; retiring a retired sandbox changes nothing.
   *
   * @throws SandboxNotFoundError when `sandbox` is not a sandbox of `live`.
   */
  async retire(live: PublicId<"scp">, sandbox: PublicId<"scp">): Promise<SandboxTenant> {
    const found = await this.store.get(sandbox);
    if (found === undefined || found.live !== live) throw SandboxNotFoundError.create();
    if (found.retiredAt !== undefined) return found;
    const retired: SandboxTenant = { ...found, retiredAt: this.clock.now() };
    await this.store.save(retired);
    return retired;
  }
}
