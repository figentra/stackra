# Feature Specification: `@stackra/model` wave 3, the Model kind, traits, relations and table facets

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing (data gate: merges only after the owner's model review)

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/model` (data, wave 3) for real: `Model.with(...traits)`, the eight traits the template
uses, relations (`Ref<T>`, `Collection<T>`, `Link<T>` across modules), the `@Index` and `@Searchable` facets, and the
ORM pieces (`LinkType`, `MoneySchema`) gen's entity metadata imports.

## Impact

- **Apps touched**: none (models are server only; ADR 0227 rejects an ORM on a client)
- **Services touched**: none here (the template's commerce and notifications services import from `.` already)
- **Packages touched**: `packages/data/model` (new member)
- **Cross-service events**: none (`record(event)` hands events to @stackra/events)
- **Tenancy and data**: no tables of its own. `BelongsToTenant` declares the `tenantId` column; @stackra/tenancy fills
  it and the migration enables row-level security (ADR 0239)
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: `@mikro-orm/core` 7.2.5 (not yet catalogued; referenced as `catalog:`; the owner adds the
  catalog entry); `@stackra/{container,contracts,events,money,validation}` through `workspace:*`
- **Deploy modes**: same in all; no outbound call
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/data/model/README.md`, `packages/data/model/AGENTS.md`; ADR 0096, 0120, 0133, 0135, 0162, 0221, 0227, 0239, 0294 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R3 (the persisted shape of every model; the data gate applies)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 row: entry `.` only, `./traits` and `./orm` folded in per owner
  Q4; depends on validation, money, events; ADR 0294 decisions 4, 6, 11, 16, 25, 27 and 28; ADR 0096, 0133, 0135,
  0162, 0221, 0239

## User Scenarios & Testing

### User Story 1 - Declare a model with traits (Priority: P1)

`class Order extends Model.with(HasPublicId("ord"), BelongsToTenant, Timestamps, UserStamps, Versioned)` gives an
`id` minted on create, `tenantId`, timestamps, user stamps and an optimistic version, typed on the class.

**Independent Test**: `src/core/bases/__tests__/model.base.test.ts`, `src/core/traits/__tests__/*.trait.test.ts`.

1. **Given** a created row, **Then** `id` matches `^ord_[0-9a-hjkmnp-tv-z]{26}$` and two rows differ.
2. **Given** a loaded row (no constructor run), **Then** its stored values stay.
3. **Given** `Model.with(HasPublicId("ord"), HasPublicId("ord"))`, **Then** a TypeError.
4. **Given** `HasPublicId("ORD")`, **Then** a TypeError.

### User Story 2 - Relations inside and across modules (Priority: P1)

`@ManyToOne(() => Order, { onDelete: OnDelete.Cascade }) order!: Ref<Order>`,
`@ManyToOne(() => Variant) variant!: Link<Variant>`, `@OneToMany(...)` and `@ManyToMany(...)` with
`new Collection<T>(this)`.

**Independent Test**: `src/core/decorators/__tests__/*.decorator.test.ts`, `src/core/values/__tests__/link.value.test.ts`.

1. **Given** a relation decorator, **Then** `X.members(Model)` gives its target thunk and options.
2. **Given** `@ManyToOne` on a `number` field, **Then** tsc refuses it.
3. **Given** a link, **Then** `link.id` needs no load and `link.load()` runs the installed resolver once.

### User Story 3 - Table facets (Priority: P1)

`@Index([...], { unique, where })` several times and `@Searchable({ text, filters })`.

1. **Given** three `@Index`, **Then** `Index.on(Model)` lists them in source order.
2. **Given** a facet on a class that is not a model, **Then** a TypeError at class definition.

### User Story 4 - Gen's entity metadata (Priority: P2)

Gen writes `{ type: new LinkType("catalogue.variant") }` and `{ kind: "embedded", entity: () => MoneySchema }`.

1. **Given** a stored id, **Then** `LinkType` loads it as a `Link` of its model.
2. **Given** a stored `bigint` beyond `Number.MAX_SAFE_INTEGER`, **Then** `MoneySchema`'s amount column refuses it.

### User Story 5 - Factories (Priority: P2)

`definition(faker): Attributes<OrderLine>` returns `{ order: OrderFactory.new(), variant: faker.publicId("var") }`.

1. **Given** a factory declaring the `~builds` brand, **Then** it fits a `Ref` position; a public id fits a `Link`.

## Requirements

- **FR-001**: Package `@stackra/model` at `packages/data/model`, entry `.` only, member files per ADR 0294 R12.
- **FR-002**: Every symbol the template imports from `@stackra/model`: `AppendOnly`, `Attributes` (t),
  `BelongsToTenant`, `Collection`, `HasPublicId`, `Index`, `Link` (t), `LinkType`, `ManyToMany`, `ManyToOne`, `Model`,
  `MoneySchema`, `OnDelete`, `OneToMany`, `Ref` (t), `Searchable`, `SoftDeletes`, `Timestamps`, `Translatable`,
  `Translated` (t), `UserStamps`, `Versioned`.
- **FR-003**: `Model` is a bare kind base registered as `model`; no constructor-made state; `record(event)` uses
  `recordEvent` from @stackra/events.
- **FR-004**: Traits are made with `createTrait` (ADR 0096 d1) and listed by `traitsOf` (the trait registry).
- **FR-005**: Decorators are made with `createDecorator`, mark the model kinds only, and record metadata only.
- **FR-006**: `Translated` holds one string per locale with the fallback chain exact tag, language, first stored
  (ADR 0162 d2); `TranslatedType` maps it to jsonb.
- **FR-007**: `MoneySchema` maps `Money` to `<prefix>minor bigint` and `<prefix>currency char(3)`, refusing an unsafe
  integer (ADR 0294 d27).

## Success Criteria

- **SC-001**: The template's model files, factories and `.stackra/gen/entities/orders.ts` resolve every import from
  `@stackra/model` with the shape they use (`src/core/__tests__/index.test.ts` copies their declarations).
- **SC-002**: Every public symbol has a test beside it; lint and format pass.
- **SC-003**: Typecheck, tests and build pass in the separate testing workflow, after `pnpm install` links the member
  and the catalog holds `@mikro-orm/core`.

## Out of scope (named, not built)

- `@Auditable` (registry purpose line only; ADR 0096 marks its owner as uncertain and no consumer imports it),
  `@OneToOne` (ADR 0294 R6 names it; no consumer).
- The R-36/R-40/R-41 traits (`HasMetadata`, `Taggable`, `HasOwner`, `HasTree`, `Effective`, `HasLocation`, and the
  ADR trait list's `Archivable`, `HasRevisions`, `Sluggable`, ...): later, each in its owning package with
  `createTrait`.
- `EntitySchema`, `OptionalProps`, `CrudService`, `Factory`: @stackra/database.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
