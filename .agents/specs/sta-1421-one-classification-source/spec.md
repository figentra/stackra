# Feature Specification: one data-classification source drives encryption, erasure, retention and masking

**Feature Branch**: `figentra/sta-1421-one-classification-source`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (technical stop; approval pending)

**Linear**: STA-1421

**Clarifications status**: complete

**Input**: Data-layer batch stackra-314 (gap gov3) and the 26 Nov production-readiness audit (item 17.2). A field's
handling was stated in up to four places nothing compared: `@Classified(DataClassification.X)`, `@Classify(DataClass)`
with four access effects, `HasEncryptedFields`, and a `PersonalData({ fields })` declaration. A `health` field could rest
in clear, a declaration could erase a field more weakly than its product decided, and gen could not see either, since it
did not read `PersonalData` and no class said how its fields are kept. The owner's data-layer decision 11 (2026-10-28):
merge into one `DataClass` declaration.

### Sources

- `packages/foundation/contracts/src/core/enums/data-classification.enum.ts` (the six codes)
- `packages/data/model/src/core/bases/data-class.base.ts`, `types/data-class-options.type.ts`, `access/*.data-class.ts`, `decorators/classify.decorator.ts`
- `packages/foundation/validation/src/core/decorators/classified.decorator.ts`
- `packages/security/privacy/src/core/bases/personal-data.base.ts`, `functions/personal-data-declarations.function.ts`, `node/functions/unsealed-shred-fields.function.ts`, `node/workflows/erase-subject.workflow.ts`
- `packages/developer/gen/src/core/functions/check-encrypted-fields.function.ts`, `node/functions/create-source-reader.function.ts` (`dataClassOf`)
- ADR 0134 decision 2, ADR 0341 decisions 2 to 4, ADR 0380 decisions 2 and 3, ADR 0494, ADR 0465 decision 5, ADR 0189 decision 2
- `notes/handover/gap-analysis/data-layer/governance.md` (gov3), `BATCHES.md` (stackra-314), `DECISIONS.md` (decision 11)

## Impact

- **Apps touched**: apps/docs (ADR 0540; Notes on ADR 0134, 0341 and 0380; the ADR index)
- **Services touched**: none
- **Packages touched**: packages/foundation/contracts, packages/data/model, packages/security/privacy, packages/developer/gen (and packages/data/search tests only)
- **Public contract change**: yes. New exports: `DATA_CLASSIFICATION_EFFECTS`, `DATA_CLASS_EFFECT_RANKS`, `DataClassEffects`, `loosenedEffects`, `strictestEffects` (`@stackra/contracts`); `FieldEncryption`, `SubjectErasure`, `RetentionBound`, `MaskMethod`, `builtInDataClass`, `fieldDataClasses`, `maskOf` (`@stackra/model`); `looserErasureFields` (`@stackra/privacy`); `checkDataClasses`, `checkPersonalData` (`@stackra/gen`). Breaking: `DataClassOptions` requires `encrypt`, `erasure`, `retention`, `mask`; `PersonalDataOptions.fields` becomes optional; new gen refusals; gen reads the `personal_data` kind
- **Cross-service events**: none
- **Tenancy and data**: no table or column changes. The effects decide how personal and special-category fields are sealed, erased and masked; nothing here reads or writes a row
- **Secrets**: none
- **ADR needed**: yes, ADR 0540 (Proposed), amending ADR 0134 decision 2, ADR 0341 decision 2 and ADR 0380 decisions 2 and 3
- **New dependencies**: none (gen already depends on `@stackra/contracts`; privacy already on `@stackra/model`)
- **Deploy modes**: all (SaaS, On-prem, Air-gapped): build-time checks and library behaviour only
- **Licence tier**: free (MIT, this repo)
- **Docs to update**: ADR 0540 and the Notes on ADR 0134, 0341, 0380; the ADR index; README and AGENTS of `@stackra/contracts`, `@stackra/model`, `@stackra/privacy` and `@stackra/gen`; the changeset (Breaking section and adoption steps)
- **Lane**: full
- **Change risk**: R2 (privacy controls on personal and special-category data; a breaking change for products that declare a `DataClass` or hold a `health` field)

## Acceptance criteria

- **AC-001**: THE `@stackra/contracts` entry SHALL export `DATA_CLASSIFICATION_EFFECTS`, holding for each of the six `DataClassification` codes its eight effects (`ai`, `support`, `search`, `export`, `encrypt`, `erasure`, `retention`, `mask`), and `DATA_CLASS_EFFECT_RANKS`, ordering each effect's codes loosest first.
- **AC-002**: WHEN a `DataClass({...})` is declared without one of the eight effects or with an unknown code, THE factory SHALL throw a `RangeError` naming the class and the effect.
- **AC-003**: THE `CredentialDataClass` effects SHALL equal the `credential` row of `DATA_CLASSIFICATION_EFFECTS`, and `PrivilegedDataClass` SHALL keep its fields out of erasure (`keep`) and masked copies (`null`).
- **AC-004**: WHEN a field carries `@Classified(X)` only, THE `fieldDataClasses` reader SHALL give it the built-in class `X`; with `@Classify(C)` only, class `C`; with both, the stricter code of the two on every effect under `C`'s key.
- **AC-005**: THE `maskOf(Model)` reader SHALL give each classified field its effective class's `mask` effect.
- **AC-006**: WHEN a `PersonalData` declaration leaves `fields` out, THE `personalDataDeclarations` reader SHALL take every classified field of the model whose class's `erasure` is not `keep`, with that method; a listed field list SHALL be kept as written; a field classified `credential` by either decorator SHALL be left out.
- **AC-007**: IF a declared erasure method ranks below its field's class's `erasure`, THEN THE `EraseSubjectWorkflow` SHALL refuse before any row is touched or any salt destroyed, naming the field.
- **AC-008**: WHEN gen checks an own model, THE gen full pass SHALL refuse a field whose effective class rests `sealed` or `subject_sealed` and that `HasEncryptedFields` does not name (`credential_field_not_encrypted` for a credential, `classified_field_not_encrypted` otherwise), and a field whose class rests `subject_sealed` on a trait without `subject` (`classified_field_not_subject_sealed`).
- **AC-009**: WHEN gen checks an own model, THE gen full pass SHALL refuse a `@Classify` class that leaves an effect out (`data_class_effects_missing`), one looser than the field's `@Classified` class (`data_class_looser_than_classified`), and a model holding a field whose class's `retention` is `required` that declares no `Retention` (`classified_model_without_retention`).
- **AC-010**: WHEN gen reads a class extending `PersonalData` of `@stackra/privacy`, THE gen source reader SHALL read it as the `personal_data` kind with its constant `model`, `subject` and `fields`, and, for an own model, THE gen full pass SHALL refuse `personal_data_field_unknown`, `personal_data_credential_field`, `personal_data_looser_than_class`, `personal_data_shred_unsealed` and `personal_data_anonymise_not_nullable`, checking a declaration without `fields` on the fields its model's classes derive.
- **AC-011**: IF an encrypted field carries no `@Classified` class, THEN THE gen full pass SHALL refuse it (`encrypted_field_unclassified`), also when it carries a `@Classify` class, since the log redaction, the panel export and `changeCaptureOf` read only `@Classified` (review finding: accepting `@Classify` alone would let a decrypted sealed value reach a log line or an export in clear).

## Compatibility and migration

- **Product `DataClass` declarations** must add `encrypt`, `erasure`, `retention` and `mask` before upgrading; the type check and the factory refuse them otherwise. None exist in Figentra OS (checked 26 Nov on the local OS checkout).
- **`health` fields** must be encrypted and their model must declare `Retention`. None exist in this repository or in the OS checkout.
- **`regulated` fields** stay `clear`, so the six regulated fields in OS need no re-seal; a product that wants them sealed declares a stricter class.
- **`PersonalData` declarations** with explicit `fields` keep working; gen now refuses the errors AC-010 names, which were runtime failures or false receipts before.
- **Version bump**: minor, since `@stackra/*` is one fixed 0.x group; the changeset leads with a Breaking section.

## Risks

- `personal_data_anonymise_not_nullable` refuses a declaration that anonymises a field typed without `| null`; such a declaration failed at erasure time before (the column refuses null), so this moves the failure to build time.
- Gen reads a `@Classify` class's effects only from source it can see (own classes, or a package class whose `DataClass({...})` call it reads); a class it cannot read counts only through its `@Classified` code.
- The seeded `data-class` records and a tenant's tightening (ADR 0380 decisions 1 and 6) are not built; the table is code.

## Open questions

None.

## Status history

- 2026-11-26 → Clarified (the scope is the gov3 gap and owner decision 11; the audit's claim re-verified on origin/main: `DataClass` had four effects, gen did not read `PersonalData`)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built in the same branch; CTO approval of ADR 0540 pending)
- 2026-11-26 → Implementing (review fix: AC-011 reversed, `encrypted_field_unclassified` requires `@Classified` again)
