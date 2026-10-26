/**
 * Stackra file contract:
 * Purpose: `eventRef`, the base gen writes a consumed integration event class over
 *          (`class OrderPaid extends eventRef("orders.order.paid.v1", { payload }) {}`): the wire name, the payload
 *          schema and the producer's broadcast channel and audience, as statics.
 * Boundary: the class is passed, never a wire name: `useSubscription(OrderPaid, ...)`, a query's `invalidateOn`, a
 *           listener's parameter type. Its instances are typed as the payload. At runtime it is an
 *           `IntegrationEvent({ name, version })` of @stackra/events, so a consumer's inbox rebuilds it with its static
 *           `create` (checked by the payload schema), the outbox registers its wire name, and the bus matches it with
 *           `instanceof`, exactly as a local integration event.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (wire names); ADR 0225 (broadcast); ADR 0260 (decisions 3 and 4).
 */
import { IntegrationEvent } from "@stackra/events";
import type { ZodType } from "zod";

import { defineStatics } from "#core/functions/define-statics.function";
import type { EventRef } from "#core/types/event-ref.type";
import type { EventRefOptions } from "#core/types/event-ref-options.type";

/** `<module>.<name>.v<version>`, dotted snake_case; captures the unversioned name and the version. */
const EVENT_NAME = /^([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+)\.v(\d+)$/;

/**
 * A consumed integration event class.
 *
 * @throws RangeError when `name` is not a versioned event name.
 * @example
 * export class OrderPaid extends eventRef("orders.order.paid.v1", {
 *   payload: z.object({ orderId: publicId("ord"), totalMinor: z.number().int() }),
 * }) {}
 */
export function eventRef<S extends ZodType>(
  name: string,
  options: EventRefOptions<S>,
): EventRef<S> {
  const [, unversioned, version] = EVENT_NAME.exec(name) ?? [];
  if (unversioned === undefined)
    throw new RangeError(`"${name}" is not an event name: <module>.<name>.v<version>`);
  // The written name is the full one minus the version, so the outbox's fallback name is the wire name itself.
  const Base = IntegrationEvent({
    name: unversioned,
    version: Number(version),
  }) as unknown as new () => object;
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: a ref is read by its statics only
  const Ref = class extends Base {};
  const { payload } = options;
  defineStatics(Ref, {
    eventName: name,
    payload,
    channel: options.channel,
    audience: options.audience,
    create(this: { readonly prototype: object }, values: unknown): object {
      return Object.freeze(
        Object.assign(Object.create(this.prototype) as object, payload.parse(values)),
      );
    },
  });
  return Ref as unknown as EventRef<S>;
}
