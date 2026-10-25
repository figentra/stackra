# AGENTS — @stackra/search

Hybrid search over a model's `@Searchable` index: the `SearchDriver` port, the `Search` reader, the memory and
Postgres drivers, the `t.searchable(...)` macro and the text-function migration (ADR 0221). Member at
`packages/data/search` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./node`.

## Where code goes

| You are writing…                         | It goes in…                                               |
| ---------------------------------------- | --------------------------------------------------------- |
| The configuration (`SearchConfig`)       | `src/config/search.config.ts`                             |
| Its options shape                        | `src/core/schemas/search-options.schema.ts`               |
| Its shipped zod schema (`SearchConfig$`) | `src/core/constants/search-config-schema.constant.ts`     |
| The port or a type it uses               | `src/contracts/{ports,types}/`                            |
| An isomorphic driver, function, refusal  | `src/core/{drivers,functions,errors}/`                    |
| A server driver                          | `src/node/drivers/`                                       |
| The outbox change consumer               | `src/node/services/searchable-change.service.ts`          |
| A migration macro                        | `src/node/database/macros/<name>.macro.ts`                |
| A migration                              | `src/node/database/migrations/<NNNN>-<name>.migration.ts` |
| A test                                   | `__tests__/<name>.<kind>.test.ts` beside it               |

## Entries and barrels

- `src/{core,contracts,node}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` and `node` import it through `#contracts/index`.
- `SearchConfig$` mirrors `SearchOptions` by hand until gen compiles this package's schemas; change both together.
- `SEARCH_DRIVERS` names each driver by its file prefix; a new driver adds its name there.
- `src/node/types/searchable-blueprint.type.ts` stands in for the `Blueprint` merge gen writes from the macro; keep its
  signature equal to `SearchableMacro.apply`'s.

## This package

- One normalisation: `searchWordsOf` for documents and phrases, and `search.unaccent_immutable` in the migration for
  the trigram index. Change the two together; a released migration is frozen, so a change is a new migration.
- Automatic indexing goes through `@stackra/outbox` only (`registerSearchableModels`); outbox must never depend on
  search. `SEARCHABLE_MODELS` stays internal.
- Drivers deal in ids and documents; only `SearchIndex` and `SearchableChangeService` (one row load) touch the ORM. Isolation is the database's: never add a
  scope filter in application code (ADR 0327 d9).
- Record visibility is the one narrowing a search adds, and it goes in before ranking: `SearchIndex` passes
  `visibleKeysQuery`'s subquery as `SearchRequest.visible`, and a driver applies it in every lane or refuses (ADR 0333).
- Snippets read the field's data class: a `no_snippet` field is excerpted only when the caller says the user is on the
  record's team; team membership is IAM's answer, never decided here (ADR 0341).
- Raw SQL only in `PostgresSearchDriver`, every value bound, identifiers quoted, configuration names from
  `TEXT_SEARCH_CONFIGS`, each statement with a `// raw-sql:` reason (ADR 0160).
- Extensions only through `schema.createExtension` from the approved list (ADR 0160, ADR 0334 rule 3): no `unaccent`.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data           | Where                                           | Handling                                                                                        |
| -------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Indexed text   | the model table's search columns, memory driver | Copies of the facet's text fields; `remove` clears them on erasure; ADR 0134 decides the fields |
| Search phrases | `SearchRequest.words`                           | Passed to the engine as bound parameters; never stored or logged here                           |
