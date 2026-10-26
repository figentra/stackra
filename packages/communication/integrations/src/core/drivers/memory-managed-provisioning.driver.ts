/**
 * Stackra file contract:
 * Purpose: `MemoryManagedProvisioningDriver`, the `memory` `ManagedProvisioning`: resources and cost events held in
 *          this process, so a managed-provisioning workflow runs end to end in a test or a local host with no provider.
 *          A resource it creates waits `pending` until `settle` moves it, as a provider's review would.
 * Boundary: the driver named `memory`; nothing outlives the process and no provider is called. A provider's driver
 *           replaces it in a host. `create` is idempotent by the request's reference.
 * Runtime: isomorphic
 * Governing contract: R3-SO-03; ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";

import { ProvisioningStatus } from "#contracts/enums/provisioning-status.enum";
import { ManagedProvisioning } from "#contracts/ports/managed-provisioning.port";
import type { ManagedCostEvent } from "#contracts/types/managed-cost-event.type";
import type { ManagedResource } from "#contracts/types/managed-resource.type";
import type { ProvisioningRequest } from "#contracts/types/provisioning-request.type";

/**
 * Managed resources in memory.
 *
 * @example
 * const resource = await provisioning.create(request);
 * await provisioning.settle(resource.id, ProvisioningStatus.Active);
 */
export class MemoryManagedProvisioningDriver extends Driver(ManagedProvisioning) {
  /** Tells the time a status changes. */
  private readonly clock: Clock;

  /** Resource id to resource. */
  private readonly resources = new Map<string, ManagedResource>();

  /** Recorded cost events, oldest first. */
  private readonly events: ManagedCostEvent[] = [];

  /**
   * @param clock - the container's clock.
   */
  constructor(clock: Clock) {
    super();
    this.clock = clock;
  }

  /** Creates a pending resource, or returns the one already made for the same `reference`. */
  async create(request: ProvisioningRequest): Promise<ManagedResource> {
    for (const known of this.resources.values())
      if (known.reference === request.reference) return known;
    const id = `res_${crypto.randomUUID().replaceAll("-", "")}`;
    return this.put({
      id,
      reference: request.reference,
      category: request.category,
      provider: request.provider,
      scope: request.scope,
      status: ProvisioningStatus.Pending,
      providerRef: id,
      updatedAt: this.clock.now(),
    });
  }

  /** The resource `resourceId` as it stands; this memory provider has nothing to check. */
  async verify(resourceId: string): Promise<ManagedResource> {
    return this.load(resourceId);
  }

  /** Marks the resource `resourceId` suspended. */
  async suspend(resourceId: string): Promise<ManagedResource> {
    return this.settle(resourceId, ProvisioningStatus.Suspended);
  }

  /** Marks the resource `resourceId` removed. */
  async remove(resourceId: string): Promise<ManagedResource> {
    return this.settle(resourceId, ProvisioningStatus.Removed);
  }

  /** The resource `resourceId`, or `null` when it is unknown. */
  async status(resourceId: string): Promise<ManagedResource | null> {
    return this.resources.get(resourceId) ?? null;
  }

  /** The cost events of `resourceId` that occurred at or after `since`. */
  async costs(resourceId: string, since: Date): Promise<readonly ManagedCostEvent[]> {
    return this.events.filter(
      (event) => event.resourceId === resourceId && event.occurredAt >= since,
    );
  }

  /**
   * Moves a resource to `status`, as the provider's answer would.
   *
   * @throws NotFoundError when no resource has the id.
   */
  async settle(
    resourceId: string,
    status: ProvisioningStatus,
    reason?: string,
  ): Promise<ManagedResource> {
    const { reason: _previous, ...resource } = await this.load(resourceId);
    return this.put({
      ...resource,
      status,
      ...(reason === undefined ? {} : { reason }),
      updatedAt: this.clock.now(),
    });
  }

  /**
   * Records a cost event of a known resource.
   *
   * @throws NotFoundError when no resource has the event's resource id.
   */
  async record(event: ManagedCostEvent): Promise<void> {
    await this.load(event.resourceId);
    if (!this.events.some((known) => known.id === event.id)) this.events.push(event);
  }

  /**
   * The resource `id`.
   *
   * @throws NotFoundError when there is none.
   */
  private async load(id: string): Promise<ManagedResource> {
    const resource = this.resources.get(id);
    if (resource === undefined) throw NotFoundError.create();
    return resource;
  }

  /** Stores `resource` and returns it. */
  private put(resource: ManagedResource): ManagedResource {
    this.resources.set(resource.id, resource);
    return resource;
  }
}
