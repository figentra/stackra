/**
 * Stackra file contract:
 * Purpose: `RelayDeliveriesCommand`, `outbox:relay-deliveries`: a table of the producer's cross-app deliveries, oldest
 *          first, with each one's subscriber, event type, state, attempts and last error code.
 * Boundary: read only. A platform operator's command over every tenant's deliveries: `DeliveryDriver.list` claims
 *           ids, tenants and states through a system function, then each delivery is loaded in its own tenant's
 *           isolation (`inRowOwner`, the bound `CallIsolation`, read optionally from the injected `Container`, so an app
 *           without tenancy still boots and lists its platform rows); a claimed one that does not load fails the command
 *           (`ClaimNotLoadedError`), never skipped. `--subscriber` and `--state` (`pending`, `failing`, `dead`) narrow
 *           it and `--limit` caps the rows (50 by default). It prints no envelope and no tenant.
 * Runtime: node
 * Governing contract: ADR 0511 (decision 12, amendment of 2026-11-02); STA-1910 spec FR-014; ADR 0506; ADR 0239
 *                     (2026-11-07 amendment, gap A).
 */
import { Command, Option } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import type { Container } from "@stackra/container";
import { Int, Str } from "@stackra/validation";

import type { Delivery, DeliveryDriver, DeliveryState } from "#contracts/index";
import { ClaimNotLoadedError } from "#core/errors/claim-not-loaded.error";
import { deliveryStateOf } from "#core/functions/delivery-state-of.function";
import { boundIsolation } from "#core/functions/bound-isolation.function";
import { inRowOwner } from "#core/functions/in-row-owner.function";

/** Lists the cross-app deliveries. */
export class RelayDeliveriesCommand extends Command({
  name: "outbox:relay-deliveries",
  description: "List the cross-app event deliveries per subscriber and state",
}) {
  /** Only this subscriber. */
  @Option({ description: "Only this subscriber (a member key)" })
  @Str
  subscriber?: string;

  /** Only this state. */
  @Option({ description: "Only this state: pending, failing or dead" })
  @Str({ pattern: /^(pending|failing|dead)$/ })
  state?: string;

  /** The most rows. */
  @Option({ description: "The most deliveries to list" })
  @Int({ min: 1 })
  limit = 50;

  /** The delivery store. */
  private readonly driver: DeliveryDriver;

  /** The container the bound `CallIsolation`, if any, is read from at run time. */
  private readonly container: Container;

  /**
   * @param driver - the delivery port.
   * @param container - the container whose `CallIsolation` each delivery is loaded in, when one is bound.
   */
  constructor(driver: DeliveryDriver, container: Container) {
    super();
    this.driver = driver;
    this.container = container;
  }

  /**
   * Prints the table; returns the deliveries.
   *
   * @throws ClaimNotLoadedError when a listed delivery does not load in its tenant.
   */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const claims = await this.driver.list({
      ...(this.subscriber === undefined ? {} : { subscriber: this.subscriber }),
      ...(this.state === undefined ? {} : { state: this.state as DeliveryState }),
      limit: this.limit,
    });
    const deliveries: Delivery[] = [];
    for (const claim of claims) {
      const delivery = await inRowOwner(
        boundIsolation(this.container),
        claim.ownerId,
        claim.id,
        () => this.driver.load(claim.id),
      );
      if (delivery === undefined) throw ClaimNotLoadedError.create({ id: claim.id });
      deliveries.push(delivery);
    }
    if (deliveries.length === 0) io.output.info("No deliveries");
    else
      io.output.table(
        ["Id", "Subscriber", "Type", "State", "Attempts", "Error"],
        deliveries.map((delivery) => [
          delivery.id,
          delivery.subscriber,
          delivery.type,
          deliveryStateOf(delivery),
          delivery.attempts,
          delivery.lastError === undefined
            ? ""
            : `${delivery.lastError.code}${delivery.lastError.status === undefined ? "" : ` ${delivery.lastError.status}`}`,
        ]),
      );
    return {
      deliveries: deliveries.map((delivery) => ({
        id: delivery.id,
        subscriber: delivery.subscriber,
        type: delivery.type,
        state: deliveryStateOf(delivery),
        attempts: delivery.attempts,
        error: delivery.lastError ?? null,
      })),
    };
  }
}
