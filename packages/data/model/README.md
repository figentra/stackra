# @stackra/model

The model kind of the programming model v3.1: `Model.with(...traits)`, the seven model traits, relations (`Ref<T>`
and `Collection<T>` inside a module, `Link<T>` across modules), the `@Index`, `@Searchable` and `@Visibility` facets,
and the ORM column types and `Money` embeddable that gen's generated entity metadata imports.

**Tier:** `tier:lib` (`packages/data/model`), entry `.` only (the old `./traits` and `./orm` entries are folded in).
Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/events`, `@stackra/money` and
`@mikro-orm/core`. Server only: an app or a client never imports a model (ADR 0227: no ORM on a client).

## Entry points

| Import           | Holds                     | Exports                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/model` | `src/core/`: node runtime | `Model`, traits (`HasPublicId`, `Timestamps`, `UserStamps`, `Versioned`, `SoftDeletes`, `AppendOnly`, `Translatable`), `createTrait`, `traitsOf`, `Index`, `Searchable`, `Visibility`, `ManyToOne`, `OneToMany`, `ManyToMany`, `OnDelete`, `Collection`, `Ref`, `Link`, `Translated`, `Attributes`, `LinkType`, `TranslatedType`, `MoneySchema` |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339),
`src/core/index.ts` is a stand-in barrel.

## A model

```ts
import { Collection, HasPublicId, Index, Model, OneToMany, Timestamps } from "@stackra/model";
import type { Money } from "@stackra/money";
import { BelongsToTenant } from "@stackra/tenancy/node";

@Index(["status", "createdAt"])
export class Order extends Model.with(HasPublicId("ord"), BelongsToTenant, Timestamps) {
  status: OrderStatus = OrderStatus.PendingPayment;

  total!: Money; // columns total_minor (bigint) and total_currency (char(3))

  @OneToMany(() => OrderLine, (line) => line.order, { orphanRemoval: true })
  lines = new Collection<OrderLine>(this);
}

order.record(OrderPlaced.create({ orderId: order.id })); // kept beside the instance until commit
```

- The field type is the column and wire type, the initializer the default, `| null` nullable (ADR 0294 decision 4).
- No constructor-made state: the ORM loads a row without running the constructor. Build models with `em.create`,
  factories or `CrudService`, never `new` (decision 27). A model that narrows a trait field writes `declare`.
- `record(event)` stores the event in @stackra/events beside the instance; the unit of work takes it at commit.

## Traits

| Trait                  | Adds                                              | Notes                                                        |
| ---------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| `HasPublicId(prefix)`  | `id: PublicId<prefix>`, minted on create (UUIDv7) | Prefix 2 to 6 lowercase letters (ADR 0135)                   |
| `Timestamps`           | `createdAt`, `updatedAt`                          | `updatedAt` moves on every changing flush                    |
| `UserStamps`           | `createdBy`, `updatedBy` (principal public ids)   | Filled from the actor, never from input                      |
| `Versioned`            | `version` (starts at 1)                           | Optimistic concurrency; a stale write is a `conflict`        |
| `SoftDeletes`          | `deletedAt`                                       | Delete policy `soft`                                         |
| `AppendOnly`           | nothing                                           | Marker read by `traitsOf`; updates are refused               |
| `Translatable(fields)` | nothing                                           | Names the model's `Translated` fields (jsonb, `.in(locale)`) |

Ownership by a tenant is not a model trait: `BelongsToTenant` is `@stackra/tenancy/node`'s (ADR 0321, ADR 0323
decision 3), built with `createTrait`, as in the example above. `createTrait(name, apply, options)` makes a trait for
another package, and `traitsOf(Model)` lists a model's traits with their options. `Model.with` refuses a trait applied
twice.

## Relations

| Field type      | Decorator                                       | Stored as                                         |
| --------------- | ----------------------------------------------- | ------------------------------------------------- |
| `Ref<T>`        | `@ManyToOne(() => T, { onDelete })`             | a foreign key `fk_<table>_<column>`, indexed      |
| `Link<T>`       | `@ManyToOne(() => T)` (T in another module)     | an indexed `<name>_id` column (`LinkType`), no FK |
| `Collection<T>` | `@OneToMany(() => T, (t) => t.parent, options)` | the children's foreign key                        |
| `Collection<T>` | `@ManyToMany(() => T, { pivotTable })`          | a pivot table in the module's schema              |

`link.id` needs no load; `link.load()` runs the owning module's generated read through the resolver the generated
wiring installs with `Link.useResolver`. Decorators record metadata only (`ManyToOne.members(Model)` reads it back),
and tsc refuses a relation decorator on a field of the wrong type.

## Facets

`@Index(properties, { unique, where })` declares one index (several per model, `Index.on(Model)` in source order);
`@Searchable({ text, filters })` declares the hybrid search index (`Searchable.on(Model)`). Gen names the indexes
(`idx_<table>_<columns>`) and checks every path.

`@Visibility({ attributes, follows })` declares that the model's records are visible by rule (ADR 0333):
`attributes` are the fields a visibility rule may test (`record.<attribute>`; index each one, since every read carries
the predicate), and `follows` names many-to-one relations whose record must be visible too (a document under a
matter). The facet only declares: `@stackra/iam`'s decision point evaluates the rules and its `./node` driver of
`@stackra/database`'s `VisibilityFilter` pushes them into reads, on top of row-level security (`Visibility.on(Model)`).

```ts
@Visibility({ attributes: ["collection", "status"] })
@Index(["collection"])
export class Product extends Model.with(HasPublicId("prd"), BelongsToTenant) {}
```

## Factories

`Attributes<M>` is what a factory's `definition` returns: any subset of the data fields, where a `Ref<T>` also takes a
`RelationSource<T>` (a factory declaring the `~builds` brand), a `Link<T>` the target's public id, and a `Translated`
field its plain locale map.

## Generated entity metadata

Gen writes MikroORM `EntitySchema` metadata per module into `.stackra/gen/entities/<module>.ts` and imports
`LinkType`, `TranslatedType` and `MoneySchema` from here. `MoneySchema`'s amount column refuses a value beyond
`Number.MAX_SAFE_INTEGER`.

## Tests

`pnpm turbo run test --filter=@stackra/model`. Tests sit in `__tests__/` beside each subject (ADR 0022) and import the
runner from `@stackra/testing` (ADR 0269).
