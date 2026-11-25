# Feature Specification: `stackra mcp` installs every persona and agent from schemas with inheritance

**Feature Branch**: `figentra/sta-2787-agents-install`

**Created**: 2026-11-25

**Status**: Planned — approval requested from the leader

**Tier**: big

**Approver**: leader (technical-only stops, under the owner's delegation): the Clarified stop now, the Planned stop
after the leader reads plan.md

**ADR**: [0537](../../../apps/docs/src/docs/adr/0537-agent-schemas-layers-and-native-install.mdx) (Proposed); the tier is big because of the new ADR (CTO ruling R4, 2026-11-25)

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2787

**Clarifications status**: complete

**Input**: The owner retired Figentra Flow completely on 2026-11-25: "instead we need stackra mcp to install all
personas and agents and each product .agents has it's agents by our schemas and inheritance". The CTO's six points
(binding, 2026-11-25) set the scope: an agent schema with `extends` and per-field merge rules, a companion skill
schema, three layers (the Figentra company base, each product's `.agents/`, repo and user overrides), six Stackra MCP
tools that write Claude Code's native formats (no runtime of our own), a harvest from the retired Flow console, and
Academorix and Stackra's own lanes as the first consumers.

### Sources

- Claude Code docs (read 2026-11-25): subagents `https://code.claude.com/docs/en/sub-agents`, skills
  `https://code.claude.com/docs/en/skills`, plugin manifest `https://code.claude.com/docs/en/plugins-reference`,
  settings `https://code.claude.com/docs/en/settings`, permissions `https://code.claude.com/docs/en/permissions`, MCP
  `https://code.claude.com/docs/en/mcp`. The plan's "Claude Code formats" table cites each field used.
- `packages/developer/mcp` (`serveLocalMcp`, `LOCAL_TOOLS`, `syncMcpConfig`, `checkMcpConfig`, the `.mcp.yaml` rules)
- `packages/developer/console/src/core/functions/tools-of.function.ts` (a command declared `tool` is an MCP tool;
  `:` becomes `_` in its name)
- `packages/developer/cli/src/node/commands/agents-sync.command.ts`, `agents-check.command.ts`,
  `constants/mcp-command.constant.ts`, `functions/install-item.function.ts`, `functions/line-diff.function.ts`
- `.agents/README.md`, `.agents/models.yaml`, `.agents/agents/*.md` (today projected by the workflow tooling's sync,
  `fflow sync`)
- ADR 0016 (agents source of truth), 0282 (decisions 5, 9 and 10), 0453 (decision 11), 0502, 0503
- The company roster: `platform/figentra` `team/roster.yml` on `origin/main` (commit 71349c3, 30 personas,
  `version: 1`); the four leadership personas are on the unmerged branch `team/leaders-v2-2026-11-23`, where the
  Stackra lead is still `tariq` (the canonical name is Tarek)
- Academorix (read-only): `.agents/agents/` (38 agent files, a README, a status note and 9 skill folders),
  `.agents/models.json` (tiers economy, standard, frontier), `.claude/agents/` (11 files),
  `.claude/stackra-lane-prompts.md` (lanes L1 to L8), `.claude/who-handles-what.md` (the session personas Idris,
  Selim, Lukas, Tarek)
- Flow harvest list (`.claude/flow-retirement-inventory.md` section 7, Academorix) and the Flow checkouts, read-only:
  `agent-desk` branch `origin/figentra/console-v9-scoring` (`shared/agents.ts`, `shared/agent-name.ts`,
  `docs/agents-migration.md`, `docs/skill-scoring.md`), `agent-desk-v7-core` (`shared/apps.ts`, `shared/iam.ts`,
  `shared/kill.ts`, `shared/flow-guard-rules.ts`)

## Clarifications

### Session 2026-11-25 (CTO, binding)

- **Schema**: `schemas.figentra.com/stackra/agents/agent/v1.json` with id, name, persona (character, voice), role,
  description, model, tools (allow, deny), skills, MCP servers, instructions, permissions and `extends`; merge rules
  defined per field (replace, append or deny-wins); cycles refused; a companion skill schema.
- **Layers**: the company base (the 30-persona roster), then each product repo's `.agents/`, then optional repo or
  user overrides. The nearest layer wins under the merge rules; one validator covers every layer.
- **Tools**: `agents.list`, `agents.resolve` (with where each field came from), `agents.validate`, `agents.install`,
  `agents.diff`, `agents.sync` (house names per R2: `agents_list`, `agents_resolve`, `agents_validate`,
  `agents_install`, `agents_diff`, `agents_sync`; never the dotted form). Install writes Claude Code's native formats only; it is idempotent, never overwrites a
  hand edit without showing a diff, and records what it wrote so it can be removed cleanly.
- **Harvest**: the persona model, skill scoring and the policy and approval schema, listed with what was taken and why.
- **Consumers**: Academorix's `.agents/` and Stackra's lanes; the proof is a product installing its agents into a
  fresh repository and running one.
- **Home**: the existing `stackra mcp`, the house way.

### Session 2026-11-25 (rulings on the draft's open questions, PR figentra/stackra#1080)

CTO (Idris):

- **R1 fflow boundary**: this work depends on the BEHAVIOUR of Stackra's workflow tooling (the spec gate, the sync
  that projects `.agents/` into `.claude/`, the guard hooks), never on the retired Flow console and never on the
  `@figentra-oss` scope or the `fflow` package name. The CTO recommends to the owner that fflow fold into the `stackra`
  CLI; the owner has not confirmed, so nothing here assumes either outcome.
- **R2 tool names**: `@stackra/mcp`'s house convention: command `agents:list` is tool `agents_list` (`toolsOf`).
- **R3 base**: platform/figentra's `team/roster.yml` on `origin/main`. The leaders branch
  (`team/leaders-v2-2026-11-23`) lands through its own pull request first, and is a dependency of this work. The
  canonical Stackra lead name is **Tarek**.
- **R4 ADR**: a new ADR (0537), not amendment notes. It supersedes ADR 0282 decisions 9 and 10 for agent and skill
  files, with links both ways. This makes the spec the big tier: two stops, after Clarified and after Planned.

Leader:

- **R5 base source**: the base layer is fetched by a 40-hex git commit of platform/figentra and read through the roster
  adapter (no conversion yet); a published package comes later through the registry, after STA-2784.
- **R6 schema host**: `$id`s use `https://schemas.figentra.com/stackra/agents/…` (STA-2784's address scheme, whose ADR
  covers the host); the schemas ship inside `@stackra/mcp`, so validation never needs the network.
- **R7 widening**: a person confirms at an interactive terminal, and the install manifest records who, when and what
  widened. A change to the company base itself is a reviewed pull request in platform/figentra (risk R3), which is where
  the owner's approval sits.
- **R8 uninstall**: `agents_uninstall` is the seventh tool.
- **R9 Academorix**: Lukas, Selim and the other session personas install as main-thread agents (`claude --agent`);
  its 9 skill folders under `.agents/agents/` move to `.agents/skills/`, as a consumer migration task (Academorix is
  not edited by this work).

Kept from the draft (not questioned): the pure core lives in `@stackra/mcp` and the commands in `@stackra/cli`; a layer
source is a local path, an installed package at an exact version, or a git repository at a 40-hex commit.

## Impact

- **Apps touched**: apps/docs (the guide, the new ADR 0537, a forward note on ADR 0282, the ADR index)
- **Services touched**: none
- **Packages touched**: packages/developer/mcp (the schemas, the resolver, the renderers, the install planner, the
  file IO); packages/developer/cli (six commands and the existing `agents:sync` and `agents:check`)
- **Public contract change**: yes. Four JSON Schemas (`agent`, `skill`, `layer`, `manifest`, v1); the commands
  `stackra agents list|resolve|validate|install|diff|sync|uninstall|check` and their MCP tools; the `@stackra/mcp`
  exports
- **Cross-service events**: none
- **Tenancy and data**: none (repository files and a user's own config folder only)
- **Security and privacy**: agent permissions. Deny always wins, a layer's ceiling bounds every agent below it, MCP
  server entries are validated, widening needs a person. Agent and roster files carry no personal data and no secret
  values (names only)
- **Secrets**: none read or written; an MCP entry names a secret as `${NAME}` only
- **ADR needed**: yes, a new ADR: 0537 (Proposed; supersedes ADR 0282 decisions 9 and 10 for agent and skill files,
  amends ADR 0016 and ADR 0503); its number is reserved in `apps/docs/adr/numbers.yaml`
- **New dependencies**: none (zod and yaml are already the package's)
- **Deploy modes**: none deployed; developer workstation and CI only
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (CLI and MCP output)
- **Docs to update**: a guide `apps/docs/src/docs/agents/agents-install.mdx`, `.agents/README.md`, ADR 0537, ADR 0282
  (forward note), ADR 0016 (forward note), the ADR index
- **Lane**: full
- **Change risk**: R3 (writes permission configuration that every agent session obeys)

## Glossary

- **Layer**: one source of agent definitions: `base` (company), `product` (a repository's `.agents/`), `repo`
  (`.agents/overrides/` of the repository being installed into) or `user` (the person's own overrides).
- **Definition**: one agent (or skill) file in one layer. **Resolved agent**: every definition of an id, and its
  `extends` chain, merged.
- **Ceiling**: a layer's `policy`: the most an agent in or below that layer may be given.
- **Widening**: any change that gives an agent more than the last install did.
- **Manifest**: `.claude/stackra-agents.json`, the record of every path and settings entry install wrote.

## Acceptance criteria

### Schemas and validation

- **AC-001**: THE package SHALL publish the JSON Schemas `agent/v1.json`, `skill/v1.json`, `layer/v1.json` and
  `manifest/v1.json` with `$id` `https://schemas.figentra.com/stackra/agents/<kind>/v1.json`, generated from the zod
  schemas the resolver uses, and a test SHALL fail when the committed JSON drifts from the zod source.
- **AC-002**: WHEN `agents validate` runs THE command SHALL check every definition of every layer in the stack
  against its schema major and the post-resolution rules, and SHALL report each finding with a snake_case code, the
  layer, the file and the field path, exiting 1 on any error.
- **AC-003**: IF a definition names a field outside its schema (other than under `metadata` or an `x-` key) THEN THE
  validator SHALL refuse it with `unknown_field`.
- **AC-004**: IF a definition's `extends` chain returns to an agent already on the chain, or is deeper than 16 THEN
  THE validator SHALL refuse it with `extends_cycle` or `extends_too_deep`, naming every hop.
- **AC-005**: IF a resolved agent that is not `abstract` has no description or no instruction text THEN THE
  validator SHALL refuse it with `incomplete_agent`; an abstract agent SHALL never be installed.
- **AC-006**: THE validator SHALL refuse an agent id or skill name that Claude Code would not load (the subagent
  `name` and skill name rules, the reserved skill names) and an installed name two layers would render to two files.
- **AC-007**: IF any definition or layer file holds a secret-shaped literal (an MCP `env` or `headers` value that is
  not a `${NAME}` reference, or a token pattern in any string) THEN THE validator SHALL refuse it with
  `secret_literal` and SHALL never print the value.
- **AC-008**: IF a skill definition carries a `score` THEN THE validator SHALL refuse it with `score_is_measured`
  (scores are measured, never typed in).

### Layers and inheritance

- **AC-009**: WHEN the resolver builds the stack THE resolver SHALL order the layers user, repo, product, base
  (nearest first), each from its declared source, and SHALL refuse a layer cycle with `layer_cycle`.
- **AC-010**: WHEN the same id is defined in two layers THE nearer definition SHALL merge over the farther one, and
  WHEN a definition names `extends` THE parent's resolved agent SHALL be merged under it, by the rule of each field in
  the plan's merge table.
- **AC-011**: THE resolver SHALL treat every `deny` set (`tools.deny`, `permissions.deny`, a layer's `policy.deny`)
  as a union over the whole chain and stack; IF a nearer definition tries to remove or replace a deny entry THEN THE
  resolver SHALL refuse it with `deny_not_removable`.
- **AC-012**: IF a resolved agent's `tools.allow`, `permissions.allow`, `permissions.mode`, `mcpServers` or skill
  `allowed-tools` exceeds the ceiling of any layer on its chain THEN THE resolver SHALL refuse it with
  `above_ceiling`, naming the layer whose ceiling it exceeds.
- **AC-013**: IF a farther layer lists an agent id under `disabled` THEN THE resolver SHALL leave that agent out of
  every install below it, and a nearer layer SHALL NOT re-enable it.
- **AC-014**: WHEN `agents resolve <id>` runs THE command SHALL return the resolved agent and, for every field path
  and every list element, the layer, file and line it came from.
- **AC-015**: WHEN an agent's `model` names a tier THE resolver SHALL map it through the nearest layer whose `models`
  map defines that tier, and SHALL refuse an unmapped tier with `unknown_model_tier`.
- **AC-016**: THE base layer adapter SHALL read the company roster `team/roster.yml` (`version: 1`, platform/figentra
  at a pinned commit of `origin/main`) as a base layer, one abstract agent per persona, the leadership personas
  included once their pull request lands, without a change to the roster file.

### Installing

- **AC-017**: WHEN `agents install` runs with the project scope THE command SHALL write each installable resolved
  agent to `.claude/agents/<id>.md` with Claude Code subagent frontmatter, each skill to
  `.claude/skills/<name>/SKILL.md` with its supporting files, the layer policies' rules to `.claude/settings.json`
  `permissions`, the repository-level MCP servers to `.mcp.yaml` when the repository has one or `.mcp.json`
  otherwise, the guard and its rules under `.claude/hooks/` when an agent needs them (AC-031), and the manifest, and
  SHALL write nothing else.
- **AC-018**: WHEN `agents install` runs with the user scope THE command SHALL write the same agent and skill files
  under the Claude Code user folder (`CLAUDE_CONFIG_DIR`, else `~/.claude`) and SHALL NOT write any settings file.
- **AC-019**: WHEN `agents install` runs twice with the same sources THE second run SHALL write no file and SHALL
  report every path unchanged; every written file and the manifest SHALL be byte-identical across machines (stable key
  and list order, and no time stamp outside the widening records of AC-035, which change only when a person confirms
  a widening).
- **AC-020**: THE install SHALL record every written path with its SHA-256, every settings entry with its JSON
  pointer and value, and every layer with its source and digest in the manifest, written last.
- **AC-021**: IF a path install would change differs from the hash the manifest recorded (a hand edit), or exists
  without a manifest entry (a foreign file) THEN THE install SHALL write nothing at all and SHALL return each such
  path with a unified diff and the choices overwrite, keep or move into an override.
- **AC-022**: WHEN the person passes `--overwrite <path>` or `--keep <path>` THE install SHALL overwrite that path,
  or leave it and mark it pinned in the manifest so later syncs report it and leave it.
- **AC-023**: WHEN `agents diff` runs THE command SHALL return the plan (create, update, unchanged, conflict, foreign,
  remove, pinned) and a unified diff per changed path, and SHALL write nothing; WHEN given `--as-override <path>` it
  SHALL also return the override definition that would reproduce a hand-edited agent file.
- **AC-024**: WHEN `agents uninstall` runs THE command SHALL remove every managed path and settings entry the manifest
  lists, keep pinned and hand-edited paths unless `--overwrite` names them, keep a settings entry that existed before
  install, remove the manifest, and leave the repository byte-identical to its state before the first install when
  nothing was edited.
- **AC-025**: WHEN `agents sync` runs THE command SHALL render `.mcp.json` from `.mcp.yaml` as today, then install from
  the repository's `.agents/agents.yaml` and remove what the sources no longer produce; WHEN `agents check` runs it
  SHALL fail on any planned change or validation error, writing nothing.
- **AC-026**: WHEN `agents install --target plugin --out <dir>` runs THE command SHALL write a Claude Code plugin
  folder (`.claude-plugin/plugin.json`, `agents/`, `skills/`, `.mcp.json`), and IF an agent relies on a field Claude
  Code ignores for plugin subagents (`hooks`, `mcpServers`, `permissionMode`) THEN it SHALL refuse with
  `plugin_drops_field` naming the agent and field.

### Security

- **AC-027**: IF an install would widen any agent or layer policy compared with the manifest, or install a new
  agent with a write tool, an allow rule or an MCP server THEN THE command SHALL list each widening and SHALL write it
  only after a person confirms at an interactive terminal; a non-interactive run and every MCP tool call SHALL refuse
  it with `widening_needs_a_person`.
- **AC-028**: THE validator SHALL refuse `permissions.mode` `bypassPermissions` at every layer, and `auto` unless the
  base layer's policy allows it.
- **AC-029**: THE validator SHALL refuse an MCP server entry that fails the `.mcp.yaml` rules of `@stackra/mcp`
  (an unpinned `npx`/`uvx` package, a secret in a remote server, a literal credential), a remote `url` that is not
  `https` except to a loopback host, a reserved server name, or a server outside the layer's `policy.mcpServers`.
- **AC-030**: THE install SHALL write only inside `.claude/`, `.mcp.yaml` or `.mcp.json` (project scope) or the Claude
  Code user folder (user scope), and SHALL refuse a skill supporting file that is a symbolic link or whose path leaves
  the skill folder.
- **AC-031**: WHEN an agent carries scoped deny or ask rules (`Bash(git push *)`) THE install SHALL render them as a
  `PreToolUse` hook in the agent's frontmatter that runs the generated guard `.claude/hooks/stackra-agent-guard.mjs`,
  which SHALL deny (or ask) exactly the calls the rules match and SHALL fail closed on an unreadable rule file.

- **AC-035**: WHEN a person confirms a widening THE install SHALL record in the manifest who confirmed it (the git
  identity of the terminal, as a commit author records it), when (UTC, to the second) and each widening (agent, field,
  before, after, layer), and SHALL keep earlier records.

### Tools and consumers

- **AC-032**: THE local MCP (`stackra mcp`) SHALL serve `agents_list`, `agents_resolve`, `agents_validate`,
  `agents_diff` (read-only) and `agents_install`, `agents_sync`, `agents_uninstall` (writes) from the commands'
  own definitions, with the same `--json` documents.
- **AC-033**: WHEN a fresh git repository runs `stackra agents install --from <product layer>` for a product layer that
  extends the company base THE repository SHALL hold the product's agents in `.claude/agents/`, and
  `claude --agent <id>` SHALL start that agent (the proof run, recorded in the pull request).
- **AC-034**: THE Stackra lanes L1 to L8 SHALL be agents in this repository's `.agents/agents/lanes/`, each extending
  one abstract `stackra-lane` agent that holds their shared rules and extends the base persona `tarek`, and SHALL
  validate and install.
- **AC-036**: WHERE a definition is a session persona (`session: true`) THE install SHALL render it so that
  `claude --agent <id>` starts it as the main session agent, with its `claude.initialPrompt` when it has one.
- **AC-037**: WHEN Academorix migrates to the schema THE migration SHALL map its 38 agent files to agent definitions
  of an `academorix` product layer extending the base, move its 9 skill folders from `.agents/agents/` to
  `.agents/skills/`, install Lukas, Selim and its other session personas as session personas (AC-036), and change
  nothing in Academorix through this work's pull requests.
- **AC-038**: THE docs SHALL carry ADR 0537 (agent schemas, layers and the native install), reserved in
  `apps/docs/adr/numbers.yaml` and listed in the ADR index, and ADR 0282 and ADR 0016 SHALL link forward to it.

## Out of scope

- A runtime, server or database of our own: Claude Code runs the installed agents.
- Running skill benchmarks or computing scores (the Flow scoring engine needs a runner; see the plan's harvest).
- Layer-level hooks in `settings.json` (agent-level hooks are in scope through the frontmatter).
- OpenCode, Kiro and Cursor targets (the schema keeps assistant-specific fields under `claude`, so a target can be added
  later without a v2).
- Hosting `schemas.figentra.com`: STA-2784's ADR covers the host; the files ship in `@stackra/mcp`, so validation
  never needs the network.
- Changing the Academorix repository: its migration (AC-037) runs in that repository, on its own issue.
- Publishing the base layer as a package: it comes later through the registry, after STA-2784.

## Assumptions

- Claude Code's documented formats of 2026-11-25 hold; unknown frontmatter fields are ignored by Claude Code, so a
  newer field never breaks an older Claude Code.
- Claude Code's `claude --agent <id>` starts a project agent as the main session (documented on the subagents page).

## Dependencies

- **The leaders pull request in platform/figentra lands first** (`team/leaders-v2-2026-11-23`, with the Stackra lead
  renamed from `tariq` to the canonical `tarek`); the base pin then moves to that `origin/main` commit. T007, T013 and
  T021 wait on it.
- **Stackra's workflow tooling, by behaviour only** (R1): the spec gate, the sync that projects `.agents/` into
  `.claude/`, and the guard hooks. This work relies on what they do, not on the `fflow` name, the `@figentra-oss`
  scope or the retired Flow console; if the owner folds fflow into the `stackra` CLI, only command names in the docs
  and T022 change.
- **A change to the company base itself** is a reviewed pull request in platform/figentra at risk R3; the owner's
  approval sits there, not in this repository.

## Status history

- 2026-11-25 → Draft (STA-2787 session, from the owner's ruling and the CTO's six points)
- 2026-11-25 → Clarified (the CTO's six points; rulings R1 to R9 on PR figentra/stackra#1080; tier raised to big
  with the new ADR 0537) — Approved by leader (Tarek · Stackra Lead) 2026-11-25
- 2026-11-25 → Planned (plan.md, tasks.md; ADR renumbered 0535 → 0537 at the leader's review) — approval requested
  from the leader
