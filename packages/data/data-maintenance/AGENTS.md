<!-- Purpose: the agent rules of @stackra/data-maintenance: where code goes, entries, and the add-on rule. Boundary: documentation of packages/data/data-maintenance only. Runtime: none (Markdown). Governing contract: ADR 0462; ADR 0305. -->

# AGENTS — @stackra/data-maintenance

The add-on that holds the data layer's system jobs and their system-held permissions (ADR 0462 decision 1). Member at
`packages/data/data-maintenance` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.` and
`./node`.

## Where code goes

| You are writing…                     | It goes in…                                 |
| ------------------------------------ | ------------------------------------------- |
| A `Permissions` class                | `src/core/access/<model>.permissions.ts`    |
| A job (action), its input and output | `src/node/{actions,schemas}/`               |
| A CLI runner half                    | `src/node/functions/`                       |
| A port driver that names a job       | `src/node/drivers/`                         |
| A test                               | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/{core,node}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new public
  file to its barrel and to that entry's `index.test.ts`.
- `core` holds the permissions only and touches no database; `node` imports `core`.

## This package

- A job here is a thin call: the work stays in the lower package as an exported function, service or port method
  (`maintainAllPartitions`, `pruneAllRecords`, `rollUpAllTimeSeries`, `reindexSearch`, `reindexSemantic`, `ChangeFeed.maintain`,
  `pruneOutbox`, `PostgresSearchQueryLogDriver.store`). A lower driver that must queue a job here is abstract there,
  and its subclass here names the job (`QueuedSearchQueryLogDriver`). Never move the work up here, and never add an action to `@stackra/database`, `@stackra/search` or
  `@stackra/outbox`: they stay below `@stackra/iam`, which depends on database and (through scope) on outbox.
- This package depends on `@stackra/iam`, `@stackra/database`, `@stackra/search` and `@stackra/outbox`; none of them may
  ever depend on it.
- Every action declares its permission in a `Permissions` class here, system-held (`Permission.Lx.system()`): L4 when
  the job drops or deletes data, lower only for derived data. Never weaken gen's `permission_unknown`.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

None stored here. The jobs' audit entries hold table names, model names and counts only.
