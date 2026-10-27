<!--
Stackra file contract:
Purpose: the agent rules of @stackra/ai: where code goes, entries, the package invariants (page reader included), PII.
Boundary: documentation only; the user-facing guide is README.md.
Runtime: none (Markdown)
Governing contract: ADR 0100, ADR 0155, ADR 0294, ADR 0360, ADR 0399; ADR 0450.
-->

# AGENTS — @stackra/ai

The AI kinds of a module's `ai/` group (`Prompt`, `Skill`, `Facts<M>`), the tool-table vocabulary (`ToolSource`,
`Approval`, `approvalFor`) and `decide()` on AI SDK core. Member at `packages/application/ai` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entries `.` (plus `retrieve`, the Facts retrieval helper over the
`@stackra/search` ports, and the agent runtime), `./contracts` (the runtime's ports and run vocabulary) and `./node` (the
ADR 0100 tables, the Postgres stores and `ScopeKeyCast`; storage home: ADR 0399).

## Where code goes

| You are writing… | It goes in…                                 |
| ---------------- | ------------------------------------------- |
| A kind base      | `src/core/bases/<name>.base.ts`             |
| An enum          | `src/core/enums/<name>.enum.ts`             |
| A function       | `src/core/functions/<name>.function.ts`     |
| A type           | `src/core/types/<name>.type.ts`             |
| A port or record | `src/contracts/{ports,enums,types}/`        |
| A core-type port | `src/core/ports/<name>.port.ts`             |
| A service/driver | `src/core/{services,drivers}/`              |
| Node-only code   | `src/node/{models,drivers,casts,database}/` |
| A test           | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/{core,contracts,node}/index.ts` are stand-in barrels; `./contracts` imports no other entry.
- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`.

## This package

- AI SDK core (`ai`) is the only model library (ADR 0155, owner decision R-67). No LLM proxy gateway, no
  separate-language agent runtime (ADR 0227). Never accept a model id string: it resolves through AI SDK's hosted
  gateway.
- Never write a tool: tools are actions and queries, derived by gen. `Skill` checks only that each listed class is an
  exposed tool; the risk comes from the permission and is gen's check.
- Import `@stackra/actions` for types only; the runtime check reads the kind registry through `@stackra/container`.
- A provider key is a secret name resolved at run time; no key, value or `.env` read here (ADR 0100 decision 14).
- No `tenant` vocabulary (R-59); no `enum`, no `#private` fields, no parameter properties.
- Configuration, not code: a floor tag, a recipient limit, a provider, a region, a warning share or a redaction pattern
  is data the caller passes (platform floor, market pack, product and tenant settings). The resolver, the router and
  the checks hold only mechanism.
- Text lives only in conversations, sealed with `ScopeKeyCast`; runs, steps and tool calls hold hashes, codes and
  counts (ADR 0100 decision 9). A tool call is always an action dispatch through `ToolDispatcher` (ADR 0100 d3).
- `ModelProviders` (`.` entry) is only the token that collects `ModelProviderDriver`s; the Bedrock and Anthropic
  drivers and the driver that lists them are the ai service's (OS ai). Add no provider driver here.
- The session's bypass switch travels `PromptCall.bypass` / `ResumeDecision.bypass` to `ToolCallContext.bypass`; it is a
  wish the approval gate checks, never a grant. A queued run has no session and carries none.
- `PageReader` (`./contracts`, ADR 0450) reads one page; its drivers are here. `HttpPageReaderDriver` checks every URL
  and redirect with `checkEgress` and takes its limits as a `PageReaderPolicy` from settings: add no default limit,
  host or user agent in code. A reading is untrusted data for a model, never instructions; store none of it here.
- Only add a symbol a consumer imports today (the template, a package, or the registry row).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/ai` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data                     | Where                       | Handling                                                                             |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------------------ |
| `decide` prompt          | sent to the caller's model  | Not stored or logged here; the caller redacts personal data for third-party models.  |
| `ContextFacts` (by type) | built by a module's `Facts` | Public ids and what the principal may read only; stored by the ai service, not here. |
