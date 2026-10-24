# Feature Specification: `@stackra/validation` wave 1c, shapes, field rules and the schema registry

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: resolved (owner, 2026-10-24: `Enum` lives in `@stackra/contracts` (Q1); `validation/runtime`
folds into `.` (Q4); `money()` and `currencyCode()` ship from `@stackra/money` (Q5); the old `schema` package merges
here)

**Input**: Build `@stackra/validation` (foundation, wave 1c) for real: the `Schema` kind base, `CursorInput`,
`TableInput`, `Page.of`, `PickType`/`OmitType`/`PartialType`, the typed field decorators, `@Renamed`, `@Classified`,
the codecs and `X$Check` helpers that generated schemas import, and `validate(Class, input)` over a registry that
generated schemas fill (gap G1).

## Impact

- **Apps touched**: none (the template's web, mobile and console apps consume it, STA-344)
- **Services touched**: none (the template's commerce and notifications services consume it)
- **Packages touched**: `packages/foundation/validation` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none (shapes only; `TableInput` is a plain shape, applied by `database` later, ADR 0307 r2)
- **Secrets**: none
- **ADR needed**: no (ADR 0294 decisions 4, 6, 16, 25, 26 and amendment items 3 and 13; ADR 0095 as amended; the
  2026-10-24 note on ADR 0127)
- **New dependencies**: none new; `zod` from the default catalog (4.6.7), `@stackra/contracts` and
  `@stackra/container` through `workspace:*`
- **Deploy modes**: same in all; isomorphic
- **Lane**: full (a new package)
- **Change risk**: R2 (every input of every action passes through these shapes)

## User Scenarios & Testing

### User Story 1 - Declare a shape with typed field rules (Priority: P1)

An author writes `class RedeemPointsInput extends Schema { @Int({ min: 1 }) points!: number; }`; the type checker
refuses `@Int` on a string, `@List` on a non-array and a `@Field(zod)` whose output the field cannot hold.

**Independent Test**: `src/core/decorators/__tests__/*.decorator.test.ts`.

**Acceptance Scenarios**:

1. **Given** `@Int` on a `string` field, **When** tsc runs, **Then** it fails (TS1240); likewise `@Str` on a number,
   `@List` on a non-array, `@Trim` on a number and `@Field(z.string())` on a number.
2. **Given** `@Int({ each: true })` on `number[]` or `Record<string, number>`, `@Str({ each: true })` on `string[]`,
   **When** tsc runs, **Then** it passes; `@Field(z.literal(true))` on a `boolean` passes.
3. **Given** any field decorator, **When** the class is defined, **Then** it records its options and installs no
   accessor, so a class field defined on the instance (`useDefineForClassFields`) keeps its value.
4. **Given** a field decorator on a class of no shape kind, **When** the class is defined, **Then** it throws a
   `TypeError` (`createDecorator`).

### User Story 2 - Validate input and build a shape through the registry (Priority: P1)

A route calls `validate(QuickOrderForm, await ctx.formData())`; a handler returns `EnrollMemberOutput.create({...})`.
Both find the class's generated `X$` in the registry that every generated schemas file fills with `registerSchemas`.

**Independent Test**: `src/core/functions/__tests__/validate.function.test.ts`,
`src/core/bases/__tests__/schema.base.test.ts`.

**Acceptance Scenarios**:

1. **Given** a registered class, **When** `validate(X, raw)` runs, **Then** it returns `{ success: true, data }` with
   defaults applied, or `{ success: false, error }` whose `error.issues` carry the schema's messages.
2. **Given** a class with no registered schema, **When** `validate` or `X.create` runs, **Then** it throws a
   `TypeError` that names the class and says to load the generated schemas.
3. **Given** valid values, **When** `X.create(values)` runs, **Then** it returns an instance of `X`; invalid values
   throw the schema's `ZodError`.

### User Story 3 - Page, cursor and table inputs (Priority: P1)

`class ListStorefrontProductsInput extends CursorInput {}`, `class ListOrdersInput extends TableInput {}` and
`class StorefrontProductPage extends Page.of(StorefrontProductCard) {}`.

**Acceptance Scenarios**:

1. `CursorInput` accepts a limit from 1 to 100, defaults it to 20, and takes an optional cursor.
2. `TableInput` accepts a limit of 20, 50 or 100 (default 20), an optional sort `{ key, direction }` and a filter
   (default `{}`).
3. `Page.of(X)` gives `items: X[]`, `nextCursor?: string` and `hasMore: boolean`.

### User Story 4 - Derive a shape from a shape (Priority: P2)

`class QuickOrderForm extends PickType(CreateOrderInput, ["lines"]) { @Int({ min: 0 }) redeemPoints = 0; }`.

**Acceptance Scenarios**:

1. `PickType(X, keys)`, `OmitType(X, keys)` and `PartialType(X)` give a shape class whose fields are the picked,
   remaining or optional data fields of `X` (methods dropped), with `create` typed to the subclass.
2. A key that is not a data field of `X` is a type error.

### User Story 5 - Generated schemas compile against the runtime helpers (Priority: P1)

Generated `#stackra/schemas` and clients import `publicId`, `isoDateTime`, `json`, `url`, `duration`, `tableInput`,
and the types `Assert`, `Fields`, `Same` for each `X$Check`.

**Acceptance Scenarios**:

1. `publicId("ord")` accepts `ord_` plus 26 Crockford base32 characters and its output type is `PublicId<"ord">`, so
   `X$Check` holds; an invalid prefix throws a `TypeError` when the schema is built.
2. `isoDateTime()` decodes ISO 8601 with an offset to a `Date`, refuses a time without an offset, and encodes back to
   ISO 8601.
3. `json()` outputs `Json`; `url()` outputs `Url` and refuses a URL with no `scheme://`.
4. `duration("60s")` equals `Duration.seconds(60)`; ISO input is read too; anything else throws a `RangeError`.
5. `tableInput({ sort, filters })` gives the caller's view of a narrowed table input.
6. `.exactOptional()` on a helper: the key may be absent but not `undefined`.

### Edge Cases

- A Crockford id in upper case (`var_01JA0000000000000000000001`, the template's fixture) passes and is kept as given.
- A `Date` passed to `isoDateTime()` (from `X.create`) passes through, so code-form values build a shape.
- Registering a class twice replaces its schema (gen output reloaded in a test or dev server).
- A subclass of a registered class has no schema until gen registers its own: the registry matches the class exactly,
  so a subclass never validates against its parent's fields.

## Requirements

- **FR-001**: The package SHALL be `@stackra/validation` at `packages/foundation/validation`, `tier:lib`, entry `.`
  only (registry row; ADR 0127 note; Q4 folds `./runtime`).
- **FR-002**: `.` SHALL export at runtime exactly `Classified`, `CursorInput`, `Field`, `Int`, `List`, `Num`,
  `OmitType`, `Page`, `PartialType`, `PickType`, `Renamed`, `Schema`, `Str`, `TableInput`, `Trim`, `duration`,
  `isoDateTime`, `json`, `publicId`, `registerSchemas`, `schemaOf`, `tableInput`, `url`, `validate`, and the types
  `Assert`, `Fields`, `Same`, `FieldDecorator`, `ShapeClass`.
- **FR-003**: `Schema` SHALL be a bare kind base registered as `schema`, with a protected type-only `~kind` brand (not
  in `keyof`, so `Fields<X>` and `X$Check` ignore it) and a static `create` typed to the calling class.
- **FR-004**: Every field decorator SHALL be made with `createDecorator` from `@stackra/container`, record only, and be
  typed against its field (ADR 0294 R6). `@Renamed` SHALL decorate a class or a field.
- **FR-005**: `registerSchemas([[Class, X$], ...])` SHALL fill the registry; `schemaOf(Class)` SHALL read it and throw a
  `TypeError` for an unregistered class (gap G1).
- **FR-006**: `Enum` SHALL NOT be exported (it is `@stackra/contracts`', Q1); `money` and `currencyCode` SHALL NOT be
  exported (they are `@stackra/money`'s, Q5).
- **FR-007**: Runtime dependencies SHALL be `@stackra/contracts`, `@stackra/container` (`workspace:*`) and `zod`
  (`catalog:`) only.
- **FR-008**: Every source file SHALL carry the Stackra file contract, one exported declaration per file, TSDoc on
  every export; tests SHALL sit in `__tests__/` beside the subject and import from `@stackra/testing`.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/validation` exists with the shape it uses: `Schema`
  (`extends Schema`, `X.create`), `Int`, `Str` (`min`, `max`, `pattern`, `message`, `each`), `Num` (`exclusiveMin`),
  `List` (`min`, `max`, `unique`), `Field(zod)`, `Trim` (bare), `Renamed("old")` on a class and a field,
  `Classified(DataClassification.X)`, `CursorInput`, `TableInput`, `Page.of`, `PickType`, `validate`, `publicId`,
  `isoDateTime`, `json`, `url`, `duration`, `tableInput`, `Assert`, `Fields`, `Same`.
- **SC-002**: The registry row's tests exist: typed decorators (type tests), `each`, metadata-only decorators,
  `CursorInput` bounds, `Page.of` fields, the `isoDateTime` codec, `publicId` brand, `.exactOptional()`, `validate`
  through the registry and its clear failure.
- **SC-003**: The barrel test fails when a runtime export is added or removed.

## Assumptions

- Field decorators may mark the kinds whose classes gen compiles to a shape. Their codes are the base class names in
  snake_case (`schema`, `model`, `refusal`, `integration_event`, ...); `SHAPE_KINDS` lists them, and a kind package
  that adds a field-carrying kind adds its code there in the same change (the `BINDING_KINDS` precedent).
- `validate` and `create` return an instance of the class (prototype set, constructor not run), as the ORM builds a
  loaded row; nested shapes stay plain objects.
- `duration(text)` builds a `Duration` value (the generated defaults call `duration("60s")`), from a short form or
  ISO 8601; it is not a field schema.
- `tableInput` builds the caller's view used by generated clients: `sort` and `filter` are optional there because the
  server's own generated schema applies the resource table's default sort.
