/**
 * Stackra file contract:
 * Purpose: `Event`, the abstract base the four event bases share: an event is an immutable fact whose fields are its
 *          payload, built with `X.create({...})` through the class's generated schema.
 * Boundary: authors never extend it: the base of an event names its delivery (`DomainEvent`, `IntegrationEvent`,
 *           `WebhookEvent`, `AnalyticsEvent`), and gen refuses `extends Event` with `event_base_abstract`. It assigns
 *           nothing in a constructor and holds no metadata: the id, time and actor travel beside the instance in a
 *           `RecordedEvent` (ADR 0294 decisions 25 and 27). Its `~kind` brand is protected and type-only, so
 *           `Fields<X>` and the generated `X$Check` ignore it.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 19); ADR 0294 (decisions 16, 25, 26 and 27); ADR 0141 (2026-10-23 note: built
 *                     with `create()`).
 */
import type { AnyClass } from "@stackra/container";
import { schemaOf } from "@stackra/validation";
import type { Fields } from "@stackra/validation";

/**
 * The shared event base.
 *
 * @example
 * export class OrderPaid extends IntegrationEvent({ name: "order.paid" }) {
 *   orderId!: PublicId<"ord">;
 * }
 *
 * order.record(OrderPaid.create({ orderId }));
 */
export abstract class Event {
  /** Type-only: never present at runtime; each event base narrows it to its kind code. */
  declare protected readonly "~kind": string;

  /**
   * Builds a frozen event of the calling class from its fields, applying the defaults of its generated schema and
   * checking every rule.
   *
   * @param values - the class's payload fields.
   * @returns a frozen instance of the calling class.
   * @throws TypeError when the calling class has no registered schema (run `stackra gen`, or `registerSchemas` in a
   *         test).
   * @throws ZodError when `values` break the schema.
   */
  static create<E extends Event>(this: AnyClass<E>, values: Fields<E>): E {
    // The constructor does not run, as the ORM builds a loaded row: no initializer resets a parsed value.
    const event = Object.assign(
      Object.create(this.prototype as object) as E,
      schemaOf(this).parse(values),
    );
    Object.freeze(event);
    return event;
  }
}
