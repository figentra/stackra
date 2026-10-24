# Feature Specification: `@stackra/ai` wave 4, the AI kinds and a typed decide on AI SDK core

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/ai` (application, wave 4) for real: the `Prompt`, `Skill` and `Facts<M>` kind bases of a
module's `ai/` group, the `ToolSource` and `Approval` vocabulary of the MCP tool table gen writes, and the typed
`decide()` helper of owner decision R-67, on AI SDK core (ADR 0155). Entry `.` only. The template's commerce `ai/`
group and its generated `.stackra/gen/ai.ts` are the consumers.

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce service consumes it once converted, STA-344)
- **Packages touched**: `packages/application/ai` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; no table. `Facts` read through the module's own services under `ctx.authorize`
- **Secrets**: none read. `decide` takes a provider model instance the service built; a provider key is a secret name
  resolved by the runtime, never a value here (ADR 0100 decision 14)
- **ADR needed**: no (ADR 0100, 0155, 0156, 0227, 0245, 0294, 0305, owner decision R-67 and the ADR 0127 2026-10-24
  note)
- **New dependencies**: `ai` (AI SDK core) 7.0.137 through `catalog:`, the library ADR 0155 and 0100 name; it is in no
  catalog yet. Licence Apache-2.0, on the ADR 0174 allow-list. The rest come through `workspace:*`
  (`@stackra/actions`, `container`, `contracts`) and `zod` through `catalog:`
- **Deploy modes**: same in all; `decide` calls whichever model the deployment passes it (Bedrock in SaaS, a local
  model on-prem and air-gapped, ADR 0156 decision 2)
- **Licence tier**: free (MIT; all AI code is free, ADR 0155 decision 3)
- **Docs to update**: `packages/application/ai/README.md`, `packages/application/ai/AGENTS.md`; the `ai-mcp-tools`
  skill still shows the older `Facts(Invoice)`, `Skill({ instructions })` and `Prompt({ template })` forms (STA-415)
- **Lane**: lite
- **Change risk**: R2 (new public kinds the template's `ai/` groups extend)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR
0294, 0305). The choices recorded when it was specified:

- Owner, R-67 (2026-10-24): stay on AI SDK core; add a typed `decide()` for choices, scores and booleans
- Owner, R-12 (2026-10-24): queries are MCP tools by default, actions opt in with `tool: true`; risk and approval come
  from the permission
- The template wins over the older skill page: `Facts<Order>` (subject as a type argument, ADR 0305 rule 5),
  `Skill({ tools })` with instructions bound by name, `Prompt` bare or `Prompt({ version })` with template and
  evaluations bound by name
- `@stackra/mcp` is the local developer MCP and derives no runtime tool, so nothing here duplicates it; the MCP SDK
  and the gateway live in the `ai` service (ADR 0155 decision 4)

## User Scenarios & Testing

### User Story 1 - Declare a module's AI kinds (Priority: P1)

A module author writes `ExplainOrderPrompt extends Prompt`, `OrdersSupportSkill extends Skill({ tools })` with
`examples`, and `OrderFacts extends Facts<Order>` with `provide(orderId, ctx)`.

**Independent Test**: `src/core/bases/__tests__/prompt.base.test.ts`, `src/core/bases/__tests__/skill.base.test.ts`,
`src/core/bases/__tests__/facts.base.test.ts`.

**Acceptance Scenarios**:

1. **Given** `Skill({ tools: [ListOrdersQuery, CancelOrderAction] })` where the action has `tool: true`, **When** the
   class loads, **Then** the kind registry records `skill` with the frozen tools.
2. **Given** an action without `tool: true` in `tools`, **When** `Skill` is called, **Then** it throws a `TypeError`
   naming the class.

### User Story 2 - Read the generated tool table (Priority: P1)

Gen writes `from: ToolSource.Query` or `ToolSource.Action` and, at L2 and above, `approval: approvalFor(risk)` into
each row; the gateway reads them.

**Independent Test**: `src/core/enums/__tests__/*.enum.test.ts`, `src/core/functions/__tests__/approval-for.function.test.ts`.

### User Story 3 - Ask a model a typed question (Priority: P2)

A service calls `decide({ model, prompt, choices })`, `score: { min, max }` or `yesNo: true` and gets the choice union,
a number or a boolean.

**Independent Test**: `src/core/functions/__tests__/decide.function.test.ts`.

### Edge Cases

- `decide` with a model id string: `TypeError` (it would reach AI SDK's hosted gateway, ADR 0155).
- Fewer than two distinct, non-empty choices, or a score range that is not finite with `min` below `max`: `RangeError`
  before any model call.
- An answer outside the choices or the range: AI SDK's `NoObjectGeneratedError`.
- `Prompt({ version })` not a whole number from 1: `RangeError`. A tool listed twice in a skill: `TypeError`.
- `approvalFor` with anything but `L0` to `L4`: `RangeError`.

## Requirements

- **FR-001**: The package SHALL be `@stackra/ai` at `packages/application/ai`, `tier:lib`, entry `.` only.
- **FR-002**: It SHALL export every symbol the template imports from `@stackra/ai`: `Approval`, `ContextFacts`(t),
  `Facts`, `FactsContext`(t), `Prompt`, `Skill`, `ToolSource`, with the shapes its commerce `ai/` group and generated
  tool table use.
- **FR-003**: `Prompt` SHALL work bare and called with `{ version }`, `Skill` called only with `{ tools }`, and
  `Facts<M>` bare with its subject as a required type argument; each is recorded in the kind registry.
- **FR-004**: `Skill` SHALL refuse any tool that is not a query with `tool` on or an action with `tool: true`, and a
  tool listed twice.
- **FR-005**: `approvalFor` SHALL map L0 and L1 to none, L2 to `Approval.Confirm`, L3 and L4 to
  `Approval.NamedApprover`.
- **FR-006**: `decide` SHALL return the typed choice, score or boolean through AI SDK core structured output, refuse a
  model id string and refuse bad arguments before calling the model.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package, and `validate-repository` reports nothing for it.

## Open items (for the owner, not blocking)

- The brief asked for MIT dependencies; AI SDK core is Apache-2.0 (ADR 0155 names it; Apache-2.0 is on the allow-list).
- `@stackra/config` is in the registry row's dependencies but nothing here needs a config yet: the provider routing
  table and failover profile of ADR 0100 decision 2 and ADR 0156 decision 2 belong to the `ai` service until a package
  owns provider drivers.
- ADR 0100's `Promptable` agents, `@ClientTool`, A2A and MCP-client tool sources are not in the registry row and are
  not built; `ToolSource` holds the two sources the generated table uses.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · spec written beside the package (owner mode 2026-10-24: develop now, test later)
