/**
 * Stackra file contract:
 * Purpose: `IntegrationEvent({ name, version, webhook, broadcast, crossRegion })`, the kind base of a fact other
 *          services need: it leaves through the outbox under the wire name `<module>.<name>.v<version>`, is visible to
 *          MCP, may be offered as an outbound webhook, may broadcast a data-free refresh and may be copied to the
 *          other regions.
 * Boundary: called only: an integration event needs its name, so a bare `extends IntegrationEvent` fails to compile.
 *           The options are checked and recorded in the kind registry with their defaults applied; the module key is
 *           derived by gen from the folder, never written. Only integration events may broadcast or be webhooks.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 2 and 19); ADR 0141 (2026-10-23 note); ADR 0294 (decisions 16 and 20;
 *                     amendment item 7); ADR 0078 (decisions 3 and 4); ADR 0353 (decision 5);
 *                     STA-1268 (`crossRegion`).
 */
import { createKind } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { Event } from "#core/bases/event.base";
import { EVENT_NAME_PATTERN } from "#core/constants/event-name-pattern.constant";
import { BroadcastAudience } from "#core/enums/broadcast-audience.enum";
import type { EventClass } from "#core/types/event-class.type";
import type { IntegrationEventOptions } from "#core/types/integration-event-options.type";

/** The runtime base. Not exported: authors extend `IntegrationEvent({ ... })`. */
abstract class IntegrationEventBase extends Event {
  /** Type-only kind brand. */
  declare protected readonly "~kind": "integration_event";
}

/** Checks the options and applies their defaults. */
function read(options: IntegrationEventOptions) {
  if (typeof options?.name !== "string" || !EVENT_NAME_PATTERN.test(options.name))
    throw new TypeError(
      `IntegrationEvent({ name }) needs a dotted snake_case name such as "order.paid", got ${JSON.stringify(options?.name)}`,
    );
  const version = options.version ?? 1;
  if (!Number.isInteger(version) || version < 1)
    throw new RangeError(
      `IntegrationEvent({ version }) must be a whole number from 1, got ${version}`,
    );
  if (options.crossRegion !== undefined && typeof options.crossRegion !== "boolean")
    throw new TypeError(
      `IntegrationEvent({ crossRegion }) must be a boolean, got ${JSON.stringify(options.crossRegion)}`,
    );
  const { broadcast } = options;
  if (
    broadcast?.audience !== undefined &&
    !Enum.values(BroadcastAudience).includes(broadcast.audience)
  )
    throw new RangeError(
      `IntegrationEvent({ broadcast: { audience } }) must be a BroadcastAudience, got ${JSON.stringify(broadcast.audience)}`,
    );
  return {
    ...options,
    version,
    webhook: options.webhook ?? false,
    ...(broadcast === undefined
      ? {}
      : { broadcast: Object.freeze({ audience: BroadcastAudience.Principal, ...broadcast }) }),
  };
}

/**
 * The integration event kind base.
 *
 * @example
 * export class OrderPaid extends IntegrationEvent({
 *   name: "order.paid",
 *   webhook: true,
 *   broadcast: { permission: OrderPermissions.read, audience: BroadcastAudience.Tenant },
 * }) {
 *   orderId!: PublicId<"ord">;
 * }
 */
export const IntegrationEvent = createKind("integration_event", IntegrationEventBase, read) as (
  options: IntegrationEventOptions,
) => EventClass;
