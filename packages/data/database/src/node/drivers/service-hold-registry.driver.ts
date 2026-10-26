/**
 * Stackra file contract:
 * Purpose: `ServiceHoldRegistryDriver`, the `HoldRegistry` every service but the holds keeper binds: it asks the holds
 *          service through `HoldChannel`, so each service's deletes, purges, retention jobs and frozen edits skip the
 *          records under a legal hold kept there.
 * Boundary: a driver of the `HoldRegistry` port; it reaches the holds service only through `HoldChannel`. No cache, so
 *           a new hold applies to the next disposal; an unreachable service throws and the disposal fails (fail
 *           closed). It sends the model's name, the ids and their subject links; the holds service logs each refusal.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment); ADR 0263 (ports and drivers); ADR 0260 (generated clients);
 *                     STA-1241 (moves the OS compliance-privacy stopgap of the same name here).
 */
import { Driver } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import type { Disposal } from "#contracts/enums/disposal.enum";
import type { HoldChannel } from "#contracts/ports/hold-channel.port";
import { HoldRegistry } from "#contracts/ports/hold-registry.port";
import type { HoldLinks } from "#contracts/types/hold-links.type";

/**
 * Holds from the holds service.
 *
 * @example
 * container.bind(HoldChannel, ClientHoldChannelDriver);
 * container.bind(HoldRegistry, ServiceHoldRegistryDriver);
 */
export class ServiceHoldRegistryDriver extends Driver(HoldRegistry) {
  /** The call to the holds service. */
  private readonly channel: HoldChannel;

  /** @param channel - the service's call to the holds keeper. */
  constructor(channel: HoldChannel) {
    super();
    this.channel = channel;
  }

  /** See `HoldRegistry.heldAmong`; nothing is asked for no ids. */
  async heldAmong<M extends object>(
    model: AnyClass<M>,
    ids: readonly string[],
    disposal: Disposal,
    links?: HoldLinks,
  ): Promise<ReadonlySet<string>> {
    if (ids.length === 0) return new Set();
    const held =
      links === undefined
        ? await this.channel.check(model.name, ids, disposal)
        : await this.channel.check(model.name, ids, disposal, links);
    return new Set(held);
  }
}
