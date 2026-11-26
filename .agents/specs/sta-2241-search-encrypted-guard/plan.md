# Implementation Plan: a field that rests encrypted is never indexed by search

**Spec**: `.agents/specs/sta-2241-search-encrypted-guard/spec.md` · **Linear**: STA-2241 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2241-search-encrypted-guard/spec.md`

## Summary

Two guards, one rule. Gen's new `checkSearchableEncrypted` refuses `searchable_field_encrypted` when an own model's
`@Searchable` text, filter, sortable or range path ends at a `HasEncryptedFields` field, following own base models and
relations to own models as `checkSemanticSearch` does. `@stackra/search`'s new `refuseEncryptedSearchPath` refuses the
same at runtime on the loaded row and every owner its relations reach; `searchDocumentOf` (and so indexing and the
semantic passage) and `SearchIndex.snippets` call it before reading a value.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `@stackra/gen` (developer), `@stackra/search` (data), `@stackra/model` (data, doc only)
- **Testing**: vitest in `src/**/__tests__/`, on CI
- **Storage**: none
- **Runtime target**: any service with `@Searchable` models

## Constitution Check

| Law                                   | Result | Note                                                                  |
| ------------------------------------- | ------ | --------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | search reads `encryptedFieldsOf` from `@stackra/model`, as before     |
| Secrets (ADR 0009)                    | N/A    | none                                                                  |
| Security                              | PASS   | closes a plain-text leak of encrypted fields into the index and AI    |
| HTTP and events                       | N/A    | none                                                                  |
| Tenancy                               | N/A    | none                                                                  |
| Delegation                            | PASS   | Claude only                                                           |
| Not built yet (ADR 0011)              | PASS   | nothing new beyond the guards                                         |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                                 |
| Versions and catalogs                 | PASS   | a changeset: gen and search minor, model patch                        |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                     |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                             |
| Docs and ADRs                         | PASS   | gen README and AGENTS.md, search README, the trait's contract; no ADR |

## Deploy modes

| Mode       | Behaviour                                                      |
| ---------- | -------------------------------------------------------------- |
| SaaS       | an encrypted field never reaches the search index or embedder  |
| On-prem    | an encrypted field never reaches the search index or embedder  |
| Air-gapped | an encrypted field never reaches the search index; no embedder |

## Correctness properties

- **P-001**: a facet text path to an encrypted field yields exactly one `searchable_field_encrypted Patient.diagnosis`
  with the file and a fix naming the path and the `lookup` alternative — Validates: AC-001
- **P-002**: filter, sortable and range paths each refuse once (a path in two lists once), after an options argument —
  Validates: AC-001, AC-002
- **P-003**: an own base model's encrypted field and `allergies.reaction` through an own relation refuse; plain
  fields, a facet-less encrypted model and a path through an unknown relation pass — Validates: AC-002
- **P-004**: `generateMember` returns no files and the code — Validates: AC-003
- **P-005**: `refuseEncryptedSearchPath` throws on the row's own field, through a relation, on a subclass; passes plain
  fields and an empty relation — Validates: AC-004
- **P-006**: `searchDocumentOf` throws for each of text, filters, sortable and ranges, and still builds the document of
  plain fields — Validates: AC-004
- **P-007**: `semanticPassageOf` throws over an encrypted relation path — Validates: AC-005
- **P-008**: `SearchIndex.index` rejects with the driver's `index` never called; `snippets` throws — Validates: AC-006

## Architecture overview

`EncryptedFieldsSubscriber` opens encrypted fields on load, so every reader of a loaded row sees plain text. The search
package's readers of a row all start from the facet's paths: `searchDocumentOf` (documents; `semanticPassageOf` builds
on it) and `SearchIndex.snippets`. Each now puts every path through `refuseEncryptedSearchPath` first. Gen refuses the
same statically, so a service learns at `stackra gen`, not at its first write.

## Components and responsibilities

- `refuseEncryptedSearchPath` (`packages/data/search/src/core/functions/refuse-encrypted-search-path.function.ts`):
  walks the path's owners through `searchValuesAt` and throws when `encryptedFieldsOf(owner.constructor)` names the
  last segment.
- `searchDocumentOf`: guards text, filters, sortable and ranges before reading.
- `SearchIndex.snippets`: guards each own text path before excerpting.
- `checkSearchableEncrypted` (`packages/developer/gen/src/core/functions/check-searchable-encrypted.function.ts`): the
  static refusal; `generateMember` runs it in the full pass beside `checkSearchableDrift`.

## Files and folders

```text
packages/data/search/
  src/core/functions/refuse-encrypted-search-path.function.ts
  src/core/functions/__tests__/refuse-encrypted-search-path.function.test.ts
  src/core/functions/search-document-of.function.ts
  src/core/values/search-index.value.ts
  src/core/values/__tests__/search-index.value.test.ts
  README.md
packages/developer/gen/
  src/core/functions/check-searchable-encrypted.function.ts
  src/core/functions/__tests__/check-searchable-encrypted.function.test.ts
  src/core/functions/generate-member.function.ts
  README.md
  AGENTS.md
packages/data/model/src/core/traits/has-encrypted-fields.trait.ts
.changeset/searchable-field-encrypted.md
```

## Data models and migrations

none

## Contracts

A new gen refusal code, `searchable_field_encrypted`, on the full pass. `searchDocumentOf`, `semanticPassageOf` and
`SearchIndex.snippets` document a new `TypeError` for an encrypted path. No export changes.

## Error handling

The runtime refusal is a `TypeError` (a code mistake, like the semantic guard's `searchable_semantic_ai_never`) whose
message starts with the gen code and names the row's model, the path and the owner model that encrypts it.

## Security and tenancy

The guard closes the plain-text path from an encrypted column to the search index, the embedder and snippets. It reads
the trait registry only. No tenancy change.

## Testing strategy

- AC-001 to AC-003: `check-searchable-encrypted.function.test.ts`, six cases over fixture IR.
- AC-004, AC-005: `refuse-encrypted-search-path.function.test.ts`, seven cases over model instances.
- AC-006: `search-index.value.test.ts`, one case with a spied memory driver.
- Revert check: with the wiring in `searchDocumentOf`, `SearchIndex` and `generateMember` stashed, four of these cases
  fail; restored, all pass.

## Rollout

Minor for gen and search, patch for model (fixed group). A service picks the refusal up on its next `stackra gen`.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: a new blocking refusal; no service in this repository trips it.

## ADRs

ADR 0465 (decision 5), implemented as written. ADR 0294 (decision 22: a refusal carries its fix; decision 27).
ADR 0221, ADR 0380 (decision 3). ADR 0502 sets this spec's tier.

## Docs

`packages/developer/gen/README.md`, `packages/developer/gen/AGENTS.md`, `packages/data/search/README.md`, the
`HasEncryptedFields` file contract, the changeset.

## Complexity tracking

none
