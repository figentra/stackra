# AGENTS — @stackra/workflow

Durable workflows: the `Workflow` and `Signal` kind bases, `@Step`, `Run<W>` and `StepContext`, the native engine (the
`WorkflowRunner` driver behind `ctx.run` and `ctx.signal`), the `WorkflowJournal` port with memory and Postgres
journals, the boot explorer and the in-process test driver (ADR 0101, 0102, 0151, 0152, 0292). Member at
`packages/runtime/workflow` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./node`,
`./testing`.

## Where code goes

| You are writing…                           | It goes in…                                               |
| ------------------------------------------ | --------------------------------------------------------- |
| The configuration (`WorkflowConfig`)       | `src/config/workflow.config.ts`                           |
| Its options shape                          | `src/core/schemas/workflow-engine-options.schema.ts`      |
| Its shipped zod schema (`WorkflowConfig$`) | `src/core/constants/workflow-config-schema.constant.ts`   |
| A kind base, the decorator, an enum        | `src/core/{bases,decorators,enums}/`                      |
| The journal port, a record type            | `src/core/{ports,types}/`                                 |
| The engine or the memory journal           | `src/core/drivers/`                                       |
| Plans, keys, ids, correlation              | `src/core/functions/`, `src/core/constants/`              |
| The Postgres journal, the explorer         | `src/node/drivers/`, `src/node/workflow.explorer.ts`      |
| A migration                                | `src/node/database/migrations/<NNNN>-<name>.migration.ts` |
| The test driver                            | `src/testing/{constants,functions,types}/`                |
| A building-block, document or pack piece   | `src/core/{constants,enums,errors,functions,types}/`      |
| The automation model, its service          | `src/node/{models,services,types}/`                       |
| A test                                     | `__tests__/<name>.<kind>.test.ts` beside it               |

## Entries and barrels

- `src/{core,node,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- There is no `./contracts`: the template imports `StepStatus` and `WorkflowRunStatus` from `.`, and the journal port
  and records name them, so the port sits in `src/core/ports/` beside the engine (one symbol, one entry).
- `WorkflowConfig$` mirrors `WorkflowEngineOptions` by hand until gen compiles this package's schemas; change both.
- `WORKFLOW_JOURNALS` names each journal driver by its file prefix (`postgres`, `memory`).

## This package

- A kind base assigns no fields in its constructor (ADR 0294 decision 25). `Run<W>` keeps its conditionals on the naked
  `W`, or `Run<this>` stops resolving inside a class (STA-335 spike).
- `@Step` records only (`createDecorator`); `planOf` reads it with `Step.members` and checks every option once per
  class. The explorer plans every built workflow at boot, so a bad plan fails there.
- The engine writes the journal only inside `WorkflowJournal.transaction` (a new transaction in the run's scope), so a
  run's progress commits whatever the calling action does; `hold` and `currentScope` join the caller's transaction.
- One runner per run (`Locks`, key `workflow.run:<id>`). A tick takes over a running or compensating run only when its
  lock is free, and counts only runs it really advanced, so an idle worker pauses.
- A step's integration events go to `EventOutbox` in its transaction; its domain events to `EventBus` after the commit.
  Their metadata is picked field by field (`metaOf`): the origin's scope id goes in the events envelope's scope field,
  and no `scope` key or other origin field leaks into it. Read the call's `scope`, never its `tenantId`.
- Raw SQL only in the Postgres journal, every value bound, every row read through zod, each statement with a
  `// raw-sql:` reason (ADR 0160). A released migration is frozen; a change is a new migration.
- No tenant word is declared here (final review R-59, ADR 0323): a scope is a `ScopeRef`. "Guard" in the engine is an
  attempt's abort signal, never a precondition (ADR 0294 decision 23).
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.
- An automation or a plan is data that references registered blocks (ADR 0122, 0154): no expression, template or
  `eval`; a reference is `{ "$ref": "<root>.<path>" }` walked over own properties. Conditions are `@stackra/rules`
  conditions, never a second evaluator (ADR 0331 decision 1).
- A document run keeps its document in `workflow.runs.input`; a coded run resumes only on the class of its pinned
  version (`WORKFLOW_KEYS.versions`).
- Seeds never overwrite an automation whose latest revision is the tenant's.
- An automation's grants never exceed its publisher's: `PublisherAccess` is asked at publish and before each trigger
  starts it; a lost block pauses it (ADR 0423). Never skip the check for a seed: its publisher is the seed principal.
- Checklist steps, lock flags and industry profiles are seed data; no step is coded here. A customization never hides
  or reorders a locked step (ADR 0424).
- `ServiceAckSet` is platform data with no scope policy, like the journal; `expect` runs before the request leaves.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data          | Where                                                 | Handling                                                                               |
| ------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Run input     | `workflow.runs.input` (jsonb), memory journal         | The action's validated input as its author declared it; never logged                   |
| Step results  | `workflow.steps.result`, `progress` (jsonb)           | What each step returned or reported; read back by later steps                          |
| Caller        | `workflow.runs.origin` (jsonb)                        | Public ids and kinds of the caller, the call id, key and scope, locale and market      |
| Signal fields | `workflow.signals.payload` (jsonb)                    | The sender's payload; deleted when taken, dropped after seven days untaken             |
| Failures      | `workflow.runs.error`, `workflow.steps.error` (jsonb) | The refusal code (`internal` otherwise) and message; never a stack or the step's input |
| Documents     | `content.revisions.data`, `workflow.runs.input`       | Scope configuration; inputs may hold literal values (a phone, a text); never logged    |
| Principal     | `workflow.automations.principal`, `publisher` (jsonb) | The actor kind and public id an automation runs as, and who published it               |
| Progress      | `workflow.checklist_progress` (owner, completed by)   | A user's public id and the completing actor; read only by the scope's own sessions     |
| Held events   | `workflow.signals.payload` (jsonb)                    | A waitable trigger's occurrence, dropped after seven days untaken                      |
