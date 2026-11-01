# Specification: one inspectable trace per agent run

**Feature Branch**: `figentra/sta-1816-ai-run-trace`

**Created**: 2026-11-01

**Status**: Draft

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1816

**Clarifications status**: complete

The spec's own ambiguities are resolved below. What remains are owner decisions (Open questions), each with a
proposed answer; the spec stays Draft until the owner answers them, then moves to Clarified.

**Input**: the lead's brief of 2026-11-01: for every agent run (a sidekick turn, an MCP tool call chain, a background
agent, an A2A task) one complete, inspectable record: model and provider, prompt key and version, routing decision and
reason, context sources, each tool call (action key, input hash, refusal or approval, latency), approvals (who, when,
risk level), tokens in and out, cost by the provider price table, latency per step, budget checks, errors and
retries, the human principal and the agent identity, tenant and scope; how it is stored, viewed, linked to evals and
budgets, and sampled.

## What exists today (verified on `land/031-stack`, 2e7e2f8c)

`@stackra/ai/node` already owns the ADR 0100 run tables (ADR 0399): `ai.runs`, `ai.steps`, `ai.tool_calls`,
`ai.approvals`, `ai.a2a_tasks`, `ai.conversations`, `ai.messages`, written by `AgentRuntime` through the `RunStore` and
`ConversationStore` ports. Rows hold codes, counts and SHA-256 hashes, never text (ADR 0100 decision 9); text lives only
in `ai.messages`, sealed with the tenant key (ADR 0476). The action pipeline already opens one `Tracer` span per action
call with the ADR 0147 attributes (`action`, `toolCallId`, `outcome`, `code`, `latencyMs`, no values).

| Trace field                                      | Where it is today                                                                   | Gap                                                                                                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run id, agent key, status, step count            | `Run.id`, `Run.agent`, `Run.status`, `Run.steps`                                    | none                                                                                                                                                |
| Human principal and agent identity               | `Run.actor` (`Actor`, the human in `onBehalfOf`)                                    | none                                                                                                                                                |
| Tenant and scope, record                         | `Run.tenantId`, `Run.scope`, `Run.recordKind`, `Run.recordId`                       | none                                                                                                                                                |
| Run origin (sidekick, MCP, background, A2A)      | nothing; A2A only by `A2aTask.runId`, which nothing writes yet                      | no origin; an MCP-host tool chain has no run at all (the gateway audits each call alone)                                                            |
| Start, end, total latency                        | `Run.createdAt`, `Run.finishedAt`                                                   | end only on completed or failed; no time spent parked                                                                                               |
| Model and provider                               | in memory only (`LoopState.model`, `<provider>/<model>`), handed to `AiMeter`       | not stored on the run or step                                                                                                                       |
| Routing decision and reason                      | `routeModel` returns `RouteChoice` (route, region, `disclosed`, refusal reason)     | `AgentModels.model()` returns only a `LanguageModel`; the choice is dropped                                                                         |
| Prompt key and version                           | `Prompt({ version })`; `InstructionSource.instructions(agent, locale)` returns text | the run never learns which prompt document or version it ran                                                                                        |
| Context sources (retrieval hits, memory reads)   | `retrieve()` returns `RetrievedPassage { source, score }`; `Facts.provide`          | not recorded; long-term memory (ADR 0156 decision 3) is not built                                                                                   |
| Per step: tokens in and out, finish reason       | `RunStep.inputTokens`, `outputTokens`, `finishReason`, `index`                      | no model, no latency, no retries, no cached-token count                                                                                             |
| Cost                                             | `AiMeter` emits `usage.recorded` on `ai.tokens` (subject = model); prices are data  | no cost anywhere; no provider price table exists                                                                                                    |
| Tool call: action key, input hash, outcome, code | `ToolCall.tool`, `inputHash`, `outcome`, `code`, `approvalId`, `at`                 | no start time or latency, no risk level, no step index; `inputHash` is a bare SHA-256 (guessable for low-entropy inputs)                            |
| Approval: id, tool, status                       | `RunApproval.approvalId`, `tool`, `status`, timestamps                              | no risk level, no mode that decided it (ADR 0360 decision 6), no approver, no resolution time; `ai.approval.resolved.v1` carries no approver either |
| Budget checks                                    | `checkBudget()` (pure) and `TokenBudget`                                            | not called by `AgentRuntime`; nothing recorded                                                                                                      |
| Errors and retries                               | `Run.errorCode`                                                                     | no step-level error, no provider retry count                                                                                                        |
| Evals                                            | `runEvals(cases, subject)`, `EvalCase`, `EvalReport`; `<stem>.eval.json` assets     | no link from a run to a case; no regression run on a prompt version change                                                                          |
| OTLP                                             | `Tracer` port (`@stackra/contracts`), `OtlpTracerDriver` (`@stackra/logger`)        | `AgentRuntime` opens no span; action spans are not children of a run span                                                                           |
| Viewing                                          | nothing                                                                             | no query, no tool, no panel resource                                                                                                                |

## Decision

The rows are the record and the spans are the signal. The trace is stored in the existing ADR 0100 tables, extended
with columns and one new table (`ai.run_context`), because those rows are tenant-owned, under RLS, in the tenant's
region and already hold no text. OTLP spans mirror the run (one span per run, per step and per tool call, the action
pipeline's span nested under the tool-call span) with ids and codes only, sampled by the tracer; the rows are never
sampled. Viewing is two queries and one panel resource declared by the `ai` module that owns the `ai.run` model, so
the queries are MCP tools by default under the caller's permissions (ADR 0360 decision 4, ADR 0490 decision 16).

## Impact

- **Apps touched**: none in core; the console shows the resource once a deployment mounts the `ai` module
- **Services touched**: none in core; Tamo's `ai` service binds the new port shapes (`AgentModels`,
  `InstructionSource`, the price table) and mounts the resource; the MCP gateway (Tamo) opens an `mcp` run per host
  session (FR-004)
- **Packages touched**: `@stackra/ai` (contracts, core runtime, node models, migration, Postgres driver, new
  `queries/`, `actions/`, `access/`, `resources/run/`, `schemas/`), `@stackra/panel` (consumed, not changed), `@stackra/mcp`
  (the gateway contract carries the run id), `@stackra/actions` (the pipeline span takes the current span as parent;
  no shape change)
- **Cross-service events**: `ai.run.completed.v1` unchanged; `ai.approval.resolved.v1` gains an optional
  `approverId` and `resolvedAt` (additive, same version) or a v2 (open question Q5); no new event
- **Tenancy and data**: tenant-data migration on `ai.runs`, `ai.steps`, `ai.tool_calls`, `ai.approvals`; new
  tenant-owned tables `ai.run_context` and `ai.eval_cases`, `BelongsToTenant`, append-only, forced RLS; no text, no new personal field;
  the keyed input hash (FR-011) changes what `input_hash` means for new rows
- **Secrets**: none new; the keyed hash uses a tenant data key from the existing key hierarchy (ADR 0188), named not
  read
- **ADR needed**: yes; an amendment Note to ADR 0100 (decision 9: the keyed hash, retention of run rows) and ADR 0399
  (the new table and columns), and a decision on the price table owner (open questions Q1 to Q4); the lead routes
  them to `docs-adr-steward` after the owner answers
- **New dependencies**: `@stackra/ai` → `@stackra/panel` (`workspace:*`, for the `Resource` base); no npm dependency
- **Deploy modes**: SaaS, on-prem and air-gapped alike; OTLP export goes to the in-region collector (or the bundled
  LGTM stack, ADR 0184 decision 2); with no tracer bound the rows are still written
- **Licence tier**: free (ADR 0155 decision 3, ADR 0100 decision 1); the eval workspace UI stays Pro (ADR 0100
  decision 15) and is not in scope
- **Docs to update**: `packages/application/ai/README.md` and `AGENTS.md`; the AI guide page on runs in `apps/docs`;
  the ADR notes above
- **Lane**: full (several members, a public contract change, a tenant-data migration)
- **Change risk**: R3 (tenant-data migrations, PII handling of hashes and context ids)

## User stories

- **US1 (P1) — Capture**: an operator debugging a bad answer opens one run and sees every model step, the model and
  route, the prompt version, the context it read, every tool call with its latency and outcome, approvals, tokens,
  cost, budget checks and errors, in order.
- **US2 (P1) — Signal**: an on-call engineer follows a slow sidekick turn in the OTLP backend from the edge request
  through the run, its steps and each action call, with no value in any attribute.
- **US3 (P2) — View**: a tenant admin lists runs in the console by agent, status, origin, user and date, and opens a
  run's timeline; an agent can call the same queries as tools under its human's permissions.
- **US4 (P3) — Learn**: from a run, a prompt owner captures an eval case, and a prompt version change replays the
  captured cases; a run's tokens and cost link to the budget check that admitted it.

## Requirements

### Capture (US1)

- **FR-001** `Run` gains `origin` (`sidekick`, `mcp`, `background`, `a2a`, `api`; a new `RunOrigin` enum in
  `#contracts/enums`), set at `create` and never changed.
- **FR-002** `Run` gains the routing record: `provider`, `model`, `region`, `disclosed` (boolean) and `routeReason`
  (a snake_case code: `tenant_route`, `product_route`, `fallback_jurisdiction`, `own_key`), from the `RouteChoice` the
  router made. `AgentModels.model()` returns the model with its choice (`{ model, choice }`); a refusal fails the run
  with `errorCode` `no_route` or `class_closed`.
- **FR-003** `Run` gains `promptKey` and `promptVersion` (`<module>::ai/<stem>`, whole number from 1), returned by
  `InstructionSource` with the text (`{ text, key, version }`); a tenant override (ADR 0245 decision 6) records
  `promptOverride: true`.
- **FR-004** An MCP host session that calls tools through the gateway is one run with `origin: mcp`, no steps, the
  host's client id as `model` (`provider: "mcp_host"`), and each tool call recorded as in FR-008; the gateway opens it
  on the first call of a session and finishes it when the session ends or idles 30 minutes.
- **FR-005** `RunStep` gains `model` (`<provider>/<model>`, as served, which may differ from the route on failover),
  `startedAt`, `latencyMs`, `cachedInputTokens`, `retries` (provider retries inside the step) and `errorCode`
  (null unless the step failed).
- **FR-006** A new append-only table `ai.run_context` records each context source a step read: `runId`, `stepIndex`,
  `kind` (`facts`, `retrieval`, `memory`, `page`), `provider` (the `Facts` class key or the index name), `sourceId` (a
  public id or document id, never text), `score` (nullable), `queryHash` (keyed, FR-011), `at`. `retrieve()` and
  `Facts.provide` report through the runtime; a passage's text is never stored. `memory` is reserved until ADR 0156
  decision 3 memory exists.
- **FR-007** `Run` gains `costMicros` (integer, millionths of the price table's currency), `costCurrency` and
  `priceTableVersion`; `RunStep` gains `costMicros`. Cost is input, cached-input and output tokens times the price
  table row of the step's `model` at the time of the step. A model with no row records `costMicros: null` and the
  warning code `price_missing`; nothing is guessed.
- **FR-008** `ToolCall` gains `stepIndex`, `startedAt`, `latencyMs`, `risk` (`L0` to `L4`, from the tool row) and
  `source` (`ToolSource`: action, query, client). The existing `outcome`, `code` and `approvalId` stay.
- **FR-009** `RunApproval` gains `risk`, `mode` (the ADR 0360 mode that decided it: `ask`, `allow_by_default`,
  `always_allow`, `bypass`, `escalate`), `approverId` (the human's public id, null until resolved), `resolvedAt` and
  `floorItem` (the ADR 0360 decision 8 item that forced a human, null otherwise). A call that ran without a prompt
  because of a mode is recorded too, with `status: auto` and its `mode`, so a bypassed call is visible.
- **FR-010** `AgentRuntime` calls `checkBudget` before each loop with the scope's `TokenBudget` (a new optional
  `AgentBudgets` port, whose Tamo driver reads the scope's `ai.tokens` quota entitlement; unbound means no budget) and records the answer on the run: `budgetLimit`, `budgetUsed`,
  `budgetAllowed`, `budgetWarn`. A refused check fails the run with `errorCode: budget_exceeded` before any model call.
- **FR-011** Input and query hashes of new rows are HMAC-SHA-256 under a per-tenant hashing key, not bare SHA-256;
  `ToolCall` gains `hashKind` (`sha256` for old rows, `hmac` for new), so equal inputs still compare within a tenant
  and a guessed input cannot be confirmed across tenants or by an operator without the key.
- **FR-012** `Run` gains `parkedMs` (total time waiting on approvals and client tools) so latency excludes human time;
  `finishedAt` is also set when a parked run expires.
- **FR-013** No new column holds prompt text, response text, tool input or output, a passage, an error message or a
  personal field; error and refusal codes only. A test asserts the column list of every `ai.*` trace table against an
  allow-list.

### Signal (US2)

- **FR-014** When a `Tracer` is bound, `AgentRuntime` opens one span `ai.run <agent>` per loop, one child
  `ai.step <index>` per step and one child `ai.tool <action-key>` per tool call; the action pipeline's span nests under
  the tool span. Attributes are the ADR 0147 names plus `runId`, `agent`, `origin`, `provider`, `model`, `region`,
  `promptKey`, `promptVersion`, `inputTokens`, `outputTokens`, `costMicros`, `outcome`, `code`, `latencyMs`; never a
  value, text or hash.
- **FR-015** Spans follow the tracer's sampling (`traceSampleRatio`, ADR 0147 decision 1); rows are written for every
  run whatever the sampling. `Run` gains `traceId` (null when unsampled or no tracer) so a row links to its trace.

### View (US3)

- **FR-016** The `ai` module declares `RunPermissions` in `access/run.permissions.ts` with `view` (`ai.run.view`, own runs:
  the caller is the run's human principal or its background owner) and `viewAny` (`ai.run.view_any`, every run in the
  caller's scope subtree);
  both are L1, record rules through `RunPolicy` and `ctx.authorize(run)`.
- **FR-017** `ListRunsQuery` (`run.list`, `GET /runs`) lists runs by agent, status, origin, principal, scope, date
  range and `promptVersion`, cursor-paginated (`CursorInput`, `Page.of(RunSummary)`). It is an MCP tool by default.
- **FR-018** `GetRunQuery` (`run.get`, `GET /runs/:runId`) returns the run with its steps, context sources, tool calls
  and approvals in time order (`RunTrace`). It is an MCP tool by default; its output has a card so the sidekick can
  show a run (ADR 0490 decision 14). Neither query returns message text; a link to the conversation is the
  conversation's own permission.
- **FR-019** A panel `Resource<Run, RunSummary>` in `resources/run/` with `operations: ["list", "get"]`: the table
  (agent, origin, status, principal, model, tokens, cost, latency, started), the filters of FR-017 and an infolist
  timeline of FR-018. No create, update or delete.
- **FR-020** No tool, list or wrapper is written outside the `ai` module for these queries; gen collects them from the
  module's manifest like any other.

### Learn (US4)

- **FR-021** `CaptureEvalCaseAction` (`eval_case.capture`, `POST /eval-cases/capture`, L2, actors user only) records
  an `ai.eval_cases` row (a new tenant-owned, append-only table): `runId`, `promptKey`, `promptVersion`, `agent`, a reference to the conversation and
  message positions that hold the input, the expected outcome as a check name (`same_tool_calls`, `same_refusal`,
  `human_label`) and a label. It copies no text (Q3).
- **FR-022** A prompt whose version changes runs its captured cases on the recorded model replay of ADR 0100 decision
  12, with `runEvals`, in CI for code prompts and on publish for tenant overrides; the report names the cases that
  regressed between the two versions.
- **FR-023** The run's cost and tokens are the `usage.recorded` values `AiMeter` already writes (same `callId`), so a
  run row and the usage service agree; FR-010's budget fields name the budget that admitted the run.

### Retention and residency

- **FR-024** Run, step, context, tool-call and approval rows are kept for the period of Q2 and erased with the tenant;
  an erasure of a person removes their runs' `principal` link per ADR 0189 decision 2 (the rows hold ids only).
- **FR-025** Rows live in the tenant's region with the rest of `ai.*` (ADR 0492 decision 1); spans go only to the
  region's collector, configured per deployment.

## Acceptance criteria

- **SC-001** A sidekick run with two steps, one retrieval, one L2 tool call parked and approved, and one refused call
  yields, through `run.get`, one trace naming the model, route reason, prompt version, both passages' source ids, both
  tool calls with latency, risk and outcome, the approval's approver, mode and time, tokens, cost and the budget
  check; and no field holds text.
- **SC-002** With a tracer bound at ratio 1, the same run exports one run span, two step spans, two tool spans and the
  action spans nested under them; at ratio 0 the rows are identical and `traceId` is null.
- **SC-003** A caller with `ai.run.view` lists only runs where they are the principal; with `ai.run.view_any` every run
  in their scope subtree; another tenant's run is never found.
- **SC-004** An agent calls `ai.run.list@1` as a tool under its human's permissions and gets the same rows.
- **SC-005** A prompt version bump with one captured case that changed its tool calls fails CI with that case named.
- **SC-006** A run over its budget fails before any model call with `budget_exceeded`, recorded on the run.

## Edge cases

- **EC-001** A model with no price table row: cost null, `price_missing` warning, the run still completes.
- **EC-002** Provider failover inside a step: the step's `model` is the one that answered, `retries` counts the
  attempts, the run's routing record keeps the first route.
- **EC-003** A parked run resumed in another process: steps continue their index and span links continue through
  `traceId` as a span link, not a parent.
- **EC-004** A queued run (`background`) has no session and no surface; its principal is the owning human of ADR 0360
  decision 12.
- **EC-005** An A2A inbound task: `origin: a2a`, the `A2aTask` row links the run; the remote agent's card URL is the
  agent identity.

## Open questions (owner)

- **Q1 — Price table owner.** Where the provider price table lives and who edits it. Proposed: a `ModelPrice` row set
  in settings of the `ai` module (provider, model, per-million input, cached input and output price, currency, valid
  from), versioned by `valid from`; Figentra's credit price to tenants stays Tamo's and is not this table.
- **Q2 — Retention of run rows.** Messages keep 90 days (ADR 0156 decision 3, ADR 0189 decision 4). Proposed: trace
  rows keep 13 months, like the audit hot tier (ADR 0212 decision 6), since they hold no text; a tenant may shorten it
  within bounds.
- **Q3 — Text in eval cases.** ADR 0100 decision 9 keeps text only in conversations. Proposed: a captured case
  references the sealed messages and expires with them; promoting a case into a code prompt's `<stem>.eval.json` is a
  human copy, reviewed, with the text redacted (`redact()`).
- **Q4 — Keyed hashes.** FR-011 changes the meaning of `input_hash` from ADR 0399 decision 3. Proposed: HMAC under a
  per-tenant key derived from the tenant data key (ADR 0188), old rows keep `sha256`; needs an ADR 0100 and 0399 Note.
- **Q5 — Approver on the event.** Proposed: add optional `approverId` and `resolvedAt` to `ai.approval.resolved.v1`
  (additive, same version), filled by Tamo's approvals bridge.
- **Q6 — Who may see runs.** Proposed: `ai.run.view` (own) and `ai.run.view_any` (scope subtree) both L1; a support operator reads
  runs only through the operator access of ADR 0188.
- **Q7 — Where the resource lives.** Proposed: in `@stackra/ai/node` beside the model (the module that owns the model
  declares its resource and tools), adding the `@stackra/panel` workspace dependency; the alternative is Tamo's `ai`
  service, which would put the tools outside the owning module.
- **Q8 — Span sampling.** Proposed: head sampling at the tracer's ratio, plus always sampling a run that fails,
  refuses or parks (the runtime forces the flag at the run span); no tail sampler is added.

## Status history

- 2026-11-01 → Draft (spec-writer; owner questions Q1 to Q8 open)
