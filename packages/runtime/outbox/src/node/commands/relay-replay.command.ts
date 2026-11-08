/**
 * Stackra file contract:
 * Purpose: `RelayReplayCommand`, `outbox:relay-replay <dlv_id>`: makes one dead cross-app delivery pending again, due
 *          now with its attempts reset, through `DeliveryDriver.replay`.
 * Boundary: one id, no confirmation. A delivery that is not dead (or not kept) is refused with exit 2. The consumer's
 *           inbox deduplicates by event id, so a replay of a delivery it already handled runs nothing twice.
 * Runtime: node
 * Governing contract: ADR 0511 (decisions 12 and 13, amendment of 2026-11-02); STA-1910 spec FR-014; ADR 0506.
 */
import { Argument, Command, UsageError } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import type { Clock, PublicId } from "@stackra/contracts";
import { Str } from "@stackra/validation";

import type { DeliveryDriver } from "#contracts/index";

/** Replays a dead delivery. */
export class RelayReplayCommand extends Command({
  name: "outbox:relay-replay",
  description: "Send a dead cross-app event delivery again",
}) {
  /** The delivery to replay. */
  @Argument({ description: "The dead delivery's id" })
  @Str({ pattern: /^dlv_\w+$/ })
  id!: string;

  /** The delivery store. */
  private readonly driver: DeliveryDriver;

  /** The time source. */
  private readonly clock: Clock;

  /**
   * @param driver - the delivery port.
   * @param clock - the time the delivery is due from.
   */
  constructor(driver: DeliveryDriver, clock: Clock) {
    super();
    this.driver = driver;
    this.clock = clock;
  }

  /** Replays; returns the id. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    if (!(await this.driver.replay(this.id as PublicId<"dlv">, this.clock.now())))
      throw new UsageError(`${this.id} is not a dead delivery`);
    io.output.success(`Queued ${this.id} again`);
    return { replayed: this.id };
  }
}
