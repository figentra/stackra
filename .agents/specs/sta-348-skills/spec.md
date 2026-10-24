# Feature Specification: `@stackra/skills`, the agent-neutral source of the open conventions

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Developer tooling

**Clarifications status**: resolved (registry row: entries tbd, no dependencies, template imports none; ADR 0282
decisions 2, 6, 7 and open detail 1; ADR 0286 decisions 6 and 15; owner 2026-10-24: build now, tests run in a later
workflow)

**Input**: Build `@stackra/skills` (developer, registry wave 8, built in the wave-2 lane) for real: every Stackra
skill, rule, sub-agent, command and hook written once in one neutral format (Markdown with frontmatter), which
`@stackra/renderers` writes into each assistant's layout and `stackra agents setup` installs at the user level.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/skills` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none (reads Markdown files only)
- **Secrets**: none
- **ADR needed**: no (ADR 0282 decides the package; ADR 0127 2026-10-24 note places it in developer)
- **New dependencies**: none; `@stackra/contracts` (`workspace:*`), `yaml` and `zod` from the default catalog
- **Deploy modes**: not deployed; a published library read by the CLI and the renderers
- **Lane**: full (a new package)
- **Change risk**: R1 (developer tooling; no runtime path, no auth, tenancy, secrets or HTTP)

## User Scenarios & Testing

### User Story 1 - One document, every assistant (Priority: P1)

A renderer reads the shipped set and gets each document typed by kind, with its name, frontmatter (defaults applied)
and body, so it can write `.claude/`, `.opencode/`, `.kiro/`, `.cursor/rules` or `AGENTS.md` without re-parsing.

**Independent Test**: `src/node/functions/__tests__/load-skill-set.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the package's `assets/`, **When** `loadSkillSet()` runs, **Then** it returns the bundled skills and rules,
   frozen, in kind order and sorted by name.
2. **Given** a root holding all five kind folders, a `README.md` and a stray `.txt`, **When** `loadSkillSet(root)`
   runs, **Then** it returns one document per Markdown file and skips the README and the stray file.

### User Story 2 - A broken document fails loudly (Priority: P1)

An author misspells a frontmatter key, leaves `description` empty, names a file `Naming.md` or writes a hook event no
assistant has. The parser throws `AgentDocumentInvalidError` naming the file and every invalid path.

**Independent Test**: `src/core/functions/__tests__/parse-agent-document.function.test.ts`.

### User Story 3 - Layer 1 only (Priority: P1)

The shipped set holds open conventions only; a document that mentions a Figentra-internal operation (Linear, bot
identities, merge gate, secrets inbox, delegation, spend) fails the loader test.

**Independent Test**: the "ships no Figentra-internal operation" case of the loader test.

### Edge Cases

- CRLF line endings and a byte order mark parse like LF.
- A `---` line after the frontmatter stays in the body.
- Duplicate frontmatter keys are refused (YAML parse error), never last-wins.
- A frontmatter `name` that differs from the path-derived name is refused.
- A skill folder without `SKILL.md` is refused; files beside a `SKILL.md` are supporting files, not documents.

## Requirements

- **FR-001**: The package SHALL be `@stackra/skills` at `packages/developer/skills`, `tier:lib`, with the entries `.`
  and `./node` (ADR 0294 d15, ADR 0127 2026-10-24 note) and the non-code asset path `./assets/*`.
- **FR-002**: `.` SHALL export `parseAgentDocument`, `AgentDocumentKind` (`skill`, `rule`, `subagent`, `command`,
  `hook`), `HookEvent` (`session_start`, `prompt_submit`, `pre_tool_use`, `post_tool_use`),
  `AgentDocumentInvalidError` and the types `AgentDocument`, `SkillDocument`, `RuleDocument`, `SubagentDocument`,
  `CommandDocument`, `HookDocument`, `DocumentIssue` (ADR 0282 d2).
- **FR-003**: `./node` SHALL export `loadSkillSet(root?)`, defaulting to the package's own `assets/` both from `src/`
  and from `dist/`.
- **FR-004**: WHEN a document is parsed THE parser SHALL derive its name from its path (a skill from its folder, the
  others from the file name), require kebab-case, and refuse unknown frontmatter keys.
- **FR-005**: The shipped set SHALL hold only layer-1 content (ADR 0282 d6, d7) and no Figentra-internal operation
  (d4).
- **FR-006**: Versions only through `catalog:` or `workspace:*`; `.` imports no `node:*`.
- **FR-007**: Every source file SHALL carry the Stackra file contract, one declaration per file and TSDoc on every
  export; tests SHALL sit in `__tests__/` and import the runner from `@stackra/testing`.

## Success Criteria

- **SC-001**: The template imports nothing from this package (registry row: none), so no template symbol is unmet.
- **SC-002**: Every public symbol and internal function has a unit test (run in the separate testing workflow).
- **SC-003**: `oxfmt --check` and `oxlint` pass on the package.

## Assumptions

- The renderers are `@stackra/renderers` (ADR 0286 d6), a separate package; this one ships no renderer.
- The shipped documents are copies of the Stackra-authored open conventions in `.agents/`. Moving them (deleting the
  `.agents/` originals and pointing `agents-sync` here, ADR 0282 open detail 1) is a follow-up outside this package.
- The Stackra spec preset (Impact questionnaire, risk and lane rules, ADR 0286 d15) is still entangled with Linear and
  the spec gate; it moves in once STA-298 settles the SDLC.
- No sub-agent, command or hook document ships yet: the repository's sub-agents are Figentra-internal or reviewer
  checklists (layer 2), and the guard hooks are scripts that `@stackra/cli` will carry.
