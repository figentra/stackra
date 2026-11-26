# Feature Specification: a field that rests encrypted is never indexed by search

**Feature Branch**: `figentra/sta-2241-search-encrypted-guard`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: the CTO (technical-only stop; the approval is recorded by the CTO, not by this branch)

**Linear**: STA-2241

**Clarifications status**: complete

**Input**: STA-2241 acceptance item 3, "Encrypted fields are excluded from search indexes and AI context by data
class", and the Stackra production-readiness audit of 26 Nov (batch 10, item 10.4). The rest of STA-2241 is already on
main: the `FieldCipher` port and its AES-256-GCM driver in `@stackra/contracts`, the key providers (`AwsKmsKeyProvider`,
the tenancy KMS driver of ADR 0415, `MemoryKeyProvider`), `HasEncryptedFields` with `EncryptedFieldsSubscriber` in
`@stackra/model`, gen's `FieldCipher` binding (STA-2677) and the no-downtime reseal (`EncryptedFieldsResealService`).
The gap: nothing stopped a `@Searchable` path from ending at an encrypted field. The subscriber opens the field on load,
so `searchDocumentOf` read its plain text into the search columns, the semantic passage handed it to the embedder (AI
context) and `SearchIndex.snippets` excerpted it.

### Sources

- STA-2241 (acceptance item 3) and its 26 Nov agent check comments
- `packages/data/search/src/core/functions/search-document-of.function.ts`, `semantic-passage-of.function.ts`,
  `search-values-at.function.ts`, `packages/data/search/src/core/values/search-index.value.ts`
- `packages/data/model/src/core/traits/has-encrypted-fields.trait.ts`, `encrypted-fields-of.function.ts`
- `packages/developer/gen/src/core/functions/check-semantic-search.function.ts` (the path walk this check follows),
  `check-encrypted-fields.function.ts`, `generate-member.function.ts`
- ADR 0465 (decision 5: the model encryption path), ADR 0294 (decisions 22 and 27), ADR 0221, ADR 0380 (decision 3)

## Impact

- **Apps touched**: none
- **Services touched**: none in this repository; a service whose `@Searchable` reads an encrypted field is refused on
  its next `stackra gen` and at index time (none in this repository does)
- **Packages touched**: `@stackra/gen` (new refusal `searchable_field_encrypted`), `@stackra/search` (runtime guard in
  documents, semantic passages and snippets), `@stackra/model` (the trait's file contract names the refusal)
- **Public contract change**: a new gen refusal code, `searchable_field_encrypted`, which blocks the full pass;
  `searchDocumentOf`, `semanticPassageOf` and `SearchIndex.snippets` now throw a `TypeError` naming that code for such
  a path. No export is added, removed or renamed (`refuseEncryptedSearchPath` and `checkSearchableEncrypted` are
  internal to their packages)
- **Cross-service events**: none
- **Tenancy and data**: none; no table, column or migration changes
- **Security and privacy**: closes a leak of special-category data (medical, ID numbers) from encrypted columns into the
  search index, the embedder and result snippets. The guard reads the trait registry only, never a value
- **Secrets**: none
- **ADR needed**: no (implements ADR 0465 decision 5 and the `HasEncryptedFields` contract "cannot be searched")
- **New dependencies**: none (`@stackra/search` already depends on `@stackra/model`)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/gen/README.md`, `packages/developer/gen/AGENTS.md`,
  `packages/data/search/README.md`, the `HasEncryptedFields` file contract, the changeset
- **Lane**: full
- **Change risk**: R2 (a new blocking gen refusal; a service that indexes an encrypted field stops generating until the
  path is dropped)

## Acceptance criteria

- **AC-001**: WHEN a facet path ends at an encrypted field THE generator SHALL refuse `searchable_field_encrypted`: an own model's `@Searchable` text, filter, sortable or range path that ends at a field `HasEncryptedFields` names is refused as `<Model>.<path>`, with a fix that drops the path and points at `HasEncryptedFields({ lookup })` and `whereEncrypted`.
- **AC-002**: THE refusal SHALL follow a field an own base model encrypts, the trait's options argument, and a dotted
  path through a relation to an own model; a plain field, a model without the facet and a path that leaves the member's
  models SHALL pass.
- **AC-003**: THE `generateMember` full pass SHALL return no files when the refusal fires.
- **AC-004**: WHEN a document path ends at an encrypted field THE search package SHALL throw a `TypeError` naming `searchable_field_encrypted` from `searchDocumentOf` before any value is read, for a text, filter, sortable or range path on the row or any owner its populated relations reach; an empty relation SHALL pass.
- **AC-005**: THE semantic passage (`semanticPassageOf`) SHALL refuse the same, so an encrypted field never reaches an
  embedder.
- **AC-006**: WHEN `SearchIndex.index` meets such a row THE index SHALL reject and SHALL hand the driver no document;
  `SearchIndex.snippets` SHALL throw rather than excerpt the field.

## Compatibility and migration

- A service whose facet reads an encrypted field stops generating with `searchable_field_encrypted`. The fix is to drop
  the path; a lookup by value moves to a `lookup` field and `whereEncrypted`. No data migration: search columns already
  holding plain text are rebuilt by `stackra search:reindex <Model>` after the path is dropped.
- Not staged (`STAGED_REFUSAL_CODES` is unchanged): it is a privacy floor, like `searchable_semantic_ai_never`.

## Risks

- A package model's encrypted field is not visible to gen; the runtime guard refuses it at index time instead, which
  fails the write that triggers indexing (fail closed).
- A `when` path is not checked: it is evaluated in memory and never stored.

## Status history

- 2026-11-26 → Clarified (STA-2241 acceptance item 3; the gap confirmed on stackra origin/main 512397e4e)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built in the same branch; awaiting the CTO's approval)
