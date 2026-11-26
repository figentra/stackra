# Implementation Plan: one data-classification source drives encryption, erasure, retention and masking

**Spec**: `.agents/specs/sta-1421-one-classification-source/spec.md` · **Linear**: STA-1421 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-1421-one-classification-source/spec.md`

## Summary

`@stackra/contracts` holds the one table of the built-in classes' eight effects and their order of strictness.
`@stackra/model`'s `DataClass` requires the eight effects, and `fieldDataClasses` gives every classified field one
effective class (the stricter of `@Classify` and `@Classified`). `@stackra/privacy` derives a `PersonalData`
declaration's fields from those classes and refuses a weaker declared method. Gen reads the same table and `PersonalData`
declarations, and refuses a model or declaration that disagrees with its fields' classes.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/foundation/contracts`, `packages/data/model`, `packages/security/privacy`, `packages/developer/gen`, `apps/docs`
- **Testing**: vitest in `src/**/__tests__/`
- **Storage**: none
- **Runtime target**: library code (isomorphic) and the gen build step

## Constitution Check

| Law                                   | Result | Note                                                                                        |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | contracts stays the leaf; model and gen read it; privacy reads model; no new dependency     |
| Secrets (ADR 0009)                    | PASS   | none                                                                                        |
| Security                              | PASS   | only tightens: a class never loosens its floor; a field with two classes takes the stricter |
| HTTP and events                       | N/A    | no route or event changes                                                                   |
| Tenancy                               | N/A    | no table, column or scope change                                                            |
| Delegation                            | PASS   | Claude builds; the CTO approves ADR 0540 and reads the change                               |
| Not built yet (ADR 0011)              | PASS   | the masker and seeded records are named as planned in ADR 0540, not claimed                 |
| Test placement (ADR 0022)             | PASS   | every new test is in `__tests__/`                                                           |
| Versions and catalogs                 | PASS   | one minor changeset for the four packages, with a Breaking section                          |
| Deploy modes (ADR 0076)               | PASS   | the same in every mode                                                                      |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                                   |
| Docs and ADRs                         | PASS   | ADR 0540 with Notes on 0134, 0341, 0380; READMEs and AGENTS of the four packages            |

## Deploy modes

| Mode       | Behaviour                                                           |
| ---------- | ------------------------------------------------------------------- |
| SaaS       | gen refuses the new errors at build; erasure refuses weaker methods |
| On-prem    | the same                                                            |
| Air-gapped | the same                                                            |

## Correctness properties

- **P-001**: every `DataClassification` code has a frozen row with exactly the eight effects, each code ranked — Validates: AC-001
- **P-002**: `DataClass` with an effect missing or an unknown code throws `RangeError` — Validates: AC-002
- **P-003**: `CredentialDataClass.dataClass` deep-equals `{ key: "credential", ...DATA_CLASSIFICATION_EFFECTS.credential }` — Validates: AC-003
- **P-004**: for a field with both decorators, every effect of `fieldDataClasses` ranks at least as strict as each decorator's — Validates: AC-004
- **P-005**: `maskOf(M).get(f) === fieldDataClasses(M).get(f).mask` for every classified field — Validates: AC-005
- **P-006**: a declaration without `fields` resolves to exactly the fields whose class's erasure is not `keep`, minus credentials — Validates: AC-006
- **P-007**: an erasure with a weaker declared method changes no row and destroys no salt — Validates: AC-007
- **P-008**: a field whose class rests sealed is refused unless `HasEncryptedFields` names it (with `subject` for `subject_sealed`) — Validates: AC-008, AC-011
- **P-009**: a looser `@Classify`, a missing effect and a retention-bound model without `Retention` are each refused — Validates: AC-009
- **P-010**: a `PersonalData` declaration is read with its options and checked against its own model, derived or listed — Validates: AC-010

## Architecture overview

`@Classified(X)` and `@Classify(C)` stay the two ways to classify a field; their meaning is one class. At runtime,
`fieldDataClasses` reads both decorators' metadata and the contracts table; at build time, gen's `fieldDataClassOf`
reads the `@Classify` facet's constant effects (`dataClassOf` in the source reader) and `FieldIR.classified` against the
same table. Each keeping effect has its reader: gen for `encrypt` and `retention`, privacy and gen for `erasure`,
`maskOf` for `mask`.

## Components and responsibilities

- `DATA_CLASSIFICATION_EFFECTS`, `DATA_CLASS_EFFECT_RANKS`, `DataClassEffects`, `loosenedEffects`, `strictestEffects` (contracts): the table and the order.
- `FieldEncryption`, `SubjectErasure`, `RetentionBound`, `MaskMethod` (model enums); `DataClassOptions`; `DataClass` (checks every effect).
- `builtInDataClass`, `fieldDataClasses`, `maskOf` (model functions).
- `PersonalDataOptions.fields` optional; `personalDataDeclarations` derives; `looserErasureFields`; `EraseSubjectWorkflow.erase` refuses (privacy).
- `fieldDataClassOf`, `checkDataClasses`, `checkPersonalData`, the generalised `checkEncryptedFields`, the `personal_data` kind in `KIND_BASES` and `KIND_FILES` (gen).

## Files and folders

```text
.changeset/one-classification-source.md
apps/docs/src/docs/adr/0540-one-classification-source-for-encryption-erasure-retention-and-masking.mdx
apps/docs/src/docs/adr/0134-data-invariants-classification-and-delete-lifecycle.mdx
apps/docs/src/docs/adr/0341-product-defined-data-classes-and-the-privileged-class.mdx
apps/docs/src/docs/adr/0380-data-class-effects-for-the-built-in-classes-seeded-as-data-over-a-code-floor.mdx
apps/docs/src/docs/adr/index.mdx
packages/foundation/contracts/{README.md,AGENTS.md}
packages/foundation/contracts/src/core/index.ts
packages/foundation/contracts/src/core/types/data-class-effects.type.ts
packages/foundation/contracts/src/core/constants/data-classification-effects.constant.ts
packages/foundation/contracts/src/core/constants/data-class-effect-ranks.constant.ts
packages/foundation/contracts/src/core/functions/loosened-effects.function.ts
packages/foundation/contracts/src/core/functions/strictest-effects.function.ts
packages/data/model/{README.md,AGENTS.md}
packages/data/model/src/core/index.ts
packages/data/model/src/core/enums/{field-encryption,subject-erasure,retention-bound,mask-method}.enum.ts
packages/data/model/src/core/types/data-class-options.type.ts
packages/data/model/src/core/bases/data-class.base.ts
packages/data/model/src/core/access/{privileged,credential}.data-class.ts
packages/data/model/src/core/functions/{built-in-data-class,field-data-classes,mask-of}.function.ts
packages/security/privacy/{README.md,AGENTS.md}
packages/security/privacy/src/contracts/types/personal-data-options.type.ts
packages/security/privacy/src/core/bases/personal-data.base.ts
packages/security/privacy/src/core/functions/{personal-data-declarations,looser-erasure-fields}.function.ts
packages/security/privacy/src/node/workflows/erase-subject.workflow.ts
packages/developer/gen/{README.md,AGENTS.md}
packages/developer/gen/src/core/functions/{field-data-class-of,check-data-classes,check-personal-data,check-encrypted-fields,generate-member}.function.ts
packages/developer/gen/src/core/constants/kind-files.constant.ts
packages/developer/gen/src/node/constants/kind-bases.constant.ts
packages/*/src/**/__tests__/ (the tests)
```

## Data models and migrations

none

## Contracts

- `@stackra/contracts`, added: `DataClassEffects` (type); `DATA_CLASSIFICATION_EFFECTS: Readonly<Record<DataClassification, DataClassEffects>>`; `DATA_CLASS_EFFECT_RANKS` (per effect, code to rank); `loosenedEffects(candidate, floor): (keyof DataClassEffects)[]`; `strictestEffects(a, b): DataClassEffects`.
- `@stackra/model`, added: the four enums, `builtInDataClass(code)`, `fieldDataClasses(type)`, `maskOf(type)`. Changed: `DataClassOptions` requires four more effects.
- `@stackra/privacy`, added: `looserErasureFields(declaration): string[]`. Changed: `PersonalDataOptions.fields` optional.
- `@stackra/gen`, added: `checkDataClasses(ir)`, `checkPersonalData(ir)`; the `personal_data` kind; ten refusal codes (spec AC-008 to AC-010).

## Error handling

- `DataClass`: `TypeError` for a bad key, `RangeError` for a missing or unknown effect.
- `EraseSubjectWorkflow.erase`: `TypeError` listing each weaker field before any row or salt is touched.
- Gen: refusals with a subject (`Model.field` or `Declaration.field`) and a fix line.

## Security and tenancy

The change only tightens handling: no class may loosen its floor, and a field with two classes takes the stricter code
of each effect. It reads no row, adds no secret and changes no tenant boundary.

## Testing strategy

- AC-001: `data-classification-effects.constant.test.ts`, `loosened-effects.function.test.ts` (contracts).
- AC-002, AC-003: `data-class.base.test.ts` (model).
- AC-004, AC-005: `field-data-classes.function.test.ts` (model).
- AC-006: `personal-data-declarations.function.test.ts`, `personal-data.base.test.ts` (privacy).
- AC-007: `looser-erasure-fields.function.test.ts`, `erase-subject.workflow.test.ts` (privacy).
- AC-008, AC-011: `check-encrypted-fields.function.test.ts` (gen).
- AC-009: `check-data-classes.function.test.ts` (gen, with the full `generateMember` pass).
- AC-010: `check-personal-data.function.test.ts` and `create-source-reader.function.test.ts` ("personal-data declarations") (gen).

## Rollout

One minor changeset for the four packages, led by its Breaking section and three adoption steps. No data migration.

## Delegation and risk plan

Claude builds; the CTO approves ADR 0540 and reads the change. R2. Route `spec-task`.

## ADRs

ADR 0540 (new, Proposed), amending ADR 0134 decision 2, ADR 0341 decision 2 and ADR 0380 decisions 2 and 3; reads with
ADR 0494 and ADR 0189.

## Docs

ADR 0540 and the three Notes, the ADR index, the README and AGENTS of contracts, model, privacy and gen, the changeset.

## Complexity tracking

none
