/**
 * Stackra file contract:
 * Purpose: `Factory<M>`, the kind base of a model factory in `database/factories/`: `definition(faker)` gives one row's
 *          attributes, a named state is a method over `state(...)`, and Laravel's chain builds rows: `new`, `count`,
 *          `state`, `sequence`, `for`, `has`, `make` (unsaved) and `create` (saved in the running context).
 * Boundary: exported from `./testing` only, so a server never loads Faker. The model comes from the type argument,
 *           which gen registers. Every chain call returns a new factory, so a shared one (`const line = ...state(...)`)
 *           never changes. `create` persists through the connected database and flushes once; `make` uses the ORM
 *           when one is connected (so links and translated maps become values) and plain construction otherwise.
 * Runtime: node
 * Governing contract: ADR 0190 as amended by ADR 0294 (factories with states); ADR 0269 (helper placement);
 *                     ADR 0305 (rule 5: partner by type argument); ADR 0294 (decision 27: no `new` on wired models).
 */
import { ReferenceKind } from "@mikro-orm/core";
import type { RequiredEntityData } from "@mikro-orm/core";
import type { EntityManager } from "@mikro-orm/postgresql";
import { registerKind } from "@stackra/container";
import type { Attributes, RelationSource } from "@stackra/model";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { modelOf } from "#core/functions/model-of.function";
import { Database } from "#core/ports/database.port";
import { FAKER } from "#testing/constants/faker.constant";
import type { Counted } from "#testing/types/counted.type";
import type { Faker } from "#testing/types/faker.type";

/** A state: attributes, or a function of Faker that returns them. */
type State<M> = Attributes<M> | ((faker: Faker) => Attributes<M>);

/** What a chain call may change. */
interface FactoryState<M> {
  readonly amount: number | undefined;
  readonly states: readonly State<M>[];
  readonly cycle: readonly Attributes<M>[];
  readonly parents: readonly object[];
  readonly children: readonly Factory<object>[];
}

/**
 * The base of every factory.
 *
 * @example
 * export class OrderFactory extends Factory<Order> {
 *   definition(faker: Faker): Attributes<Order> {
 *     const subtotal = Money.ofMinor(faker.number.int({ min: 500, max: 50_000 }), "USD");
 *     return { customerId: faker.publicId("usr"), subtotal, total: subtotal };
 *   }
 *
 *   paid(): this {
 *     return this.state((faker) => ({ status: OrderStatus.Paid, paidAt: faker.date.recent() }));
 *   }
 * }
 *
 * const order = await OrderFactory.new().paid().has(OrderLineFactory.new().count(2)).create();
 */
export abstract class Factory<M extends object> implements RelationSource<M> {
  /** Type-only: the model this factory builds, so it fits a relation position of `Attributes`. */
  declare readonly "~builds"?: M;

  /** How many rows; undefined for one. */
  private amount: number | undefined = undefined;

  /** The states applied in order over the definition. */
  private states: readonly State<M>[] = [];

  /** The attributes the rows take in turn. */
  private cycle: readonly Attributes<M>[] = [];

  /** The rows each built row belongs to. */
  private parents: readonly object[] = [];

  /** The factories of the rows each built row has. */
  private children: readonly Factory<object>[] = [];

  /** The attributes of one row, before states and overrides. */
  abstract definition(faker: Faker): Attributes<M>;

  /** A fresh factory of this class. */
  static new<F>(this: new () => F): F {
    return new this();
  }

  /**
   * Builds `amount` rows instead of one; call it last in a chain.
   *
   * @throws RangeError when `amount` is not a whole number from 1.
   */
  count(amount: number): Counted<this, M> {
    if (!Number.isInteger(amount) || amount < 1)
      throw new RangeError(`count takes a whole number from 1, got ${amount}`);
    return this.with({ amount }) as unknown as Counted<this, M>;
  }

  /** Applies `state` over the definition (and over the states before it). */
  state(state: State<M>): this {
    return this.with({ states: [...this.states, state] });
  }

  /**
   * Gives the rows these attributes in turn: the first row the first, and so on, starting over.
   *
   * @throws TypeError when no attributes are given.
   */
  sequence(...states: readonly Attributes<M>[]): this {
    if (states.length === 0) throw new TypeError("sequence needs at least one state");
    return this.with({ cycle: states });
  }

  /** Makes every row belong to `parent`: the field that points to the parent's model is set to it. */
  for(parent: object): this {
    return this.with({ parents: [...this.parents, parent] });
  }

  /**
   * Gives every row the rows `child` builds, each pointing back to it.
   *
   * @throws TypeError when `child` is not a factory.
   */
  has(child: RelationSource<object>): this {
    if (!(child instanceof Factory)) throw new TypeError("has takes a factory");
    return this.with({ children: [...this.children, child as Factory<object>] });
  }

  /** One unsaved row (or `count` rows), with `overrides` over everything else. */
  make(overrides?: Attributes<M>): M {
    const em = ACTIVE_DATABASE.current?.em();
    return this.pick(this.build(em, false, overrides));
  }

  /**
   * One saved row (or `count` rows) in the running transaction, flushed before it resolves.
   *
   * @throws Error when no database is connected.
   */
  async create(overrides?: Attributes<M>): Promise<M> {
    const em = Database.current().em();
    const rows = this.build(em, true, overrides);
    await em.flush();
    return this.pick(rows);
  }

  /** A copy of this factory with `changes`. */
  private with(changes: Partial<FactoryState<M>>): this {
    return Object.assign(
      Object.create(Object.getPrototypeOf(this) as object) as this,
      this,
      changes,
    );
  }

  /** The one row, or every row after `count`. */
  private pick(rows: M[]): M {
    // reason: `count` retypes make/create as M[] through `Counted`; the runtime value follows the same rule
    return (this.amount === undefined ? rows[0] : rows) as unknown as M;
  }

  /** Builds the rows, their parents' links, nested factories and children. */
  private build(
    em: EntityManager | undefined,
    persist: boolean,
    overrides: Attributes<M> | undefined,
    link?: { readonly key: string; readonly row: object },
  ): M[] {
    const model = modelOf<M>(this.constructor);
    const rows: M[] = [];
    for (let index = 0; index < (this.amount ?? 1); index++) {
      const attributes: Record<string, unknown> = { ...this.definition(FAKER) };
      for (const state of this.states)
        Object.assign(attributes, typeof state === "function" ? state(FAKER) : state);
      if (this.cycle.length > 0) Object.assign(attributes, this.cycle[index % this.cycle.length]);
      for (const parent of this.parents)
        attributes[this.keyFor(attributes, parent.constructor, em)] = parent;
      if (link !== undefined) attributes[link.key] = link.row;
      Object.assign(attributes, overrides);
      for (const [key, value] of Object.entries(attributes))
        if (value instanceof Factory) attributes[key] = value.build(em, persist, undefined)[0];
      const row =
        em === undefined
          ? Object.assign(Reflect.construct(model, []) as M, attributes)
          : em.create(model, attributes as RequiredEntityData<M, never, true>, {
              persist,
              convertCustomTypes: true,
            });
      for (const child of this.children)
        child.build(em, persist, undefined, {
          key: child.keyFor(child.definition(FAKER) as Record<string, unknown>, model, em),
          row,
        });
      rows.push(row);
    }
    return rows;
  }

  /**
   * The field of this factory's model that points to `parent`: the one whose definition is a factory of it, else the
   * many-to-one or one-to-one the ORM metadata names.
   *
   * @throws TypeError when no field points to `parent`.
   */
  private keyFor(
    attributes: Readonly<Record<string, unknown>>,
    parent: object,
    em: EntityManager | undefined,
  ): string {
    for (const [key, value] of Object.entries(attributes))
      if (value instanceof Factory && modelOf(value.constructor) === parent) return key;
    if (em !== undefined) {
      const property = Object.values(em.getMetadata(modelOf(this.constructor)).properties).find(
        (candidate) =>
          (candidate.kind === ReferenceKind.MANY_TO_ONE ||
            candidate.kind === ReferenceKind.ONE_TO_ONE) &&
          candidate.targetMeta?.class === parent,
      );
      if (property !== undefined) return property.name;
    }
    const name = (parent as { readonly name?: string }).name ?? "its parent";
    throw new TypeError(`${this.constructor.name} has no field that points to ${name}`);
  }
}

registerKind(Factory, "factory");
