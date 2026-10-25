# Plan: `@stackra/renderers` wave 2

**Spec**: `.agents/specs/sta-348-renderers/spec.md`

## Approach

- Port the assistant dialects of `@vellum/renderers` (Claude Code, Kiro and OpenCode frontmatter, the Kiro tool table,
  the OpenCode derived denies) and add Cursor and `AGENTS.md` (ADR 0282 decision 2). Leave Vellum's engine renderers
  in Vellum.
- Input is `AgentDocument` from `@stackra/skills` (already parsed and validated there), so this package re-parses
  nothing; its own frontmatter parser and `parseNeutralAgent` are not ported. Vellum's model tiers, permissions and
  skill references are not in the neutral format (sub-agents name no model), so they are not ported either.
- YAML is written with `yaml` (`lineWidth: 0`); Cursor's `globs` line is written by hand in Cursor's own unquoted form.
- One public function, `renderAssistant`, dispatches through a `Record<Assistant, …>` map, sorts by path and refuses
  duplicates. The per-assistant renderers, maps and Markdown helpers stay internal.

## Layout

```
packages/developer/renderers/
  package.json  tsconfig.json  turbo.jsonc  stackra.config.ts  tsdown.config.ts  vitest.config.ts
  README.md  AGENTS.md  CHANGELOG.md  LICENSE
  src/core/
    index.ts                              stand-in barrel for `.`
    enums/assistant.enum.ts
    errors/render-input.error.ts
    types/{rendered-file,skipped-document,render-result,render-options}.type.ts
    constants/{kiro-tools,opencode-actions,claude-hook-events}.constant.ts
    functions/render-assistant.function.ts
    functions/render-{claude-code,opencode,kiro,cursor,agents-md}.function.ts
    functions/{compose-markdown,provenance-comment,demote-headings}.function.ts
    **/__tests__/*.test.ts
```

## Risks

- The OpenCode agent `permissions` list follows the Vellum port (OpenCode's V2 agent docs), which the Vellum spike
  tests; Kiro and Cursor are untested (ADR 0286 decision 16).
- The input types come from `@stackra/skills`, built in the same wave; a change there must keep this package and Vellum
  working.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                      |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/developer/renderers`; workspace imports: `@stackra/contracts`, `@stackra/skills` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                       |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                     |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                              |
| Tenancy                               | N/A    | no tenant data                                                                                                                                            |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                    |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                          |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                 |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                         |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                           |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                        |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                   |

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` names `@stackra/renderers` at `packages/developer/renderers`, `exports` lists only `.`, and `turbo.jsonc` carries the `tier:lib` tag — Validates: FR-001
- **P-002**: `.` exports exactly `Assistant`, `renderAssistant`, `RenderInputError` and the types `RenderResult`, `RenderedFile`, `SkippedDocument` and `RenderOptions` — Validates: FR-002
- **P-003**: `renderAssistant` is pure: it sorts files by path, returns a frozen result and refuses duplicate paths, so one input gives one result — Validates: FR-003
- **P-004**: each `Assistant` case renders its own layout (Claude Code, OpenCode, Kiro, Cursor, `AGENTS.md`), and a document an assistant cannot take is listed in `skipped` instead of being dropped — Validates: FR-004
- **P-005**: `CLAUDE_HOOK_EVENTS` is typed over `HookEvent`, and a Kiro tool absent from `KIRO_TOOLS` is refused — Validates: FR-005
