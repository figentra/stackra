# Feature Specification: the developer MCP serves Stackra's conventions as resources and its recipes as prompts

**Feature Branch**: `figentra/sta-2919-mcp-resources-prompts`

**Created**: 2026-11-27

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2919

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: The local developer MCP behind `stackra mcp` answered `initialize`, `ping`, `tools/list` and `tools/call`
only. A coding agent whose client has weak or no skills support got none of Stackra's conventions and no recipe from
the server, so it worked without the rules every change must follow and without the closing `stackra gen --check` and
tests. Batch AI1 (Stackra Boost) item AI1.5, under STA-2796.

### Sources

- `packages/developer/mcp/src/node/functions/serve-local-mcp.function.ts` on `origin/main` (the four methods it
  answered; any other answered `-32601`)
- `packages/developer/skills/src/node/functions/load-skill-set.function.ts` and `packages/developer/skills/assets/`
  (the open rules and skills, and the loader the renderers read)
- `packages/developer/cli/src/node/constants/gen-command.constant.ts` (what `stackra gen --check` reports) and
  `packages/developer/cli/src/node/constants/new-command.constant.ts` (the kinds `stackra new` makes)
- `packages/foundation/contracts/src/core/types/stackra-manifest.type.ts` (the manifest's `errors` section)
- ADR 0282 decisions 5 (local mode), 6 (layer 1, open conventions) and 7 (layer 2 stays hosted); the MCP
  specification's `resources/*` and `prompts/*` methods and the resource-not-found code `-32002`
- FR-001 to FR-008: the branch's diff against `main` and its tests

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none (`apps/docs` pages only)
- **Services touched**: none
- **Packages touched**: packages/developer/mcp (the local server's resources and prompts)
- **Public contract change**: additive. `@stackra/mcp/node`: `ServeLocalMcpOptions` takes an optional `skills`
  (`readonly AgentDocument[]`, default `loadSkillSet()`). MCP surface of `stackra mcp`: `initialize` advertises
  `resources` and `prompts`; new methods `resources/list`, `resources/templates/list`, `resources/read`, `prompts/list`
  and `prompts/get`; resources `stackra://guidelines`, `stackra://manifest`, `stackra://manifest/<member>`,
  `stackra://rules/<name>`, `stackra://skills/<name>`; prompts `add-feature`, `fix-gen-drift`, `explain-refusal`.
  Tools and their results are unchanged; no export is removed.
- **Cross-service events**: none
- **Tenancy and data**: none. Local developer tooling only; it reads committed manifests and the shipped skill
  documents, never tenant data (ADR 0155).
- **Security and privacy**: read-only. Resources and prompts read files under the repository root and the
  `@stackra/skills` package; they run no command and write nothing. A URI is matched against fixed prefixes and a
  manifest's own `member` key, never joined into a path. Prompt arguments are checked by zod before anything is read;
  quoted output is capped at 20,000 characters.
- **Secrets**: none
- **ADR needed**: no (implements ADR 0282 decision 5 within decisions 6 and 7)
- **New dependencies**: none from npm; `@stackra/mcp` now depends on the workspace package `@stackra/skills` (same
  developer tier, no cycle: `@stackra/skills` depends on `@stackra/contracts` only)
- **Deploy modes**: same in all three (developer tooling; not deployed)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/mcp/README.md`, `packages/developer/mcp/AGENTS.md`,
  `apps/docs/src/docs/cli.mdx` and `cli.ar.mdx`, `apps/docs/src/docs/clients-and-tools.mdx` and
  `clients-and-tools.ar.mdx`, a minor changeset for `@stackra/mcp`
- **Lane**: full (a new MCP surface and an option on an exported type)
- **Change risk**: R1 (developer tooling; read-only; no runtime or tenant path changes)

## Glossary _(full lane)_

- **Local developer MCP**: the stdio MCP server `stackra mcp` starts inside a repository (`serveLocalMcp`).
- **Agent documents**: the parsed rules and skills of `@stackra/skills` (`loadSkillSet()`); other kinds (sub-agents,
  commands, hooks) are not served.
- **Always-on rule**: a rule with `always: true`, which every rendered assistant loads into every session.
- **Recipe**: a prompt's user message: an ordered list of steps over the server's own tools.
- **Finish steps**: the three steps every recipe and the guidelines end with: `stackra gen`, `stackra gen --check`,
  the tests (`finishSteps`).
- **Layer 1 / layer 2**: ADR 0282 decisions 6 and 7: open conventions, served locally; know-how such as fix
  playbooks, served by the hosted server only.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - An agent reads the conventions from the server (Priority: P1)

A coding agent in a client without skills support lists the server's resources and reads `stackra://guidelines`. It
gets the always-on rules in full, the rules and skills to read on request with their URIs, and how every change ends.

**Why this priority**: the audit's finding: such clients got no conventions at all.

**Independent Test**: `resources/list` and `resources/read` over stdio against a fixture repository, and the built
`stackra mcp` against real manifests with the shipped skill set.

**Acceptance Scenarios**:

1. **Given** the shipped skill set, **When** `stackra://guidelines` is read, **Then** it holds every always-on rule's
   body under an "Always" section, every other rule and every skill by URI and description, and the finish steps.
2. **Given** a rule or skill name from the list, **When** its URI is read, **Then** the answer is that document's
   Markdown body.

---

### User Story 2 - An agent reads the repository's manifests as resources (Priority: P1)

An agent reads `stackra://manifest` or one member's `stackra://manifest/<member>` and gets the committed JSON.

**Independent Test**: `resources/read` over stdio after writing a manifest in a fixture repository.

**Acceptance Scenarios**:

1. **Given** committed manifests, **When** `resources/list` is called, **Then** it lists one
   `stackra://manifest/<member>` per manifest, its key URI-encoded, and each reads as that manifest.
2. **Given** no manifest for `billing`, **When** `stackra://manifest/billing` is read, **Then** the answer is the
   error `-32002` naming the URI.

---

### User Story 3 - An agent follows a recipe that ends with the gate (Priority: P1)

An agent asks for `add-feature`, `fix-gen-drift` or `explain-refusal` and gets a recipe filled from the repository,
with the manifest or skill it needs attached, ending with `stackra gen --check` and the tests.

**Independent Test**: `prompts/list` and `prompts/get` over stdio; the recipe's last steps; the attachments.

**Acceptance Scenarios**:

1. **Given** `add-feature` with a member that has a manifest, **When** it is got, **Then** the first message names the
   member and its package and the second embeds `stackra://manifest/<member>`.
2. **Given** `explain-refusal` with a code two manifests declare, **When** it is got, **Then** the recipe quotes both
   declaring entries with their members and embeds `stackra://skills/backend-errors`.
3. **Given** a server that lists a `test` tool, **When** any recipe is got, **Then** its third finish step runs the
   tests with `test`; without one, with `verify`.

### Edge Cases

- **EC-01**: a manifest that is not JSON: `resources/list` leaves the per-member entries out; `stackra://manifest`, a
  member's manifest and a prompt that reads manifests answer `-32603` naming the cause.
- **EC-02**: a URI with malformed percent-encoding, or a rule name under `stackra://skills/`: `-32002`.
- **EC-03**: `add-feature` for a member with no manifest, or a repository with none: the recipe sends the agent to the
  `new` tool (`stackra new service` or `stackra new package`) and attaches nothing.
- **EC-04**: `explain-refusal` for a code no manifest declares: the recipe names the other places a code comes from;
  the errors skill is attached only when the skill set has it.
- **EC-05**: `fix-gen-drift` output longer than 20,000 characters: the tail is kept with a cut notice; output holding a
  backtick fence is quoted in a longer fence.
- **EC-06**: a skill set that cannot be loaded: the resource or prompt request answers `-32603`; tools keep working.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE local server SHALL advertise `resources` and `prompts` in its `initialize` capabilities and answer
  `resources/list`, `resources/templates/list`, `resources/read`, `prompts/list` and `prompts/get`. Sources: the
  server on `origin/main`, the MCP specification
- **FR-002**: `resources/list` SHALL list `stackra://guidelines`, `stackra://manifest`, one
  `stackra://manifest/<member>` per committed manifest (key URI-encoded), one `stackra://rules/<name>` per rule and one
  `stackra://skills/<name>` per skill, each with a title, description and MIME type, and every listed URI SHALL read.
  Sources: `load-skill-set.function.ts`, `read-manifests.function.ts`
- **FR-003**: `stackra://guidelines` SHALL hold every always-on rule's body (headings one level down outside code
  fences), every other rule and every skill by URI and description, where the manifests are, and the finish steps.
  Sources: ADR 0282 decision 6, `assets/rules/`
- **FR-004**: WHEN a URI names nothing the server serves THE server SHALL answer `-32002` with the URI; WHEN a manifest
  is not JSON THE read SHALL answer `-32603` naming the cause. Sources: the MCP specification
- **FR-005**: `prompts/list` SHALL list `add-feature` (`feature` required, `member`), `fix-gen-drift` (`output`) and
  `explain-refusal` (`code` required, `message`) with titles and descriptions, the argument list derived from each
  prompt's zod object. Sources: the MCP specification
- **FR-006**: `prompts/get` SHALL answer user messages: the recipe text first, then each embedded resource it needs
  (`add-feature`: the chosen member's manifest; `explain-refusal`: the `backend-errors` skill when present), and every
  recipe SHALL end with the finish steps. Sources: `gen-command.constant.ts`, ADR 0294 decision 22
- **FR-007**: THE finish steps SHALL name the `test` tool for the tests when the server lists one and `verify`
  otherwise, and the recipes SHALL name only `stackra new` kinds that exist (`service`, `package`). Sources:
  `new-command.constant.ts`
- **FR-008**: WHEN a prompt is unknown, a required argument is missing, an argument is unknown, or `code` is not
  snake_case THE server SHALL answer `-32602` before reading any manifest. Sources: the server's tool-argument check

### Key Entities

- **LocalKnowledge**: the repository root, the agent documents and the server's tool names; built per request.
- **LocalResource**: a listed resource (URI, name, title, description, MIME type).
- **PromptMessage**: a user message holding text or an embedded resource.

## Acceptance criteria

- **AC-001**: WHEN a client initializes THE server SHALL advertise `tools`, `resources` and `prompts`.
- **AC-002**: WHEN `resources/list` is called THE server SHALL list the guidelines, every manifest, each member's
  manifest, each rule and each skill, and each listed URI SHALL read with the listed MIME type.
- **AC-003**: WHEN `stackra://guidelines` is read THE text SHALL hold the always-on rules in full, the on-request
  rules and skills by URI, and the finish steps.
- **AC-004**: IF a URI names nothing served THEN THE server SHALL answer `-32002` with the URI.
- **AC-005**: WHEN any prompt is got THE recipe SHALL end with `stackra gen`, `stackra gen --check` and the tests,
  through `test` when listed and `verify` otherwise.
- **AC-006**: WHEN `add-feature` names a member that has a committed manifest THE server SHALL attach that
  member's manifest as `stackra://manifest/<member>`.
- **AC-007**: WHEN `explain-refusal` names a code that a committed manifest declares THE server SHALL quote every
  declaring entry with its member and attach `stackra://skills/backend-errors` when the skill set holds it.
- **AC-008**: IF a prompt or its arguments are invalid THEN THE server SHALL answer `-32602` before reading any
  manifest.

## Success Criteria _(mandatory)_

- **SC-001**: the built `stackra mcp`, driven over stdio on box 2 with real committed manifests and the shipped skill
  set, lists 23 resources and 3 prompts, reads the guidelines and a member manifest, and answers `-32002` and `-32602`
  for a bad URI and a missing argument — verified by: manual (stdio proof)
- **SC-002**: every new path is covered by a unit test, and the server tests fail with the server change reverted —
  verified by: unit (revert check)

## Out of scope

- Resource subscriptions and `notifications/resources/list_changed` (manifests are read on every request instead).
- Prompt argument completion (`completion/complete`).
- Layer-2 recipes and fix playbooks (ADR 0282 decision 7: the hosted server).
- The tool descriptions and tool commands of STA-2873, which a later rebase reconciles with the tool names here.

## Assumptions

- The MCP clients in use accept the `-32002` resource-not-found code of the 2024-11-05 to 2025-06-18 revisions.
- Committed manifests are small enough to send whole (each is a few tens of kilobytes).

## Amendments

- 2026-11-27 · review: AC-006 split into AC-006 (`add-feature`) and AC-007 (`explain-refusal`) to keep each in EARS form; the former AC-007 is AC-008. FR-008 says "before reading any manifest" (the skill set is still loaded first, EC-06). P-005 to P-007 added in plan.md for FR-001, FR-003 and FR-008, each with a test (T008).

## Status history

- 2026-11-27 · — → Draft · Claude (STA-2919 session) · written from the branch diff
- 2026-11-27 · Draft → Clarified · Claude (STA-2919 session) · questions answered from the diff and ADR 0282
- 2026-11-27 · Clarified → Planned · Claude (STA-2919 session) · plan.md
- 2026-11-27 · Planned → Tasked · Claude (STA-2919 session) · tasks.md
- 2026-11-27 · Tasked → Implementing · Claude (STA-2919 session) · T001 to T007 on the branch
