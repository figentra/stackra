# AGENTS — @stackra/access-log

The `@AccessLogged` class facet, its Explorer, the hash-chained access-log sinks and the retention job (ADR 0212
decisions 3, 5 and 6). Member at `packages/security/access-log` (`tier:lib`), in the programming model v3.1 shape (ADR
0294, 0305). Entries `.`, `./contracts`, `./node`, `./testing`.

## Where code goes

| You are writing…                                  | It goes in…                                      |
| ------------------------------------------------- | ------------------------------------------------ |
| A port or a type the sinks exchange               | `src/contracts/{ports,types}/`                   |
| The configuration and its shape                   | `src/config/`, `src/core/schemas/`               |
| An isomorphic constant, function, driver, refusal | `src/core/{constants,functions,drivers,errors}/` |
| The facet                                         | `src/core/decorators/`                           |
| The model, its migration, a macro, a factory      | `src/node/models/`, `src/node/database/*/`       |
| A server driver, the job and its schemas          | `src/node/{drivers,actions,schemas}/`            |
| A fake or a matcher                               | `src/testing/`                                   |
| A label                                           | `assets/lang/{en,ar}/access_log.json`            |
| A test                                            | `__tests__/<name>.<kind>.test.ts` beside it      |

## Entries and barrels

- `src/{contracts,core,node,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- `contracts` is the leaf; `core` imports `contracts`; `node` imports both; `testing` imports them all. The factory lives
  in `src/node/database/factories/` and is exported from `./testing` only, so Faker never reaches a runtime entry.
- `DataClassification` and `Actor` are `@stackra/contracts`'; import them, never re-export them.

## This package

- The Explorer and gen must agree on what is wrapped: keep `node/__tests__/access-log.explorer.test.ts` (conformance
  through `discoverWithGen`) green when the wrapping rule changes.
- Every sink chains with `linkAccessRecord`, and `findChainBreak` is the one verifier; never hash a record another way.
- The table is tenant-owned through tenancy's trait and macro (ADR 0323 d1 allows the use); declare no `tenant`
  identifier here (R-59). The migration is a frozen snapshot: literals only, every column `.notNull()` or `.nullable()`
  with a `.comment()` equal to the model field's docblock, raw SQL only through `schema.sql(statement, { inverse })`.
- A sink failure is always logged as `access_log_write_failed`. It fails the logged call only for a class that fails
  closed: a classification in `AccessLogConfig.failClosed` (financial, health and regulated by default, configuration, never
  code) or a facet marked `failClosed: true` (a privileged surface). Every other read is served (ADR 0409).
- The `outbox` sink sends `AccessRecorded` events to the audit service, which chains them; it never chains itself.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                                | Where                                                  | Handling                                                                            |
| ----------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Actor id and its `onBehalfOf` chain | `AccessRecord.actor`, `access_log_entries.actor`       | Public ids only, written for audit; deleted by the purge job after `retentionDays`. |
| Subject ids                         | `AccessRecord.subjects`, `access_log_entries.subjects` | Public ids of the people whose data was read, never the data; same retention.       |
