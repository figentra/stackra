# Plan: `@stackra/validation` wave 1c

**Spec**: `.agents/specs/sta-348-validation/spec.md`

## Design

- `src/core/bases/schema.base.ts`: `Schema`, an abstract class with a protected `declare`d `~kind` brand and a static
  `create`, registered with `registerKind(Schema, "schema")` (bare-only kind, ADR 0294 d25).
- `src/core/constants/schema-registry.constant.ts`: `SCHEMA_REGISTRY`, a WeakMap from class to zod schema (internal).
  `functions/register-schemas.function.ts` writes it, `functions/schema-of.function.ts` reads it (exact class match),
  `functions/instantiate.function.ts` (internal) puts parsed data on the class prototype. `validate` and
  `Schema.create` use those three.
- `src/core/constants/shape-kinds.constant.ts` and `identity-kinds.constant.ts`: the kind codes field decorators and
  the class form of `@Renamed` may mark.
- `src/core/decorators/*.decorator.ts`: `Str`, `Int`, `Num`, `List` (functions with an `each` overload), `Trim`
  (bare), `Field(zod)`, `Classified` (the `createDecorator` result), `Renamed` (class or field). Typing: a constraint
  decorator is `FieldDecorator<T>` (the field's type fits `T | null`, the spike's form); `Field` checks the other way
  (the schema's output fits the field), so `z.literal(true)` on `boolean` passes.
- `src/core/schemas/cursor-input.schema.ts`, `table-input.schema.ts`: the two shipped shapes; each registers its own
  schema (`constants/*-schema.constant.ts`) when its module loads, so no side-effect import is needed.
- `src/core/constants/page.constant.ts`: `Page`, a frozen namespace with `of(Item)`.
- `src/core/functions/pick-type|omit-type|partial-type.function.ts` and `derive-shape.function.ts` (internal): each
  returns a fresh named `Schema` subclass whose kind options record its base and keys; the type is
  `ShapeClass<...>`, one abstract construct signature plus `Schema.create`.
- `src/core/functions/public-id|iso-date-time|json|url|duration|table-input.function.ts`: the runtime half generated
  code imports (the folded `./runtime`).
- `src/core/types/fields|same|assert.type.ts`: the `X$Check` helpers (spike forms).
- Tool configs follow the container member (decorators presets) until gen writes them (STA-339).

## Constitution check

- Boundaries: runtime imports `@stackra/contracts` (`Duration`, `Enum`, `SortDirection`, types), `@stackra/container`
  (`createDecorator`, `registerKind`, `DecoratorTarget`, types) and `zod`; dev-only `@stackra/testing` and presets.
- No `@stackra/errors` (parallel sub-wave): an unregistered class is a programming error, a `TypeError`.
- Naming: decorator names and helper names are the ones the template and generated samples import.
- One exported declaration per file; internal constants and helpers are not re-exported from the barrel.

## Properties

- **P-001**: For every registered class `X` and input `i`, `validate(X, i).success` equals `schemaOf(X).safeParse(i).success`.
- **P-002**: `z.encode(isoDateTime(), isoDateTime().parse(s))` is the same instant as `s` for every ISO string `s`
  with an offset.
- **P-003**: `duration(short)` and `Duration.parse(iso)` agree for equal lengths.
