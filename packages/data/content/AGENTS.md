# AGENTS — @stackra/content

The built-in content entry types and bounded custom fields that are data only (ADR 0116, ADR 0154, ADR 0226). Member
at `packages/data/content` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.` and
`./node`.

## Where code goes

| You are writing…               | It goes in…                                               |
| ------------------------------ | --------------------------------------------------------- |
| An enum                        | `src/core/enums/<name>.enum.ts`                           |
| A public type                  | `src/core/types/<name>.type.ts`                           |
| An isomorphic check, a refusal | `src/core/{functions,errors}/`                            |
| An internal schema             | `src/core/constants/<name>-schema.constant.ts`            |
| A model, its service           | `src/node/{models,services}/`                             |
| A trait                        | `src/node/traits/<name>.trait.ts`                         |
| A migration                    | `src/node/database/migrations/<NNNN>-<name>.migration.ts` |
| An entitlement                 | `src/node/access/<name>.entitlement.ts`                   |
| A test                         | `__tests__/<name>.<kind>.test.ts` beside it               |

## Entries and barrels

- `src/{core,node}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new public
  file to its barrel and to that entry's `index.test.ts`.
- `.` stays isomorphic: nothing under `src/core/` imports @stackra/model, @stackra/database or a Node API, because web
  apps import `ContentEntryType`. `node` imports `core` through `#core/index`.
- A `./react` entry is added only once React code exists; an entry exists once its folder has a file.

## This package

- Data only (ADR 0154): a definition never holds an expression, a function or a template. The definition schema is
  strict; a new field type is a case of `CustomFieldType` plus a branch of `checkCustomFields`, never stored data.
- Field error codes are snake_case (zod's issue code or the refinement's message) and never echo a refused value.
- No tenant vocabulary (R-59, ADR 0323): every table is keyed by the contracts `ScopeRef`.
- `CustomFieldService` keeps the explicit `ScopeRef` argument first; when it is left out the scope is the call's
  (`RequestContext.current().scope`), never request input.
- A revision's `data` is written once; a change is a new revision, never an update of `data`.
- Isolation is the database's: never add an application-level `WHERE` filter for isolation; selecting `scopeId` picks
  the node whose definitions apply.
- Migrations are frozen literal snapshots that import only @stackra/database.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data          | Where                                       | Handling                                                                         |
| ------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| Field labels  | `content.custom_fields.label`               | Configuration text, not personal data.                                           |
| Custom values | `content.custom_field_value_sets.values`    | A scope's data of any kind, possibly personal; never logged, never in a refusal. |
| Record id     | `content.custom_field_value_sets.record_id` | A public id; not personal on its own.                                            |
| Revision data | `content.revisions.data`                    | A snapshot of the owning package's record, possibly personal; never logged.      |
