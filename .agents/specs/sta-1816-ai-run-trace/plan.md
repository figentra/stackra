# Implementation Plan: one inspectable trace per agent run

**Spec**: `spec.md` · **Linear**: STA-1816 · **Branch**: `figentra/sta-1816-ai-run-trace`

Full lane (ADR 0120 D8): this design pull request (spec, plan, then tasks and analyze), then one pull request per
user-story phase. Phases 1 and 2 need the owner's answers to Q2 and Q4 (retention, keyed hashes) and the ADR Notes they
produce; phase 4 needs Q1 and Q3. This Mac runs only oxfmt and oxlint; tests run on a box through the testing session.

## Phases

| Phase | Story | What                                                                                                                                                                                                      | Gate                                       |
| ----- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1     | US1   | Contracts: `RunOrigin`, the `{ model, choice }` answer of `AgentModels`, `{ text, key, version }` of `InstructionSource`, the `AgentBudgets` and `ModelPrices` ports, new record fields                   | ai contract tests                          |
| 1     | US1   | Migration `0006-run-trace` (columns on `runs`, `steps`, `tool_calls`, `approvals`; `run_context`, `eval_cases` tables, RLS, append-only triggers); models; `PostgresRunStoreDriver` and the memory driver | ai node tests, RLS isolation test          |
| 1     | US1   | `AgentRuntime`: origin, route, prompt version, step timing and retries, context reports, tool-call timing and risk, approval mode and floor item, budget check, cost, keyed hashes, `parkedMs`            | runtime tests with the mock model          |
| 2     | US2   | Spans in `AgentRuntime` (run, step, tool); the action pipeline's span nests under the current span; forced sampling of failed, refused and parked runs (Q8)                                               | runtime span tests with a recording tracer |
| 3     | US3   | `access/run.permissions.ts`, `RunPolicy`, `ListRunsQuery`, `GetRunQuery`, `schemas/` (`RunSummary`, `RunTrace`, inputs), the run card, `resources/run/run.resource.ts`                                    | query tests; gen snapshot of the tool rows |
| 4     | US4   | `CaptureEvalCaseAction`, the replay of captured cases on a prompt version change, the cost and usage reconciliation                                                                                       | action tests; eval replay test             |

Tamo (not this repository) binds `AgentModels`, `InstructionSource`, `AgentBudgets` and `ModelPrices`, fills the
approver from its approvals bridge (Q5), and opens the `mcp` run in the gateway (FR-004); each is a Tamo issue the lead
creates once phase 1 merges.

## Design notes

- The run row is the source of truth; spans are derived and may be absent. Nothing reads spans back.
- Cost is computed once per step from the price row valid at the step's start and summed onto the run, so a later
  price change never rewrites history; `priceTableVersion` names the row set used.
- Context sources reach the runtime through a per-run reporter the runtime passes in `FactsContext`; `retrieve()`
  gains an optional `report` callback, so `Facts` authors write nothing new.
- The keyed hash needs the tenant hashing key from the key hierarchy; the `RunStore` driver asks a `HashKeys` port, so
  `@stackra/ai` names no key and reads no secret.
- The queries and the resource are declared in the `ai` module of `@stackra/ai/node`; gen derives their keys
  (`ai.run.list@1`, `ai.run.get@1`, `ai.eval_case.capture@1`), routes, permissions and tool rows. No tool table,
  wrapper or MCP registration is written by hand (AI rule, ADR 0490 decision 16).

## Constitution Check

| Law                                   | Result | Note                                                                                                                             |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` to `tier:lib` only (`@stackra/ai` → `@stackra/panel`, no cycle); no app or service import                             |
| Secrets (ADR 0173)                    | PASS   | no secret value; the hashing key is reached through a port over the key hierarchy, never read by the package                     |
| Security                              | PASS   | no text, input or output stored; keyed hashes; record rules through `ctx.authorize(run)`; queries L1 under caller permissions    |
| HTTP and events                       | PASS   | queries and one action by the endpoint convention; one additive field pair on `ai.approval.resolved.v1` (Q5)                     |
| Tenancy                               | PASS   | every new column and table is `BelongsToTenant` under forced RLS, with an isolation test                                         |
| Delegation                            | PASS   | `package-builder` per phase; `api-contract-reviewer` and a security reviewer on phases 1 and 3; tests run by the testing session |
| Not built yet (ADR 0227)              | PASS   | no LLM proxy, no separate observability service, no CDC; OTLP through the existing `Tracer` port                                 |
| Test placement (ADR 0022)             | PASS   | every test in `src/**/__tests__/` beside its subject                                                                             |
| Versions and catalogs                 | PASS   | `workspace:*` for `@stackra/panel`; no npm dependency                                                                            |
| Deploy modes (ADR 0076)               | PASS   | identical code in every mode; see below                                                                                          |
| Licence tier (ADR 0077)               | PASS   | free, MIT (ADR 0155 decision 3); the eval workspace UI stays Pro and is out of scope                                             |
| Docs and ADRs                         | PASS   | README, AGENTS and file contracts per phase; ADR 0100 and 0399 Notes after the owner answers Q2 to Q4                            |

## Deploy modes

| Mode       | Behaviour                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| SaaS       | rows in the regional `ai` service's database; spans to the region's OTLP collector                             |
| On-prem    | identical; spans to the bundled LGTM stack or none; the price table is the installer's data                    |
| Air-gapped | identical; local models (vLLM, Ollama) get price rows of zero or none (`price_missing`); spans stay on the box |

## Correctness properties

- **P-001**: a run created by each entry point carries its origin, and the origin never changes — Validates: FR-001
- **P-002**: a routed run stores provider, model, region, `disclosed` and the reason of the `RouteChoice`; a refused route fails the run with the refusal code and no model call — Validates: FR-002
- **P-003**: a run records the prompt key and version `InstructionSource` returned, and `promptOverride` for a tenant override — Validates: FR-003
- **P-004**: a gateway session of three tool calls yields one `mcp` run with three tool calls and no steps, finished on session end or 30 minutes idle — Validates: FR-004
- **P-005**: each step records the answering model, start, latency, cached tokens, retries and its error code; a failover step names the fallback model — Validates: FR-005
- **P-006**: a `Facts` provider that retrieves two passages yields two `run_context` rows with source ids and scores and no text — Validates: FR-006
- **P-007**: cost equals tokens times the price row valid at the step's start, summed on the run; a missing row gives null cost and `price_missing` — Validates: FR-007
- **P-008**: each tool call records its step, start, latency, risk and source next to the existing outcome fields — Validates: FR-008
- **P-009**: an approval records risk, mode, floor item, approver and resolution time; an auto-allowed call is recorded with `status: auto` and its mode — Validates: FR-009
- **P-010**: a run over its budget fails with `budget_exceeded` before any model call, and every run records the check — Validates: FR-010
- **P-011**: equal inputs in one tenant give equal hashes, the same input in two tenants gives different hashes, and old rows read as `sha256` — Validates: FR-011
- **P-012**: `parkedMs` sums approval and client-tool waits, and an expired parked run gets `finishedAt` — Validates: FR-012
- **P-013**: the column list of every `ai.*` trace table matches the allow-list, with no text or personal column — Validates: FR-013
- **P-014**: with a recording tracer, a run exports run, step and tool spans with the action span nested under the tool span, and no attribute holds a value, text or hash — Validates: FR-014
- **P-015**: at sampling ratio 0 the rows are identical and `traceId` is null; at 1 `traceId` matches the exported trace — Validates: FR-015
- **P-016**: `ai.run.view` returns only the caller's runs, `ai.run.view_any` the scope subtree, and never another tenant's — Validates: FR-016
- **P-017**: `run.list` filters by each field and pages by cursor, and gen emits it as a tool row of the `ai` module — Validates: FR-017, FR-020
- **P-018**: `run.get` returns steps, context, tool calls and approvals in time order with no message text, and gen emits it as a tool row with its card — Validates: FR-018, FR-020
- **P-019**: the resource describes list and get only, with the columns, filters and timeline of the spec — Validates: FR-019
- **P-020**: capturing a case stores the run, prompt version, message references and check, and no text — Validates: FR-021
- **P-021**: a prompt version bump replays captured cases and names each that regressed — Validates: FR-022
- **P-022**: a run's token counts equal the `usage.recorded` values with the same `callId`, and its budget fields name the admitting budget — Validates: FR-023
- **P-023**: a tenant's trace rows are removed with the tenant, and a person's erasure clears their principal links — Validates: FR-024
- **P-024**: the rows are written to the tenant region's database and the tracer endpoint is the region's — Validates: FR-025
