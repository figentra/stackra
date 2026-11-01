# Implementation Plan: the Temporal driver behind the workflow port

**Spec**: `.agents/specs/sta-1817-temporal-driver/spec.md` · **Linear**: STA-1817 · **Branch**:
`figentra/sta-1817-temporal-driver`

Full lane (ADR 0120 D8): this design pull request (spec, plan, then tasks and analyze), then one pull request per user
story. Nothing below is built until the owner rules on the open questions and the ADR of OQ-9 is accepted.

## Design

### Executor and record

| Concern                   | Native driver                     | Temporal driver                                                              |
| ------------------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| Who decides the next step | `tick` over `WorkflowJournal.due` | the `stackra.run` interpreter in Temporal                                    |
| Where step work runs      | the engine's process              | the member's Temporal worker, activity `stackra.step`                        |
| Run and step rows         | `WorkflowJournal`                 | the same journal, written by each activity in its transaction                |
| Operations and listings   | journal                           | journal (`find`, `last`, `byAutomation`); `cancel` also cancels in Temporal  |
| Lifecycle events          | `end` after the row commits       | the same `end`, called from the closing activity                             |
| One runner per run        | `Locks` `workflow.run:<id>`       | Temporal's single execution per workflow id; the lock is not taken           |
| Worker loop               | `work` ticks                      | `work` runs a Temporal `Worker` on `stackra.<member>` until the abort signal |

### Mapping

| Stackra (ADR 0152, 0294)                    | Temporal                                                                                      |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| a run                                       | one execution of `stackra.run`, workflow id = run public id (or `<key>:<correlation>`)        |
| a step                                      | activity `stackra.step`; `when`, `correlate`, plan capture are local activities               |
| `retry` attempts and backoff                | activity retry off; interpreter retries with `sleep(backoffDelay(JOB_BACKOFF, n))`            |
| step `timeout`, `heartbeat`, `ctx.progress` | `startToCloseTimeout`, `heartbeatTimeout`, heartbeat details read back on the next attempt    |
| `waitFor` signal or event, `correlate`      | `workflow.waits` row, then `take`; signal `stackra.wake` delivered by the outbox after commit |
| wait `timeout`, run `timeout`               | a timer raced with the wake; a run timer in a cancellation scope, then compensation           |
| `undo<Step>` compensation                   | `stackra.undo` activities, completed steps last first                                         |
| `cancel`                                    | `handle.cancel()`; interpreter ends `cancelled`, undoes nothing                               |
| version pin (`Workflow({ version })`)       | plan and class by key and version, fixed at start; interpreter changes behind `patched()`     |
| `ctx.run` inside a step                     | an independent execution with the step key as its parent call id; no Temporal child workflow  |
| for-each, chain depth                       | keyed calls inside one step attempt, unchanged; chain read from the run input, unchanged      |
| `run` resolves on park                      | update-with-start (OQ-5)                                                                      |
| payloads                                    | a payload codec keyed by `TEMPORAL_PAYLOAD_KEY` (FR-016)                                      |

### Code placement

- Free, this repository, `packages/runtime/workflow`: `src/core/ports/workflow-engine.port.ts`,
  `src/core/types/workflow-engine-names.type.ts`, `src/core/constants/workflow-engines.constant.ts`, the `engine` field
  in `workflow-engine-options.schema.ts` and `workflow-config-schema.constant.ts`, and the suite in
  `src/testing/functions/run-workflow-conformance.function.ts` with its cases in `src/testing/constants/`.
- Free, `packages/developer/runway`: `RequirementEngine.Temporal` and its environment values.
- Pro, `figentra/stackra-pro`, `@stackra-pro/workflow-temporal`: `src/node/drivers/temporal-workflow-engine.driver.ts`,
  the interpreter (`src/node/workflows/stackra-run.workflow-bundle.ts`, the only file Temporal bundles), the activities,
  the payload codec, its `TemporalConfig` (`address`, `namespace`, `taskQueuePrefix`) and the conformance test.

### Phases (one pull request each)

| Phase | User story | What                                                                               | Gate                      |
| ----- | ---------- | ---------------------------------------------------------------------------------- | ------------------------- |
| 1     | US1        | `WorkflowEngine` port, engine names, `workflow.engine`, the suite, native passes   | workflow tests            |
| 2     | US5        | runway `temporal` engine, air-gapped refusal, boot error naming the package        | runway and workflow tests |
| 3     | US2        | Pro driver: interpreter, activities, waits registry, codec; suite in time skipping | Pro repo gates            |
| 4     | US4        | operations through the port, spans, metrics, search attributes                     | Pro repo gates            |
| 5     | US3        | example workflows for the business cases as suite-backed samples                   | Pro repo gates            |

## Properties

- **P-001** (Validates: FR-001) Every operation a host or the explorer calls on the engine is on the port, and native implements it unchanged.
- **P-002** (Validates: FR-002, FR-019) `workflow.engine` defaults to `native`, takes a registered name and refuses another.
- **P-003** (Validates: FR-003, FR-004) The suite is framework-free, reports per-case mismatches, and covers the listed semantics.
- **P-004** (Validates: FR-005) Native on the memory journal has no mismatch.
- **P-005** (Validates: FR-006) Module code and the driver's public types carry no Temporal symbol.
- **P-006** (Validates: FR-007, FR-013) A run is one `stackra.run` execution whose plan is captured once; replay reads no code.
- **P-007** (Validates: FR-008) A step activity builds the native `StepContext` and runs in `CallIsolation` as the origin actor in its scope, writing its row in the same transaction.
- **P-008** (Validates: FR-009) Retries, timeouts, heartbeats and progress match native on the suite.
- **P-009** (Validates: FR-010) Waits keep early-signal and rollback semantics and time out with `workflow_timed_out`.
- **P-010** (Validates: FR-011, FR-012) Run timeout compensates; compensation is last first; cancel undoes nothing.
- **P-011** (Validates: FR-014) Duplicate starts and re-run activities have no second effect.
- **P-012** (Validates: FR-015) `run` resolves on completion or first park.
- **P-013** (Validates: FR-016) No plain payload leaves the process; failures carry code and message only.
- **P-014** (Validates: FR-017) Spans, metrics and search attributes as stated, with no PII.
- **P-015** (Validates: FR-018) The Temporal driver passes the full suite in time skipping.
- **P-016** (Validates: FR-020) Runway accepts `temporal` outside air-gapped and places its worker.

## Constitution Check

| Law                         | Result | Note                                                                                 |
| --------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Boundaries (ADR 0003)       | PASS   | no member here imports `@stackra-pro/*`; the driver depends on free packages only    |
| Module boundary and entries | PASS   | the port in `core`, the suite in `testing`; `testing` imports core                   |
| Tenancy (ADR 0495)          | PASS   | every activity runs in `CallIsolation` as the stored actor and scope                 |
| Secrets (ADR 0173)          | PASS   | names only in `runway.yaml`; values from Infisical, set by a human                   |
| Not built yet (ADR 0227)    | PASS   | Temporal is not listed; it is the Pro driver of ADR 0151                             |
| Versions and catalogs       | PASS   | no catalog change here; `@temporalio/*` waits for owner approval (OQ-3), Pro catalog |
| Test placement (ADR 0022)   | PASS   | `src/**/__tests__/` in both repositories                                             |
| Naming (ADR 0231, 0294)     | PASS   | `WorkflowEngine` port, `TemporalWorkflowEngineDriver`, no Guard, Gate or Hook words  |
| ADR first                   | PASS   | phase 1 starts after the ADR of OQ-9 is accepted                                     |

## Deploy modes

| Mode       | Result                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------- |
| SaaS       | native by default; Temporal Cloud per environment and region when the member's runway says so |
| on-prem    | native by default; self-hosted Temporal optional, outside the ADR 0179 minimum footprint      |
| air-gapped | native only; runway refuses the `temporal` engine and the bundle carries no `@temporalio/*`   |

## Testing

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session. The free suite runs in
`@stackra/workflow`'s vitest on the memory journal. The Pro driver runs the same suite in
`TestWorkflowEnvironment.createTimeSkipping()`; its test-server binary is cached in CI so the job needs no download at
run time. Postgres-backed cases use the repository's disposable Postgres, as the Postgres journal's tests do.
