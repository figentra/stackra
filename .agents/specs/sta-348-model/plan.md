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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                            |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/data/model`; workspace imports: `@stackra/container`, `@stackra/contracts`, `@stackra/events`, `@stackra/money`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                                                             |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                                                           |
| HTTP and events                       | PASS   | model events are recorded through `recordEvent` from `@stackra/events`; no endpoint                                                                                                                             |
| Tenancy                               | N/A    | no table or query here; `BelongsToTenant` adds the `tenantId` field only, the unit of work fills it and the migration enables row-level security                                                                |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                                          |
| Not built yet (ADR 0227)              | PASS   | MikroORM through `@mikro-orm/core` only; no Prisma, Drizzle, TypeORM or Knex, and no ORM on a client                                                                                                            |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                                       |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; the `@mikro-orm/core` pin is added by the owner (T012)                                                                                                                       |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                                 |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                              |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                                         |

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

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` names `@stackra/model` at `packages/data/model` and `exports` lists only `.` — Validates: FR-001
- **P-002**: `.` exports every symbol the template imports (`AppendOnly`, `Attributes`, `BelongsToTenant`, `Collection`, `HasPublicId`, `Index`, `Link`, `LinkType`, `ManyToMany`, `ManyToOne`, `Model`, `MoneySchema`, `OnDelete`, `OneToMany`, `Ref`, `Searchable`, `SoftDeletes`, `Timestamps`, `Translatable`, `Translated`, `UserStamps`, `Versioned`) — Validates: FR-002
- **P-003**: `Model` is registered as the `model` kind and its constructor makes no state, and `record(event)` calls `recordEvent` from `@stackra/events` — Validates: FR-003
- **P-004**: every trait is made with `createTrait`, and `traitsOf(SomeModel)` lists the traits that model class carries — Validates: FR-004
- **P-005**: a decorator made with `createDecorator` marks model kinds only and records metadata without changing behaviour — Validates: FR-005
- **P-006**: `Translated` reads a locale by the fallback chain exact tag, then language, then the first stored value, and `TranslatedType` maps it to jsonb — Validates: FR-006
- **P-007**: `MoneySchema` maps a `Money` to `<prefix>minor bigint` and `<prefix>currency char(3)`, and refuses an unsafe integer — Validates: FR-007
