# Implementation Plan: `@Deprecated`, recorded by gen, and one deprecation policy page

**Spec**: `.agents/specs/sta-2836-deprecated-decorator/spec.md` · **Linear**: STA-2836 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2836-deprecated-decorator/spec.md`

## Summary

The deprecation window gets one home in `@stackra/contracts` (`earliestSunset`, `deprecationProblem`, `sunsetReached`).
`@stackra/validation` ships `@Deprecated`, a recording decorator made with `createDecorator` that checks its terms on
import. Gen reads it from source like `@Renamed`, reads a trait's `createTrait` `deprecated` option, records every
deprecation in the manifest, OpenAPI and generated clients, and warns where a member uses something deprecated or has
reached its own sunset. One docs page states the policy.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/foundation/contracts`, `packages/foundation/validation`, `packages/developer/gen`,
  `apps/docs`
- **Testing**: vitest unit tests in `src/**/__tests__/`; gen's source-reader fixtures (TypeScript on disk) and a full
  `generate` run on the shop fixture
- **Storage**: none
- **Runtime target**: build time (gen); the decorator runs on import and records only

## Constitution Check

| Law                                   | Result | Note                                                                    |
| ------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | validation and gen already depend on contracts; no new import direction |
| Secrets (ADR 0009)                    | PASS   | none                                                                    |
| Security                              | PASS   | no data, no runtime behaviour change                                    |
| HTTP and events                       | PASS   | OpenAPI gains the standard `deprecated` flag; no route or shape change  |
| Tenancy                               | N/A    | build-time only                                                         |
| Delegation                            | PASS   | Claude only                                                             |
| Not built yet (ADR 0011)              | PASS   | runtime metering of deprecated use stays planned, and the docs say so   |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside each subject                               |
| Versions and catalogs                 | PASS   | one minor changeset for contracts, validation and gen                   |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                       |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                               |
| Docs and ADRs                         | PASS   | the policy page, ADR 0131 Enforcement, programming model, AGENTS.md     |

## Deploy modes

| Mode       | Behaviour                    |
| ---------- | ---------------------------- |
| SaaS       | same; gen runs at build time |
| On-prem    | same                         |
| Air-gapped | same; nothing calls out      |

## Correctness properties

- **P-001**: the window formula has one implementation, called by the decorator and by gen — Validates: AC-001, AC-002
- **P-002**: a decorator never changes behaviour: it records frozen terms and throws only at definition — Validates:
  AC-003, AC-004
- **P-003**: gen reads exactly what the decorator records, and refuses what the decorator would throw on — Validates:
  AC-005
- **P-004**: a member that deprecates nothing gets byte-identical manifests, OpenAPI and clients — Validates: AC-006,
  AC-007, AC-008
- **P-005**: every warning names the deprecated thing, where it comes from, and the replacement or the removal —
  Validates: AC-009, AC-010

## Architecture overview

1. `deprecationProblem(value)` checks the terms; `earliestSunset(since)` is the window; `sunsetReached(sunset, now)`
   compares a sunset with a version or a date.
2. `@Deprecated(terms)` runs `deprecationProblem`, then applies one of two `createDecorator` recorders (class:
   `DEPRECATABLE_KINDS` = `IDENTITY_KINDS` + `settings` + `service`; field: `SHAPE_KINDS`).
3. The source reader's `deprecationOf` reads the constant terms, refuses with the same codes or
   `deprecation_not_constant`, and stores them on `DeclaredClass.deprecated` and `FieldIR.deprecated`; `deprecatedTraits`
   reads `export const X = createTrait(code, apply, { deprecated })`. `Deprecated` joins `SHAPE_DECORATORS`, so it is
   never a facet.
4. `buildManifest` writes `deprecations` (`deprecationsOf`, own entries only, sorted) and `deprecated` on the action and
   event entries; `jsonSchemaOf` marks a field; `openApiOf` and `emitClients` read the entries.
5. `checkDeprecations` runs in `generateMember`'s full pass and returns warnings only.

## Components and responsibilities

- `earliestSunset`, `deprecationProblem`, `sunsetReached` (contracts): the policy as code.
- `Deprecated`, `DEPRECATABLE_KINDS` (validation): the authoring surface.
- `deprecationOf`, `deprecatedTraits` (gen source reader): reading.
- `deprecationsOf`, `buildManifest`, `jsonSchemaOf`, `openApiOf`, `emitClients` (gen): recording.
- `checkDeprecations` (gen): the warnings.
- `customers/deprecation.mdx` (docs): the policy page.

## Files and folders

```text
packages/foundation/contracts/
  AGENTS.md
  src/core/index.ts
  src/core/__tests__/index.test.ts
  src/core/functions/deprecation-problem.function.ts
  src/core/functions/earliest-sunset.function.ts
  src/core/functions/sunset-reached.function.ts
  src/core/functions/__tests__/deprecation-problem.function.test.ts
  src/core/functions/__tests__/earliest-sunset.function.test.ts
  src/core/functions/__tests__/sunset-reached.function.test.ts
  src/core/types/deprecation.type.ts
  src/core/types/deprecation-problem.type.ts
  src/core/types/stackra-manifest.type.ts
packages/foundation/validation/
  AGENTS.md
  src/core/index.ts
  src/core/__tests__/index.test.ts
  src/core/constants/deprecatable-kinds.constant.ts
  src/core/constants/__tests__/deprecatable-kinds.constant.test.ts
  src/core/decorators/deprecated.decorator.ts
  src/core/decorators/__tests__/deprecated.decorator.test.ts
packages/developer/gen/
  AGENTS.md
  src/core/index.ts
  src/core/__tests__/fixtures/deprecated-commerce-ir.fixture.ts
  src/core/functions/build-manifest.function.ts
  src/core/functions/check-deprecations.function.ts
  src/core/functions/deprecations-of.function.ts
  src/core/functions/emit-clients.function.ts
  src/core/functions/generate-member.function.ts
  src/core/functions/json-schema-of.function.ts
  src/core/functions/open-api-of.function.ts
  src/core/functions/__tests__/check-deprecations.function.test.ts
  src/core/functions/__tests__/deprecations-of.function.test.ts
  src/core/functions/__tests__/emit-clients.function.test.ts
  src/core/functions/__tests__/open-api-of.function.test.ts
  src/core/types/declared-class.type.ts
  src/core/types/deprecated-trait-ir.type.ts
  src/core/types/field-ir.type.ts
  src/core/types/member-ir.type.ts
  src/node/constants/shape-decorators.constant.ts
  src/node/functions/create-source-reader.function.ts
  src/node/functions/discover-member.function.ts
  src/node/functions/__tests__/create-source-reader.function.test.ts
  src/node/functions/__tests__/generate.function.test.ts
  src/node/types/source-reader.type.ts
apps/docs/src/
  config/docs.config.ts
  docs/customers/deprecation.mdx
  docs/customers/support.mdx
  docs/programming-model.mdx
  docs/programming-model.ar.mdx
  docs/adr/0131-module-key-version-and-deprecation.mdx
.changeset/deprecated-decorator-recorded-by-gen.md
```

## Data models and migrations

None.

## Contracts

```ts
// @stackra/contracts
export interface Deprecation {
  readonly since: string;
  readonly sunset: string;
  readonly replacement?: string;
}
export function earliestSunset(since: string): string | undefined;
export function deprecationProblem(value: unknown): DeprecationProblem | undefined;
export function sunsetReached(sunset: string, now: string): boolean;
// @stackra/validation
export function Deprecated(options: Deprecation): DecoratorFunction; // .on(Class), .members(Class)
```

The manifest's `deprecations` entries: `{ kind, name, member?, module?, identity?, since, sunset, replacement? }`.

## Error handling

- The decorator throws `TypeError("@Deprecated: <message> (<code>)")` at class definition.
- Gen refuses `deprecation_invalid`, `deprecation_window_short` (fix: the earliest sunset) and
  `deprecation_not_constant` at the decorator's or option's position.
- `deprecated_use` and `deprecation_past_sunset` are warnings and never stop a run.

## Security and tenancy

No data and no runtime path change. The terms are public API names, versions and dates.

## Testing strategy

- AC-001, AC-002: `earliest-sunset.function.test.ts`, `deprecation-problem.function.test.ts`,
  `sunset-reached.function.test.ts`.
- AC-003, AC-004: `deprecated.decorator.test.ts`, `deprecatable-kinds.constant.test.ts`.
- AC-005: `create-source-reader.function.test.ts` ("createSourceReader on deprecations").
- AC-006: `deprecations-of.function.test.ts` and `generate.function.test.ts` (the full run writes the section and the
  schema mark).
- AC-007: `open-api-of.function.test.ts`. AC-008: `emit-clients.function.test.ts`.
- AC-009, AC-010: `check-deprecations.function.test.ts` and the `generate` run's warning.
- AC-011: the docs build and `stackra doc-standard`.
- Each behaviour test fails with its change reverted (shown in the PR).

## Rollout

One minor changeset for `@stackra/contracts`, `@stackra/validation` and `@stackra/gen`. No committed manifest changes,
since no member deprecates anything yet. To roll back, revert the release.

## Known risks

- A use gen cannot see (reading a deprecated field of a dependency's shape, calling a settings group through
  `this.settings.get(Group)`) is not warned by gen; the generated client's `@deprecated` lines cover client calls and
  events, and TypeScript's own `@deprecated` TSDoc covers the rest.
- Runtime metering of deprecated use (ADR 0136 decision 4) stays planned.
- The supported-versions table waits on STA-1576.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1; the feature tier's Planned approval is the CTO's to record.

## ADRs

ADR 0131 decision 4 (implemented; Enforcement updated); ADR 0136 decision 4; ADR 0177 decision 6.

## Docs

`customers/deprecation.mdx` (new), `customers/support.mdx`, `programming-model.mdx` and `.ar.mdx`, ADR 0131,
`docs.config.ts`, three AGENTS.md files.

## Complexity tracking

none
