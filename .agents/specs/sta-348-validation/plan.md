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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                           |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/foundation/validation`; workspace imports: `@stackra/container`, `@stackra/contracts` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                            |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                          |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                   |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                 |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                         |
| Not built yet (ADR 0227)              | PASS   | Zod through `@stackra/validation`; no class-validator or class-transformer (ADR 0095)                                                                          |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                      |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                              |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                             |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                        |

- Boundaries: runtime imports `@stackra/contracts` (`Duration`, `Enum`, `SortDirection`, types), `@stackra/container`
  (`createDecorator`, `registerKind`, `DecoratorTarget`, types) and `zod`; dev-only `@stackra/testing` and presets.
- No `@stackra/errors` (parallel sub-wave): an unregistered class is a programming error, a `TypeError`.
- Naming: decorator names and helper names are the ones the template and generated samples import.
- One exported declaration per file; internal constants and helpers are not re-exported from the barrel.

## Properties

- **P-001**: For every registered class `X` and input `i`, `validate(X, i).success` equals `schemaOf(X).safeParse(i).success` — Validates: FR-005
- **P-002**: `z.encode(isoDateTime(), isoDateTime().parse(s))` is the same instant as `s` for every ISO string `s` with an offset — Validates: FR-002
- **P-003**: `duration(short)` and `Duration.parse(iso)` agree for equal lengths — Validates: FR-002
- **P-004**: `package.json` names `@stackra/validation` at `packages/foundation/validation`, `exports` lists only `.`, and there is no `./runtime` entry — Validates: FR-001
- **P-005**: `Schema` is a bare kind base registered as `schema` with a protected type-only `~kind` brand outside `keyof`, so `Fields<X>` and `X$Check` ignore it, and `X.create` is typed to the calling class — Validates: FR-003
- **P-006**: every field decorator is made with `createDecorator` from `@stackra/container`, records only and is typed against its field, and `@Renamed` decorates a class or a field — Validates: FR-004
- **P-007**: `.` exports no `Enum`, no `money` and no `currencyCode` — Validates: FR-006
- **P-008**: `package.json` `dependencies` lists `@stackra/contracts`, `@stackra/container` and `zod` and nothing else — Validates: FR-007
- **P-009**: every non-test source file opens with the Stackra file contract and has one exported declaration with TSDoc, and every test sits in `__tests__/` and imports from `@stackra/testing` — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |
