/**
 * Stackra file contract:
 * Purpose: the `HoldRegistry` port: the legal holds every delete, purge and retention path consults before it disposes
 *          of a record. The database asks which of a set of records are held; a held record is never disposed of.
 * Boundary: an abstract class that is its own token. The data layer asks, the implementer decides: the compliance
 *           service's driver keeps the holds, follows a hold across links to records other services own, keeps a hold
 *           inside its tenant (a copy shared to another tenant is not held by it), and logs every refused attempt it is
 *           told of. Nothing here decides who may place or lift a hold. With no registry connected, nothing is held.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: a `HoldRegistry` port, never a Guard); ADR 0189 (decision 4);
 *                     ADR 0343 (decisions 2, 5 and 7); ADR 0294 (decisions 16 and 23); STA-1241 (subject links, the
 *                     service-backed driver `ServiceHoldRegistryDriver` over `HoldChannel`).
 */
import type { AnyClass } from "@stackra/container";
import { Port } from "@stackra/contracts";

import type { Disposal } from "#contracts/enums/disposal.enum";
import type { HoldLinks } from "#contracts/types/hold-links.type";

/**
 * The legal holds of the running tenant.
 *
 * @example
 * export class ComplianceHoldRegistryDriver extends Driver(HoldRegistry) {
 *   async heldAmong<M extends object>(model: AnyClass<M>, ids: readonly string[], disposal: Disposal) {
 *     const held = await this.holds.heldIds(model, ids);
 *     if (held.size > 0) await this.log.refused(model, [...held], disposal);
 *     return held;
 *   }
 * }
 */
export abstract class HoldRegistry extends Port {
  /**
   * The ids among `ids` whose record is under a legal hold, directly or through a linked record; the attempt to
   * dispose of each one is logged by the implementer.
   *
   * @param model - the model whose rows would be disposed of.
   * @param ids - the primary keys of those rows.
   * @param disposal - how they would be disposed of, for the log.
   * @param links - each row's subject links (`registerHoldLinks`), so a hold on the linked subject reaches the row;
   *                absent when the model declares none.
   */
  abstract heldAmong<M extends object>(
    model: AnyClass<M>,
    ids: readonly string[],
    disposal: Disposal,
    links?: HoldLinks,
  ): Promise<ReadonlySet<string>>;
}
