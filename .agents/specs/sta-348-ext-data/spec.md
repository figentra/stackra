# Feature Specification: data packages, wave 10 extensions

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing (owner mode: develop now, test later; nothing run)

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Clarifications status**: open items below, for the owner

**Input**: the rows of `@stackra/database`, `model`, `search`, `storage`, `filesystem`, `media`, `assets` and `content`
in `notes/handover/stackra-package-needs.md`, plus the legal-hold registry port (homed in `@stackra/database`) and the
filesystem GCS driver.

## Impact

- **Packages touched**: `packages/data/{database,model,search,storage,filesystem,media,assets,content}`
- **Apps and services touched**: none
- **Tenancy and data**: one new migration, `content.0003_add_revision_schedule` (two nullable columns and an online
  index on `content.revisions`, expand-only). Holds, visibility and replica slices only narrow inside row-level
  security; none replaces it.
- **Secrets**: none read. The GCS and GuardDuty drivers use the cloud SDKs' default credentials; the embedder reads a
  token at call time from an environment variable whose name is configuration.
- **New dependencies**: `@google-cloud/storage` (filesystem GCS driver), referenced as `catalog:`; the integrator adds
  it to the default catalog.
- **Configuration, not code**: no country, provider or policy is chosen in code. Which disk, scanner and embedder run
  is runway's value per environment; the collation locale is a migration literal from the market pack; the replica
  dimension and value come from the module's declaration and the session; team membership for snippets is IAM's.
- **Lane**: lite. **Change risk**: R3 (purge semantics of `CrudService` change when a `HoldRegistry` is connected).

## Requirements

- **FR-001** `HoldRegistry` port (`@stackra/database/contracts`) with `Disposal`; `HoldSubscriber` refuses a unit-of-work
  delete of a held row with `RecordHeldError`; `CrudService.purge` removes only unheld rows; `disposableIds` serves
  retention jobs; `connectHoldRegistry` wires it (ADR 0134 amendment).
- **FR-002** ICU collations: `schema.createCollation(name, locale)` and `.collate(name)` on text columns.
- **FR-003** `visibleKeysQuery(model)`: the visibility subquery a raw-SQL ranker applies before scoring (ADR 0333).
- **FR-004** `@stackra/model`: `Commentable`, `HasAttachments`, `Taggable`, `HasCorrections` with `currentRows`,
  `Model.global`/`isGlobal`, `ModelAddition`, `DataClass`, `PrivilegedDataClass`, `@Classify`, the four effect enums,
  `@Meter` and `MeterKind`.
- **FR-005** `@stackra/search`: visibility before ranking, Arabizi alternatives, privileged-aware `snippets`,
  `Search.across`, `HttpEmbedderDriver` for an in-region endpoint.
- **FR-006** `@stackra/storage`: `SafeStoragePayloadSealDriver` (`./desktop`) and `sliceArea`.
- **FR-007** `@stackra/filesystem`: `GcsFileSystemDriver` and `filesystem.gcs`.
- **FR-008** `@stackra/media`: `FileScanner` (memory, clamav, guard_duty) with `media.scanner`/`media.clamav`;
  `ImageTransformer`, `TextExtractor`, `ContentCredentials` ports.
- **FR-009** `@stackra/assets`: data-asset `hash` and `version`, `AssetLibrary.verify` and `json`,
  `AssetHashMismatchError`.
- **FR-010** `@stackra/content`: `Publishable`, `Sluggable`, `Schedulable`, `PublicationStatus`, `isPublished`,
  `slugOf`, `RevisionService`, migration 0003.

## Open items (for the owner)

- Field-level permission in `@stackra/database` is not built: enforcement is IAM's (its row), and a database seam that
  masks fields on managed entities would flush the masked values. Confirm the seam belongs in the output layer.
- Gapless sequences: the remaining items of `sta-348-database` are gen's (registration, binding, the ADR 0342 checks)
  and a client-safe `formatSequenceNumber`; the time zone that governs a yearly series is still undecided.
- ADR 0321 names `@stackra/collaboration` as the owner of `Commentable` and `@stackra/database` of `Taggable`; the row
  asks for `@stackra/model`. The markers live in model (as `AppendOnly` and `SoftDeletes` do); behaviour stays with
  the owners.
- ADR 0341 says the effects of the six classes of ADR 0134 are set "in the change that ships `DataClass`"; their values
  are a policy decision, so only `privileged` ships.
- `AppendOnly` did not gain `corrects`: existing append-only tables would need a new column; `HasCorrections` is applied
  beside it instead.
- ADR 0336 writes `ModelAddition(Product)({ ... })` but defines no options; the factory takes the base only.
- "Global indexes" was read as cross-model search (`Search.across`); a global model's own table needs no change.
- ADR 0221's 2026-10-24 note moves Arabic normalisation to `normalizeArabic` of `@stackra/i18n`; search still uses its
  own normaliser, which its SQL folding function mirrors; switching both is a separate, index-rebuilding change.
- The OCR, image and C2PA engines are ports only; a driver for each needs a provider choice (and for C2PA a signing
  certificate) from the owner.

## Status history

- 2026-10-25 · — → Implementing · Claude (data-engineer) · wave 10 extensions written; owner mode, nothing run
