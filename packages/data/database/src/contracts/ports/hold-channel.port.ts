/**
 * Stackra file contract:
 * Purpose: the `HoldChannel` port: one call to the service that keeps the legal holds (compliance-privacy's
 *          `holds.hold.check@1`), which `ServiceHoldRegistryDriver` asks so every other service's disposals consult
 *          the same holds.
 * Boundary: an abstract class that is its own token. A service binds it to a driver over its generated client, so this
 *           package imports no service's generated code. One call per disposal, in the calling scope's session; an
 *           unreachable holds service throws, and the disposal then fails rather than proceeds (fail closed).
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment); ADR 0263 (ports and drivers); ADR 0260 (generated clients);
 *                     STA-1241 (replaces the OS stopgap in compliance-privacy's `./drivers`).
 */
import { Port } from "@stackra/contracts";

import type { Disposal } from "#contracts/enums/disposal.enum";
import type { HoldLinks } from "#contracts/types/hold-links.type";

/**
 * Asks the holds service which records are held.
 *
 * @example
 * export class ClientHoldChannelDriver extends Driver(HoldChannel) {
 *   async check(model: string, ids: readonly string[], disposal: Disposal, links?: HoldLinks) {
 *     return (await this.compliance.hold.check({ model, recordIds: [...ids], disposal, links })).held;
 *   }
 * }
 */
export abstract class HoldChannel extends Port {
  /**
   * The held ids among `ids`; the holds service logs each refused disposal.
   *
   * @param model - the model's name.
   * @param ids - the primary keys of the rows that would be disposed of.
   * @param disposal - how they would be disposed of.
   * @param links - each row's subject links, when the model declares any.
   * @throws Error when the holds service cannot be reached.
   */
  abstract check(
    model: string,
    ids: readonly string[],
    disposal: Disposal,
    links?: HoldLinks,
  ): Promise<readonly string[]>;
}
