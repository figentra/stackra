# Plan: `@stackra/model` wave 3

**Spec**: `.agents/specs/sta-348-model/spec.md`

## Design

- `Model` (`src/core/bases/model.base.ts`) is an abstract class registered as `model`. `Model.with(...traits)` reduces
  the traits over the base, each returning `class extends base { fields }`, refusing a repeated trait name; the type is
  `ModelClass<Model & TraitFields<T>>`. `record(event)` calls `recordEvent` (events kept in a WeakMap there).
- `createTrait(name, apply, options)` checks a snake_case name and that `apply` returns a direct subclass, then
  records `{ name, options }` in `TRAIT_RECORDS` keyed by that class; `traitsOf` walks the constructor chain.
- Traits: `HasPublicId(prefix)` (initializer `mintPublicId`, UUIDv7 in lowercase Crockford base32, from `Date.now()`
  and `crypto.getRandomValues` so `freezeClock`/`freezeIds` make it deterministic), `BelongsToTenant` (`tenantId!`),
  `Timestamps`, `UserStamps`, `Versioned` (`version = 1`), `SoftDeletes`, `AppendOnly` (marker), `Translatable(fields)`
  (marker with options). Exported trait constants carry an explicit `Trait<...>` type so declaration emit never names
  an anonymous class with Model's protected brand.
- Decorators: `@ManyToOne`, `@OneToMany`, `@ManyToMany` (field) and `@Index`, `@Searchable` (class facets), all from
  `createDecorator` with kinds `["model", "projection"]`. `@Index` accumulates a list per class (decorators apply
  bottom-up, so it prepends). Readers: `X.members(Model)`, `Index.on`, `Searchable.on`. Relation decorators return
  `FieldDecorator<...>` from @stackra/validation so tsc checks the field type.
- `Collection` and `Ref` are MikroORM's own, re-exported, as the entity-schema spike proved. `Link<T>` is a value with
  the ORM's custom-type brands and no `unwrap()`; `Link.useResolver` installs the generated read.
- ORM (`src/core/orm/`): `LinkType` (`varchar(33)`: a 6-letter prefix, `_`, 26 characters), `TranslatedType` (jsonb),
  internal `MinorUnitsType` (`BigIntType("number")` plus the safe-integer check), `MoneySchema` (embeddable; `Money`'s
  private constructor passed through one cast).
- `Attributes<M>`: optional data fields; relation positions also take the target, a `RelationSource<T>` (the `~builds`
  brand @stackra/database's `Factory` declares) or, for a link, the public id; a `Translated` field its locale map.

## Constitution check

- Boundaries: imports `@stackra/{container,contracts,events,money,validation}` and `@mikro-orm/core` only; never
  @stackra/database, an app, a service or `encore.dev`.
- Versions: catalogs and `workspace:*` only; `@mikro-orm/core` needs its catalog entry (owner file).
- Naming: v3.1; files `<name>.<kind>.ts`; the `orm/` folder names ORM column types `<name>.type.ts` and embeddables
  `<name>.schema.ts` after the template's `LinkType`/`MoneySchema` names.
- Secrets: none.

## Risks

- `.stackra/gen/entities/orders.ts` in the template writes the id column as `varchar(30)`; a 6-letter prefix needs 33.
  Gen should write `varchar(33)` (as `LinkType` does).
- A `Translated` or link value passed to `em.create` as a plain map or raw id stays plain until reload; the database
  layer (or `convertCustomTypes`) wraps it.
- The future `kind-path` check (STA-338) may flag `orm/*.schema.ts` outside `schemas/`; rename then if needed.
