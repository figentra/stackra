/**
 * Stackra file contract:
 * Purpose: `RelayDeliveriesCommand`, `outbox:relay-deliveries`: a table of the producer's cross-app deliveries, oldest
 *          first, with each one's subscriber, event type, state, attempts and last error code.
 * Boundary: read only, through `DeliveryDriver.list`. `--subscriber` and `--state` (`pending`, `failing`, `dead`)
 *           narrow it and `--limit` caps the rows (50 by default). It prints no envelope.
 * Runtime: node
 * Governing contract: ADR 0511 (decision 12, amendment of 2026-11-02); STA-1910 spec FR-014; ADR 0506.
 */
import { Command, Option } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import { Int, Str } from "@stackra/validation";

import type { DeliveryDriver, DeliveryState } from "#contracts/index";
import { deliveryStateOf } from "#core/functions/delivery-state-of.function";

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

  /**
   * @param driver - the delivery port.
   */
  constructor(driver: DeliveryDriver) {
    super();
    this.driver = driver;
  }

  /** Prints the table; returns the deliveries. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const deliveries = await this.driver.list({
      ...(this.subscriber === undefined ? {} : { subscriber: this.subscriber }),
      ...(this.state === undefined ? {} : { state: this.state as DeliveryState }),
      limit: this.limit,
    });
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
