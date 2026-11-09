/**
 * Stackra file contract:
 * Purpose: `RelayReplayCommand`, `outbox:relay-replay <dlv_id>`: makes one dead cross-app delivery pending again, due
 *          now with its attempts reset, through `DeliveryDriver.replay`.
 * Boundary: one id, no confirmation. A platform operator's command over every tenant's deliveries: `DeliveryDriver.list`
 *           claims the id's tenant through a system function, and the replay runs in that tenant's isolation
 *           (`inRowOwner`, the bound `CallIsolation`, read optionally from the injected `Container`). A delivery that is not dead (or not kept) is refused with exit 2.
 *           The consumer's inbox deduplicates by event id, so a replay of a delivery it already handled runs nothing
 *           twice.
 * Runtime: node
 * Governing contract: ADR 0511 (decisions 12 and 13, amendment of 2026-11-02); STA-1910 spec FR-014; ADR 0506; ADR
 *                     0239 (2026-11-07 amendment, gap A).
 */
import { Argument, Command, UsageError } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import type { Container } from "@stackra/container";
import type { Clock, PublicId } from "@stackra/contracts";
import { Str } from "@stackra/validation";

import { DeliveryState } from "#contracts/index";
import type { DeliveryDriver } from "#contracts/index";
import { ClaimNotLoadedError } from "#core/errors/claim-not-loaded.error";
import { boundIsolation } from "#core/functions/bound-isolation.function";
import { inRowOwner } from "#core/functions/in-row-owner.function";

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

  /** The container the bound `CallIsolation`, if any, is read from at run time. */
  private readonly container: Container;

  /**
   * @param driver - the delivery port.
   * @param clock - the time the delivery is due from.
   * @param container - the container whose `CallIsolation` the replay runs in, when one is bound.
   */
  constructor(driver: DeliveryDriver, clock: Clock, container: Container) {
    super();
    this.driver = driver;
    this.clock = clock;
    this.container = container;
  }

  /**
   * Replays; returns the id.
   *
   * @throws UsageError when the id names no dead delivery.
   * @throws ClaimNotLoadedError when the claimed dead delivery does not replay in its tenant.
   */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const id = this.id as PublicId<"dlv">;
    const [claim] = await this.driver.list({ id, state: DeliveryState.Dead, limit: 1 });
    if (claim === undefined) throw new UsageError(`${this.id} is not a dead delivery`);
    if (
      !(await inRowOwner(boundIsolation(this.container), claim.ownerId, id, () =>
        this.driver.replay(id, this.clock.now()),
      ))
    )
      throw ClaimNotLoadedError.create({ id });
    io.output.success(`Queued ${this.id} again`);
    return { replayed: this.id };
  }
}
