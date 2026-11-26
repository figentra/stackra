---
"@stackra/contracts": minor
"@stackra/model": minor
"@stackra/privacy": minor
"@stackra/gen": minor
---

**Breaking: a data class now sets eight effects, and gen checks every field against its class.** Every `@stackra/*` package shares one fixed 0.x version, so this ships as a minor bump, but it **breaks a product that declares its own `DataClass` or holds a `health` field** until it adopts it (ADR 0540):

1. **Give every `DataClass({ ... })` the four keeping effects**: `encrypt` (`FieldEncryption`), `erasure` (`SubjectErasure`), `retention` (`RetentionBound`) and `mask` (`MaskMethod`), all exported by `@stackra/model`. A class without them fails to type-check and `DataClass` throws a `RangeError` when it loads.
2. **Seal and bound every `health` field.** A `@Classified(DataClassification.Health)` field must be named by its model's `HasEncryptedFields`, and the model must declare `Retention({ keep, basis, policy })`.
3. **Fix what gen now names in `PersonalData` declarations** (see Breaking).

### Breaking

- `DataClassOptions` requires `encrypt`, `erasure`, `retention` and `mask`; `DataClass` refuses a missing or unknown code.
- Gen (full pass) refuses `classified_field_not_encrypted` and `classified_field_not_subject_sealed` (a field whose class rests `sealed` or `subject_sealed` and `HasEncryptedFields` does not give it), `data_class_effects_missing`, `data_class_looser_than_classified` (a `@Classify` class looser than the `@Classified` class on the same field) and `classified_model_without_retention`.
- Gen now reads `PersonalData` declarations (kind `personal_data`, file `<model>.personal-data.ts`) of the member's own models and refuses `personal_data_field_unknown`, `personal_data_credential_field`, `personal_data_looser_than_class`, `personal_data_shred_unsealed` (the build-time form of the erasure's own refusal) and `personal_data_anonymise_not_nullable` (erasure writes null, so the field must be `| null`).
- `EraseSubjectWorkflow` refuses to erase anything while a declared method is weaker than its field's data class.

**What changed.**

- **One table** (`@stackra/contracts`): `DATA_CLASSIFICATION_EFFECTS` gives each `DataClassification` code its eight effects (`DataClassEffects`); `DATA_CLASS_EFFECT_RANKS` orders each effect's codes; `loosenedEffects` and `strictestEffects` compare two classes. `personal`, `financial`, `pseudonymous` and `regulated` rest in clear and anonymise; `health` rests sealed, needs `Retention` and masks to null; `credential` rests sealed, is never exported and stays out of a subject's erasure.
- **One field class** (`@stackra/model`): `builtInDataClass(code)` is the table's row as a data class; `fieldDataClasses(Model)` gives each classified field its one class (the stricter of `@Classify` and `@Classified` per effect); `maskOf(Model)` gives each field's mask method for a masked copy. `PrivilegedDataClass` keeps its fields out of erasure and masked copies; `CredentialDataClass` equals the table's `credential` row.
- **`PersonalData` derived** (`@stackra/privacy`): `PersonalData({ model, subject })` may leave `fields` out; `personalDataDeclarations` then takes every classified field whose class erases, with its method. A `@Classify(CredentialDataClass)` field is dropped like a `@Classified` credential. `looserErasureFields` names a declared method weaker than its field's class.
- **Gen** reads a field's class with `fieldDataClassOf`; `encrypted_field_unclassified` now accepts a `@Classify` class as the classification.
