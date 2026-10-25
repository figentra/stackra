/**
 * Stackra file contract:
 * Purpose: `Model`, the kind base of a persisted record: `class Order extends Model.with(HasPublicId("ord"), ...)`.
 *          Its field types are its columns and wire types, its initializers its defaults, its decorators its relations
 *          and table facts; gen compiles it to MikroORM `EntitySchema` metadata. `record(event)` keeps a fact for the
 *          unit of work to dispatch after commit. `Model.global(...)` is the base of a model that is global by design.
 * Boundary: a bare-only kind base, registered as `model`; it takes no options, so its one composition form is the
 *           static `with`. It holds no constructor-made state and no `#private` field: the ORM builds a loaded row
 *           without running the constructor, and recorded events live beside the instance in @stackra/events (ADR 0294
 *           decision 27). Models are built by `em.create`, factories or `CrudService`, never with `new`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 11, 16, 25 and 27); ADR 0096 (traits); ADR 0141 (recorded events reach
 *                     the outbox at flush); ADR 0210 (2026-10-24 amendment: `Model.global`); the STA-335 entity-schema spike.
 */
import { registerKind } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { Event } from "@stackra/events";
import { recordEvent } from "@stackra/events";

import { GLOBAL_MODELS } from "#core/constants/global-models.constant";
import type { ModelClass } from "#core/types/model-class.type";
import type { Trait } from "#core/types/trait.type";
import type { TraitFields } from "#core/types/trait-fields.type";

/**
 * The base of every model.
 *
 * @example
 * export class Order extends Model.with(HasPublicId("ord"), Timestamps) {
 *   status: OrderStatus = OrderStatus.PendingPayment;
 *
 *   @OneToMany(() => OrderLine, (line) => line.order, { orphanRemoval: true })
 *   lines = new Collection<OrderLine>(this);
 * }
 *
 * order.record(OrderPaid.create({ orderId: order.id, paymentId }));
 */
export abstract class Model {
  /** Type-only: never present at runtime. */
  declare protected readonly "~kind": "model";

  /**
   * The model base with `traits` applied in order, each one a subclass of the one before.
   *
   * @param traits - the traits, each at most once.
   * @returns a class to extend; its instances carry every trait's fields.
   * @throws TypeError when two traits share a name (`HasPublicId("ord")` twice).
   */
  static with<const T extends readonly Trait[]>(...traits: T): ModelClass<Model & TraitFields<T>> {
    const seen = new Set<string>();
    for (const trait of traits) {
      if (seen.has(trait.traitName))
        throw new TypeError(`Model.with: the trait "${trait.traitName}" is applied twice`);
      seen.add(trait.traitName);
    }
    // reason: the abstract base is extended, never constructed, by the classes the traits return
    const base = Model as unknown as ModelClass;
    return traits.reduce<ModelClass>((composed, trait) => trait(composed), base) as ModelClass<
      Model & TraitFields<T>
    >;
  }

  /**
   * The model base of a model that is global by design (an official law corpus, a reference table): `traits` applied
   * as `with` applies them, marked global, so gen records it in the manifest and gives its table no `tenant_id` and no
   * tenant policy. Every other model carries `BelongsToTenant`; gen refuses a model that declares neither.
   *
   * @param traits - the traits, each at most once.
   * @returns a class to extend, marked global.
   * @throws TypeError when two traits share a name.
   * @example
   * export class Statute extends Model.global(HasPublicId("stt"), Timestamps) {}
   */
  static global<const T extends readonly Trait[]>(
    ...traits: T
  ): ModelClass<Model & TraitFields<T>> {
    const composed: ModelClass = Model.with(...traits);
    // A fresh subclass, so the mark never lands on `Model` or on a composition another model shares.
    const marked = class extends composed {};
    GLOBAL_MODELS.add(marked);
    return marked as ModelClass<Model & TraitFields<T>>;
  }

  /** Whether `type` extends a `Model.global(...)` base. */
  static isGlobal(type: AnyClass): boolean {
    for (let current: unknown = type; typeof current === "function";) {
      if (GLOBAL_MODELS.has(current)) return true;
      current = Object.getPrototypeOf(current);
    }
    return false;
  }

  /**
   * Records `event` for after commit: the unit of work dispatches a domain event in process and writes an integration
   * event to the outbox. Nothing is stored on the model.
   *
   * @example
   * order.record(OrderPlaced.create({ orderId: order.id, totalMinor, currency }));
   */
  record(event: Event): void {
    recordEvent(this, event);
  }
}

registerKind(Model, "model");
