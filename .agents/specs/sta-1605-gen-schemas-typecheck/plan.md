# Implementation Plan: what gen writes typechecks, and every library member checks it

**Spec**: `.agents/specs/sta-1605-gen-schemas-typecheck/spec.md` · **Linear**: STA-1605 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-1605-gen-schemas-typecheck/spec.md`

## Summary

Put the generated folders in the `library` preset's program, then fix every error that surfaced, at its source in
gen's emitters, never by loosening a check. Literal defaults go through a new curried `withDefault` that types the
literal by the field's output; `X$Check` omits a model's getters and reads generic shapes over `any`; the `~defaults`
brand is limited to call-input shapes; the wiring stops re-declaring authored `DriverRegistry` keys, duplicate
client variants and Worker-only drivers; driver names follow a member-named port's stand-in; a member off the
container gets no module. Four package schemas that disagreed with their own types are corrected.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `@stackra/gen`, `@stackra/validation`, `@stackra/container`, `@stackra/typescript-config`, plus the
  analytics, panel, settings and registry schema fixes and the regenerated manifests
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); a node test that runs `generate` and the TypeScript compiler
- **Storage**: none
- **Runtime target**: gen and the presets are development-time; `withDefault` is isomorphic

## Constitution Check

| Law                                   | Result | Note                                                               |
| ------------------------------------- | ------ | ------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | generated code imports `withDefault` from `@stackra/validation`    |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                         |
| Security                              | N/A    | no runtime surface changes                                         |
| HTTP and events                       | N/A    | no route, header or event changes                                  |
| Tenancy                               | N/A    | no tenant data                                                     |
| Delegation                            | PASS   | one session, one branch                                            |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                             |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                 |
| Versions and catalogs                 | PASS   | no dependency added                                                |
| Deploy modes (ADR 0076)               | PASS   | development-time; the schema fixes behave the same in all three    |
| Licence tier (ADR 0077)               | PASS   | free                                                               |
| Docs and ADRs                         | PASS   | implements ADR 0294 decision 26 and ADR 0263; README and changeset |

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | generated code is typechecked in CI with each member's typecheck |
| On-prem    | same                                                             |
| Air-gapped | same                                                             |

## Correctness properties

- **P-001**: for every library member, the typecheck program includes `.stackra/gen` and `.stackra/entry` — Validates: FR-001
- **P-002**: for every literal default, the generated expression parses `undefined` to an equal fresh copy of the literal, and a literal that violates the field's output does not compile — Validates: FR-002
- **P-003**: for every model and generic shape, `X$Check` holds when the class and the schema agree — Validates: FR-003, FR-004, FR-005
- **P-004**: for every `DriverRegistry` key, exactly one declaration exists in a member's program — Validates: FR-006
- **P-005**: for every driver file of a member-named port, the driver name equals the stand-in's name — Validates: FR-007
- **P-006**: for every member without `@stackra/container`, no generated file names a module — Validates: FR-009

## Architecture overview

The fix stays in the emitters: `emitSchemas` (`defaulted`, the check's omitted keys and type arguments, the brand
rule), `emitEntities` (no brand rows), `emitWiring` (authored keys, client variants, Worker entries), `driverName`
with `portMember`, and `rootModuleOf`. The reader adds what the emitters need: a shape's type parameters, the authored
`DriverRegistry` keys, and an imported class's import name. `withDefault` and `DefaultLiteral` live in
`@stackra/validation`, which generated schemas already import.

## Components and responsibilities

- `withDefault`, `DefaultLiteral` (`validation/src/core`): a typed factory default.
- `Fields`, `InputFields` (`validation/src/core/types`): drop symbol keys.
- `emitSchemas` (`gen/src/core/functions/emit-schemas.function.ts`): defaults, `X$Check`, brands, driver-name fields.
- `emitEntities`, `emitHostedEntities`: no brand rows.
- `emitWiring` (`gen/src/core/functions/emit-wiring.function.ts`): registry keys, candidates, Worker entries.
- `driverName`, `portMember` (`gen/src/core/functions`): member-named ports.
- `rootModuleOf` (`gen/src/core/functions/root-module-of.function.ts`): no module off the container.
- `createSourceReader`, `discoverMember` (`gen/src/node/functions`): type parameters, authored keys, import names.
- `Wiring.platform` (`container/src/core/types/wiring.type.ts`): admits `Container`.
- `library.json` (`tooling/typescript/src`): includes the generated folders.

## Files and folders

```text
packages/developer/gen/src/
├── core/functions/
│   ├── emit-schemas.function.ts
│   ├── emit-entities.function.ts
│   ├── emit-hosted-entities.function.ts
│   ├── emit-wiring.function.ts
│   ├── driver-name.function.ts
│   ├── port-member.function.ts
│   ├── root-module-of.function.ts
│   ├── system-driver-defaults.function.ts
│   ├── build-manifest.function.ts
│   └── __tests__/
├── core/types/
│   ├── member-ir.type.ts
│   └── shape-ir.type.ts
└── node/
    ├── functions/
    │   ├── create-source-reader.function.ts
    │   └── discover-member.function.ts
    ├── types/
    │   ├── source-reader.type.ts
    │   └── ts-node.type.ts
    └── __tests__/generated-schemas-typecheck.test.ts
packages/foundation/validation/src/core/
├── functions/with-default.function.ts
├── types/default-literal.type.ts
├── types/fields.type.ts
└── types/input-fields.type.ts
packages/foundation/container/src/core/types/wiring.type.ts
packages/tooling/typescript/src/library.json
packages/tooling/typescript/README.md
.changeset/gen-schemas-typecheck.md
```

- `packages/developer/gen/src/core/functions/emit-schemas.function.ts`
- `packages/developer/gen/src/core/functions/emit-wiring.function.ts`
- `packages/developer/gen/src/core/functions/driver-name.function.ts`
- `packages/developer/gen/src/core/functions/port-member.function.ts`
- `packages/developer/gen/src/core/functions/root-module-of.function.ts`
- `packages/developer/gen/src/node/functions/create-source-reader.function.ts`
- `packages/developer/gen/src/node/__tests__/generated-schemas-typecheck.test.ts`
- `packages/foundation/validation/src/core/functions/with-default.function.ts`
- `packages/foundation/validation/src/core/types/default-literal.type.ts`
- `packages/tooling/typescript/src/library.json`

## Data models and migrations

None.

## Contracts

- `@stackra/validation`: `withDefault<S extends z.ZodType>(schema: S): (factory: () => DefaultLiteral<z.output<S>>) =>
z.ZodDefault<S>`; type `DefaultLiteral<T>`.
- `@stackra/gen`: `driverName(file, port, member?)`; `ShapeIR.typeParameters?`; `MemberIR.authoredDriverKeys?`.
- Manifests: shorter driver names for member-named ports; no module class for a member off the container.
- `@stackra/typescript-config/library`: `include` gains `.stackra/gen` and `.stackra/entry`.

## Error handling

No new refusal. A generated type error now fails the member's typecheck with the compiler's message.

## Security and tenancy

No change.

## Testing strategy

- AC-001: `presets.test.ts` ("library checks what gen writes").
- AC-002: `generated-schemas-typecheck.test.ts`; `with-default.function.test.ts`.
- AC-003: the member-wide `tsc --noEmit` on box 2 after `pnpm gen` (99 members, no error).
- AC-004: `driver-name.function.test.ts`, `port-member.function.test.ts`.
- AC-005: `root-module-of.function.test.ts`.
- AC-006: the member-wide typecheck (`@stackra/platform`'s stand-in); `driver-name.type.test.ts` in the container.

## Rollout

One changeset (minor for gen, validation and the presets; patch for the rest). Members run `stackra gen` and commit
their manifests.

## Delegation and risk plan

One session, one branch. Change risk R2.

## ADRs

ADR 0294 (decision 26), ADR 0263 (drivers by file prefix; decision 9, stand-ins), ADR 0305 (rules 15 and 16),
ADR 0295: Accepted; implemented as written.

## Docs

`packages/tooling/typescript/README.md`, `.changeset/gen-schemas-typecheck.md`.

## Complexity tracking

none

## Follow-up

None.
