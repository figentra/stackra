# Plan: `@stackra/ai` wave 4

**Spec**: `.agents/specs/sta-348-ai/spec.md`

## Design

- One entry, `.`, from `src/core/` through the stand-in barrel `src/core/index.ts` (STA-339 replaces it).
- Groups: `bases/` (`Prompt`, `Skill`, `Facts`), `enums/` (`ToolSource`, `Approval`), `functions/` (`approvalFor`,
  `decide`), `types/` (the options, class types, `SkillExample`, `FactsContext`, `ContextFacts`, `DecideOptions`).
  One declaration per file.
- `Prompt` and `Skill` are `createKind` bases with an instance interface of the same name, as `Module` is in
  container: `Prompt` typed bare-or-called, `Skill` called only. Their `read` checks the options and applies defaults
  (`version: 1`; frozen `tools`).
- `Skill` checks each tool through `kindOf`: a `query` whose recorded `tool` is not `false`, or an `action` whose
  recorded `tool` is `true`. `@stackra/actions` is imported for types only.
- `Facts<M extends { readonly id: unknown }>` is an abstract class registered with `registerKind`; the subject is a
  type-only property, so `extends Facts` without a type argument fails to compile. A structural constraint, not
  `Model`, so facts about a page or a user fit and the package does not load the ORM.
- `FactsContext` picks `actor`, `locale` and `authorize` from the actions `QueryContext` and adds `money`.
- `decide` has three overloads keyed by `choices`, `score` and `yesNo`; it calls `generateText` with
  `Output.choice` (choices, and yes/no as `["yes", "no"]`) or `Output.object` with a zod `{ score }` schema bounded by
  the range. The model type excludes AI SDK's string ids, and a runtime check refuses a non-object model.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/application/ai`; workspace imports: `@stackra/actions` (types), `@stackra/container`, `@stackra/contracts`; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | no secret is read, stored or logged; a provider key stays a secret name the runtime resolves                                                                        |
| Security                              | PASS   | tools stay actions and queries under the pipeline; approvals follow the permission's risk (ADR 0100 decision 5)                                                     |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                        |
| Tenancy                               | N/A    | no tenant data; no `tenant` vocabulary (R-59)                                                                                                                       |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                              |
| Not built yet (ADR 0227)              | PASS   | AI SDK core only; no LLM proxy gateway (model id strings refused), no separate-language agent runtime                                                               |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                           |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; `ai` is pinned in the catalog by the integrator                                                                                  |
| Deploy modes (ADR 0076)               | PASS   | identical in SaaS, on-prem and air-gapped; the deployment passes its own model                                                                                      |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`; all AI code is free (ADR 0155)                                                                                                                  |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                             |

- Boundaries: workspace imports `@stackra/actions` (types only), `@stackra/container`, `@stackra/contracts`.
- Versions: catalogs and `workspace:*` only.
- Naming: kind bases `PascalCase(kind)`, no `define` prefix (0305 rule 3); one declaration per file.

## Properties

- **P-001**: `package.json` names `@stackra/ai` at `packages/application/ai`, and `exports` lists only `.` — Validates: FR-001
- **P-002**: `.` exports `Approval`, `Facts`, `Prompt`, `Skill`, `ToolSource` at runtime and `ContextFacts`, `FactsContext` as types, with the template's shapes — Validates: FR-002
- **P-003**: `kindOf` reads `prompt` for both forms (with `version` defaulted to 1 when called), `skill` with frozen tools, and `facts` for a `Facts<M>` subclass — Validates: FR-003
- **P-004**: for every class `T`, `Skill({ tools: [T] })` succeeds exactly when `T` is a query with `tool` not `false` or an action with `tool: true` — Validates: FR-004
- **P-005**: for every level `L0` to `L4`, `approvalFor` returns none, none, `Confirm`, `NamedApprover`, `NamedApprover`; every other string throws a `RangeError` — Validates: FR-005
- **P-006**: `decide` returns a member of `choices`, a number in `[min, max]`, or a boolean, and makes no model call when it refuses its arguments — Validates: FR-006

## Deploy modes

| Mode       | Behaviour                                                                |
| ---------- | ------------------------------------------------------------------------ |
| SaaS       | bundled into the service; `decide` calls the model it is given (Bedrock) |
| On-prem    | identical; the deployment passes a local model (vLLM, Ollama)            |
| Air-gapped | identical; needs no network of its own, only the local model it is given |
