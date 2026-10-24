# Feature Specification: `@stackra/renderers` wave 2, the renderer layer shared with Vellum

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Developer experience

**Clarifications status**: resolved (registry v3.1 row: purpose "Renderers (0286)", entries tbd, no template imports,
depends on none; ADR 0286 decision 6 moves the renderer layer into Stackra; ADR 0282 decision 2 names the layouts:
Claude Code, OpenCode, Kiro, Cursor and `AGENTS.md`; entries per the ADR 0127 2026-10-24 note: `.` only, because the
layer is pure and isomorphic)

**Input**: Build `@stackra/renderers` for real: pure functions that write the neutral agent documents of
`@stackra/skills` into each assistant's layout, ported from the assistant dialects of `@vellum/renderers`. Vellum's
spec-status, CLI, JSON and context renderers stay in Vellum: they render Vellum's own engine types, and a public
Stackra package does not depend on Vellum (ADR 0286 decision 6).

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/renderers` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0282 decisions 2, 3, 9 and 10; ADR 0286 decisions 6 and 16; ADR 0127 developer row)
- **New dependencies**: none new; `@stackra/contracts` and `@stackra/skills` through `workspace:*`, `yaml` through
  `catalog:`
- **Deploy modes**: same in all; no I/O
- **Lane**: full (a new package)
- **Change risk**: R1 (writes no file itself; the CLI writes what it returns)

## User Scenarios & Testing

### User Story 1 - Install the conventions for an assistant (Priority: P1)

`stackra agents setup` loads the bundled documents with `loadSkillSet()` and calls
`renderAssistant(Assistant.ClaudeCode, documents, { generator: "stackra agents setup" })`, then writes each returned
file under the assistant's user-level root.

**Independent Test**: `src/core/functions/__tests__/render-assistant.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a skill, an always-on rule and a sub-agent, **When** rendered for each assistant, **Then** the files are
   the documented paths, sorted by path.
2. **Given** the same documents in another order, **When** rendered, **Then** the output is byte-identical.
3. **Given** a skill and a rule read on request with one name, **When** rendered for Claude Code, **Then**
   `RenderInputError` names the shared path.

### User Story 2 - Each assistant gets its own dialect (Priority: P1)

**Independent Test**: `render-claude-code`, `render-opencode`, `render-kiro`, `render-cursor` and `render-agents-md`
function tests.

**Acceptance Scenarios**:

1. Claude Code: `SKILL.md` with `name` and `description`; rules in `rules/` (`paths` when scoped); a rule read on
   request as a skill; sub-agents with comma-separated `tools`; commands with `argument-hint`; every hook in one
   `hooks/hooks.json` grouped by Claude Code event.
2. OpenCode: sub-agents with `mode: subagent` and a deny for each action the tools do not reach (one allow-all rule
   when they reach every action, none for an empty list); always-on and scoped rules and hooks skipped with a reason.
3. Kiro: steering files with `inclusion` `always`, `fileMatch` (one pattern or a list) or `manual`; tools mapped and
   de-duplicated; an unmapped tool refused; commands and hooks skipped.
4. Cursor: `.mdc` rules with `description`, comma-separated `globs` and `alwaysApply`; skills as agent-requested rules;
   commands as plain Markdown; sub-agents and hooks skipped.
5. `AGENTS.md`: always-on rules, then scoped rules under their globs, headings demoted two levels outside code fences;
   no file without such a rule.

### Edge Cases

- An unknown assistant code from a JavaScript caller is refused, not a `TypeError`.
- A document's source path never reaches the output (machine-independent bytes).
- A long description is never folded over two YAML lines.

## Requirements

- **FR-001**: The member exists at `packages/developer/renderers` as `@stackra/renderers`, `tier:lib`, one entry `.`,
  versions only from catalogs or `workspace:*`.
- **FR-002**: `.` exports exactly `Assistant`, `renderAssistant`, `RenderInputError` and the types `RenderResult`,
  `RenderedFile`, `SkippedDocument`, `RenderOptions`.
- **FR-003**: `renderAssistant` is pure, sorts files by path, freezes its result and refuses duplicate paths.
- **FR-004**: Each assistant renders the layout of User Story 2; a document it cannot take is listed in `skipped`.
- **FR-005**: The tool and event maps are total over what they accept: `CLAUDE_HOOK_EVENTS` is typed over `HookEvent`,
  and a Kiro tool absent from `KIRO_TOOLS` is refused.

## Success Criteria

- **SC-001**: Spec, member files, source, README and changeset in place; oxfmt and oxlint clean.
- **SC-002**: A test beside every source file (barrel test included), run in the separate testing workflow.
- **SC-003**: Typecheck and build pass in that workflow once `pnpm install` links the member.
