# Feature Specification: `stackra mcp` installs every persona and agent from schemas with inheritance

**Feature Branch**: `figentra/sta-2787-agents-install`

**Created**: 2026-11-25

**Status**: Planned — revised 2026-11-26 after the CTO's read (BLOCK on the security model); the CTO re-reads the
revision, and ADR 0537 stays Proposed until that read clears it

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
tools (seven after ruling R8) that write Claude Code's native formats (no runtime of our own), a harvest from the
retired Flow console, and Academorix and Stackra's own lanes as the first consumers.

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
  the owner's approval sits. (Revised at the CTO's read of 2026-11-26: the terminal confirmation is a convenience and
  the recorded identity a claim, not a boundary; the boundary is code-owner review of the policy files plus
  `agents check` in CI, AC-048.)
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
  file IO); packages/developer/cli (seven new or widened commands: six new, `agents:list`, `agents:resolve`,
  `agents:validate`, `agents:diff`, `agents:install` and `agents:uninstall`, and `agents:sync` widened; plus the
  widened CI command `agents:check`)
- **Repository settings touched**: `.github/CODEOWNERS` (through its owner-only list, AC-048), in this repository and,
  through their own issues, in each consuming product
- **Public contract change**: yes. Four JSON Schemas (`agent`, `skill`, `layer`, `manifest`, v1); the commands
  `stackra agents list|resolve|validate|install|diff|sync|uninstall|check` and their MCP tools; the `@stackra/mcp`
  exports
- **Cross-service events**: none
- **Tenancy and data**: none (repository files and a user's own config folder only)
- **Security and privacy**: agent permissions. Deny always wins; each layer's effective ceiling is its own policy
  bounded by its parent's, down to the pinned company base, and bounds every agent in or below it; rules outside the
  base enter only through base-approved extensions; `settings.json` receives deny and ask rules and explicit grants,
  never a ceiling; the files that enforce the policy are themselves denied to agents; review (code owners plus
  `agents check` in CI) is the gate for widening. Agent and roster files carry no personal data and no secret values
  (names only)
- **Secrets**: none read or written by the tool; an MCP entry names a secret as `${NAME}` only. The base is read from a
  committed, digest-checked snapshot, so `agents check` in CI needs no credential; refreshing the snapshot is a person's
  run with their own git access (AC-053)
- **ADR needed**: yes, a new ADR: 0537 (Proposed; supersedes ADR 0282 decisions 9 and 10 for agent and skill files,
  amends ADR 0016 and ADR 0503); its number is reserved in `apps/docs/adr/numbers.yaml`
- **New dependencies**: none (zod and yaml are already the package's)
- **Deploy modes**: none deployed; developer workstation and CI only; air-gapped works from the committed base
  snapshot
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
- **Layer chain**: the layers in `extends` order, nearest first: user, repo, product, base. It is not an agent's
  `extends` chain: an agent may extend a sibling in its own layer, but every layer extends exactly one farther layer
  until the base.
- **Own policy**: the `policy` a layer file states: the most it asks to let agents in or below it have.
- **Effective ceiling**: a layer's own policy intersected with its parent layer's effective ceiling, following the
  layer chain; the base's effective ceiling is its own explicit policy (the `BASE_POLICY` table). The most an agent in
  or below that layer may be given.
- **Extension**: a rule, tool or MCP server outside the base's own ceiling that the base approves for one named product
  layer (`BASE_EXTENSIONS`); the only way a product admits something the base lacks.
- **Grant**: an allow rule a layer writes into `settings.json` for the whole session (main thread and every agent). It
  must sit inside the effective ceiling of the nearest layer of the stack being installed. A ceiling is never written
  as a grant.
- **Root layer**: a layer that extends nothing. Only the pinned company base may be one.
- **Widening**: any change that gives an agent or the session more than the last install did: a new tool, a higher
  mode, a new grant, a new MCP server, a new or changed hook, a new skill `allowed-tools` entry or `shell` value, or a
  removed deny or ask rule.
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
- **AC-011**: THE resolver SHALL treat every `deny` and `ask` set (`tools.deny`, `permissions.deny`,
  `permissions.ask`, a layer's `policy.deny` and `policy.ask`) as a union over the whole chain and stack; IF a nearer
  definition tries to remove or replace a deny or ask entry, or turn an ask into an allow, THEN THE resolver SHALL
  refuse it with `deny_not_removable`.
- **AC-012**: THE resolver SHALL compute each layer's effective ceiling along the layer chain (never along an agent's
  `extends` chain) as the layer's own policy intersected with its parent layer's effective ceiling, a missing part of
  the own policy taking the parent's; IF a layer's own policy names a tool, mode, allow rule, MCP server or hook outside
  its parent's effective ceiling (and outside its base-approved extensions, AC-043) THEN THE resolver SHALL refuse the
  layer with `above_ceiling`, never silently narrowing it; AND IF a resolved agent's `tools.allow`,
  `permissions.mode`, `mcpServers`, `hooks` or skill `allowed-tools`, or a layer's grant, falls outside the effective
  ceiling of the nearest layer of the stack being installed (which lies inside every farther layer's) THEN THE resolver
  SHALL refuse it with `above_ceiling`, naming the agent, the field and the layer whose own policy set the bound.
- **AC-013**: IF a farther layer lists an agent id under `disabled` THEN THE resolver SHALL leave that agent out of
  every install below it, and a nearer layer SHALL NOT re-enable it.
- **AC-014**: WHEN `agents resolve <id>` runs THE command SHALL return the resolved agent and, for every field path
  and every list element, the layer, file and line it came from.
- **AC-015**: WHEN an agent's `model` names a tier THE resolver SHALL map it through the nearest layer whose `models`
  map defines that tier, and SHALL refuse an unmapped tier with `unknown_model_tier`.
- **AC-016**: THE base layer adapter SHALL read the company roster `team/roster.yml` (`version: 1`, platform/figentra
  at a pinned commit of `origin/main`, from the committed snapshot of AC-053) as a base layer, one abstract agent per
  persona, the leadership personas included once their pull request lands, without a change to the roster file.

### Installing

- **AC-017**: WHEN `agents install` runs with the project scope THE command SHALL write each installable resolved
  agent to `.claude/agents/<id>.md` with Claude Code subagent frontmatter, each skill to
  `.claude/skills/<name>/SKILL.md` with its supporting files, the repository-level MCP servers to `.mcp.yaml` when the
  repository has one or `.mcp.json` otherwise, the guard and its rules under `.claude/hooks/` (AC-031, AC-040), and the
  manifest, and SHALL write nothing else; to `.claude/settings.json` `permissions` it SHALL write exactly the union of
  every layer's deny and ask rules (the base table included) and the allow rules a layer lists under `grants`, and
  SHALL NOT write any rule that appears only in a ceiling (`policy`), nor any agent's own rule.
- **AC-018**: WHEN `agents install` runs with the user scope THE command SHALL write the same agent and skill files,
  the guard and its rules under the Claude Code user folder (`CLAUDE_CONFIG_DIR`, else `~/.claude`), SHALL NOT write any
  settings file, and every installed agent's frontmatter guard hook SHALL enforce the whole base deny and ask table,
  settings-enforced (S) rows included (AC-040), so a user-scope agent carries the full table with no settings file.
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
  folder (`.claude-plugin/plugin.json`, `agents/`, `skills/`, `.mcp.json`, and `hooks/hooks.json` carrying the guard,
  AC-052), and IF an agent relies on a field Claude Code ignores for plugin subagents (its own `hooks`, `mcpServers`,
  `permissionMode`) THEN it SHALL refuse with `plugin_drops_field` naming the agent and field; the base guard hook
  and an agent's own deny and ask rules are not such a field, because the plugin-level guard carries them (AC-052).

### Security

- **AC-039**: THE base layer SHALL carry an explicit ceiling from a fixed, documented table (the Claude Code built-in
  tools it allows by name, `maxMode` `acceptEdits`, an explicit list of allow rules, an explicit MCP server allowlist,
  and a hooks ceiling) and its deny and ask tables; WHEN a product layer has no policy THE resolver SHALL bound its
  agents by that ceiling; IF the base lacks any of the five ceilings THEN THE validator SHALL refuse it with
  `no_ceiling`, never treating a ceiling as unbounded.
- **AC-040**: THE generated guard SHALL enforce every row of the base deny and ask tables, the settings-enforced (S)
  rows as well as the guard-only (G) rows, from its own rules file, as a `PreToolUse` hook matching `Bash`, `Read`,
  `Edit`, `Write`, `NotebookEdit`, `WebFetch` and `mcp__.*`, run from one `settings.json` entry (project scope) and from
  every installed agent's frontmatter; WHERE a row cannot be expressed as a settings rule (a force flag in any
  position, a refspec, the current branch for `git reset --hard`, a package runner's `dlx` behind global options such as
  `pnpm --filter x dlx`, `core.hooksPath` set for one command) the guard is its only enforcement; the guard SHALL deny
  the protected-branch and package-runner forms while allowing the same commands on other branches and `pnpm exec`,
  `pnpm run`, `pnpm install` and `pnpm --filter x <script>`.
- **AC-027**: IF an install would widen (Glossary) any agent, skill, grant, hook or the deny and ask sets compared
  with the manifest's recorded ceilings (AC-050), or install a new agent with a write tool or an MCP server THEN THE
  command SHALL list each widening and SHALL write it only after a person confirms at an interactive terminal; a
  non-interactive run, every MCP tool call and a run whose environment shows it was started from an agent session (the
  variables Claude Code documents for its own shell, such as `CLAUDECODE`) SHALL refuse it with
  `widening_needs_a_person`. THE spec and the guide SHALL state that this confirmation is a convenience that stops an
  accident, not a security boundary (an agent can drive a pseudo-terminal), and that the boundary is review (AC-048).
- **AC-028**: THE validator SHALL refuse `permissions.mode` `bypassPermissions` at every layer, and `auto` unless the
  base layer's policy allows it.
- **AC-029**: THE validator SHALL refuse an MCP server entry that fails the `.mcp.yaml` rules of `@stackra/mcp`
  (an unpinned `npx`/`uvx` package, a secret in a remote server, a literal credential), a remote `url` that is not
  `https` except to a loopback host, a reserved server name, or a server outside the effective ceiling's
  `mcpServers` (AC-012).
- **AC-030**: THE install SHALL write only inside `.claude/`, `.mcp.yaml` or `.mcp.json` (project scope), the base
  snapshot folder `.agents/vendor/base/` (only on `--refresh-base`, AC-053) or the Claude Code user folder (user scope),
  and SHALL refuse a skill supporting file that is a symbolic link or whose path leaves the skill folder.
- **AC-031**: WHEN an agent carries scoped deny or ask rules (`Bash(git push *)`) THE install SHALL render them as a
  `PreToolUse` hook in the agent's frontmatter that runs the generated guard `.claude/hooks/stackra-agent-guard.mjs`,
  which SHALL deny (or ask) exactly the calls the rules match and SHALL never answer allow; THE guard SHALL fail closed
  (deny every call it is asked about) when its rules file is unreadable, empty, fails its schema, lacks the base table,
  or does not match the SHA-256 that both the hook's command line and the manifest record (AC-047).

- **AC-035**: WHEN a person confirms a widening THE install SHALL record in the manifest who the terminal's git
  identity says confirmed it (a claim, as a commit author is, not proof), when (UTC, to the second) and each widening
  (agent or session, field, before, after, layer), and SHALL keep earlier records; `agents check` treats the record as
  a pointer for reviewers, never as an approval (AC-048).

- **AC-041**: IF a layer extends nothing and is not the pinned company base (the platform/figentra roster read through
  the adapter, from the committed snapshot whose source and digest the product layer file names) THEN THE resolver
  SHALL refuse it with `root_not_base`; this covers a `--from` layer, a product layer file with no `extends` and a
  repo or user layer that names no parent, and no CLI flag or environment variable changes which base is accepted.
- **AC-042**: WHEN the resolver checks a rule against a ceiling THE resolver SHALL use subsumption through the one
  rule matcher (`matchRule`): a rule passes when every call it can match is matched by some ceiling rule of the same
  tool (a narrower rule inside an allowed pattern, such as `Bash(pnpm exec playwright test *)` inside `Bash(pnpm *)`),
  and SHALL treat any case the matcher cannot decide as outside (fail closed), never comparing exact strings.
- **AC-043**: WHERE a product layer needs a tool, allow rule or MCP server outside the base's own ceiling THE resolver
  SHALL admit it only from a base-approved extension entry (`BASE_EXTENSIONS`, reviewed with the base table at risk
  R3) that names the product layer and its repository, the item, a reason and the approving pull request; IF a layer's
  policy or grant names such an item without a matching extension THEN THE resolver SHALL refuse it with
  `above_ceiling` and a hint naming the extension path; an extension never raises `maxMode`, never adds a hook, and is
  still subject to every deny and ask rule. THE Academorix `ready-to-merge` label rule, the exact `npx -y
<tool>@<version>` rules and any exact infisical command SHALL enter only this way.
- **AC-044**: THE agent schema v1 SHALL NOT carry a per-agent `permissions.allow` (Claude Code has no per-agent allow;
  subagent frontmatter has no allow field and `settings.json` allows apply to the whole session), and THE validator
  SHALL refuse one with `agent_allow_unsupported`; an allow rule reaches `settings.json` only as a layer `grants` entry,
  which applies to the main thread and every agent and is documented as such.
- **AC-045**: THE base deny table SHALL protect the files that enforce the policy: `Edit` deny rules (which Claude Code
  applies to Edit, Write and NotebookEdit and to Bash redirections and the file commands it recognises) and matching
  guard rows for `.claude/settings.json`, `.claude/settings.local.json`, `.claude/agents/**`, `.claude/skills/**`,
  `.claude/hooks/**`, `.claude/stackra-agents.json`, `.mcp.json` and `.agents/vendor/**`, and the same paths under the
  Claude Code user folder; and `Edit` ask rules for the definition sources `.agents/agents.yaml`, `.agents/agents/**`,
  `.agents/skills/**`, `.agents/overrides/**`, `.agents/hooks/**`, `.agents/models.yaml` and `.mcp.yaml`, so a person
  sees each edit; and the guard SHALL deny a Bash command that writes, moves, deletes, links or changes the mode of a
  protected path (redirects, `tee`, `sed -i`, `cp`, `mv`, `rm`, `ln`, `chmod`, `truncate`, `git checkout --`,
  `git restore`) where the settings rules do not reach.
- **AC-046**: THE base deny table SHALL refuse running `stackra agents install|sync|uninstall` from an agent's Bash, in
  every form the guard can see (`stackra agents …`, `pnpm stackra agents …`, `pnpm exec stackra agents …`,
  `pnpm --filter x exec stackra agents …`, `npx stackra agents …`, `node <path>/stackra… agents …`), as settings rules
  for the plain shapes and guard rows for the rest; the read-only `agents list|resolve|validate|diff|check` stay
  allowed.
- **AC-047**: THE install SHALL record the SHA-256 of the guard script and of its rules file in the manifest and pass
  the rules hash on every guard hook command line, and the guard SHALL compare its rules file with both and fail closed
  on any mismatch (AC-031).
- **AC-048**: THE gate for any widening SHALL be review: the policy files (`.agents/agents.yaml`, `.agents/agents/**`,
  `.agents/skills/**`, `.agents/overrides/**`, `.agents/vendor/**`, `.claude/**`, `.mcp.yaml`, `.mcp.json` and the
  manifest) SHALL be code-owned through the repository's owner-only CODEOWNERS list, and `agents check --base-ref
<ref>` in CI SHALL fail when the head's resolved ceilings widen relative to the base ref's manifest without a widening
  record added in the same change, or when a widening record does not match the computed widening, so the change cannot
  merge without a code owner's review; THE spec and guide SHALL state that the user scope has no such gate and rests
  on the person.
- **AC-049**: THE layer policy SHALL carry a `hooks` ceiling: hooks may be declared by the base and by a product layer
  whose effective ceiling allows product hooks, and IF a repo or user layer declares a hook (on an agent or a skill)
  that the product layer's `policy.hooks.allow` does not list by exact command and, for a script inside the project,
  its SHA-256 THEN THE resolver SHALL refuse it with `hook_not_allowed`.
- **AC-050**: THE manifest `ceilings` SHALL record, per agent and for the session, the tools, mode, MCP servers, the
  deny and ask sets, every hook (event, matcher, command, and the SHA-256 of the command text and of any project script
  it runs), and per skill its `allowed-tools` and `shell`; and THE planner SHALL count as a widening every new tool,
  higher mode, new grant, new MCP server, new or changed hook, new `allowed-tools` entry, changed `shell` and removed
  deny or ask rule, so editing a deny rule out and calling `agents_sync` is refused (AC-027).
- **AC-051**: THE base ceiling SHALL never open a production deploy or a secret write without a prompt: the deny table
  SHALL hold `wrangler deploy`, `wrangler versions deploy`, `wrangler rollback`, `wrangler secret`, `eas submit`,
  `eas update`, `eas secret`, `eas env:create|update|delete`, `encore deploy`, `mcp__encore-cloud__rollout_trigger`;
  the ask table SHALL hold `Bash(node *)`, `mcp__cloudflare-api__execute` and `mcp__encore-cloud__db_query`; MCP allow
  rules SHALL name read-only tools (by exact name or a `mcp__<server>__<verb>_*` prefix) for any server that has write
  tools, server-wide only for documentation-only and local-only servers; the guard SHALL refuse a commit, merge or push
  run with `core.hooksPath` set for that command (`git -c core.hooksPath=…`, `GIT_CONFIG_*` assignments) and
  `git config core.hooksPath`, and `git push --no-verify`; and a fixed list of production deploy probes SHALL each be
  matched by a deny or ask row in a test.
- **AC-052**: WHEN the target is a plugin THE install SHALL render the guard as a plugin-level `hooks/hooks.json`
  `PreToolUse` entry running `${CLAUDE_PLUGIN_ROOT}/hooks/stackra-agent-guard.mjs`, which SHALL enforce the base table
  for every call and an agent's own deny and ask rules for the calls whose hook input names that agent (`agent_type`),
  so the plugin target installs agents that carry scoped rules.
- **AC-053**: THE product layer file SHALL name the base by source, 40-hex commit and digest, and THE install SHALL
  read the base from the committed snapshot `.agents/vendor/base/<commit>/` checked against that digest (refused with
  `layer_digest_mismatch`); only `stackra agents install --refresh-base <commit>`, run by a person with their own git
  access, fetches platform/figentra and rewrites the snapshot; `agents check` in CI SHALL read the snapshot only and
  need no credential.

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
- Layer-level hooks in `settings.json`, except the one guard entry for the base's guarded rules (AC-040); agent-level
  hooks are in scope through the frontmatter.
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
  approval sits there, not in this repository. While the base policy, its deny and ask tables and `BASE_EXTENSIONS`
  live in `@stackra/mcp` (until the roster carries a policy), a change to them is a pull request in this repository at
  risk R3 on a code-owned path.
- **Code owners** (AC-048): the policy paths join the owner-only CODEOWNERS list in this repository and in each
  consuming product; that list is itself owner-owned, so its change needs the owner's review, and GitHub's "require
  review from code owners" must be on for the protected branch.
- **GitHub branch protection** is the boundary for protected branches; the deny table and the guard are defence in
  depth around it, not a replacement.

## Status history

- 2026-11-25 → Draft (STA-2787 session, from the owner's ruling and the CTO's six points)
- 2026-11-25 → Clarified (the CTO's six points; rulings R1 to R9 on PR figentra/stackra#1080; tier raised to big
  with the new ADR 0537) — Approved by leader (Tarek · Stackra Lead) 2026-11-25
- 2026-11-25 → Planned (plan.md, tasks.md; ADR renumbered 0535 → 0537 at the leader's review; the explicit base
  ceiling added at the leader's review) — Approved by leader (Tarek · Stackra Lead) 2026-11-25 (after the explicit
  base ceiling, P-013)
- 2026-11-26: CTO read: BLOCK (the security model). Revised in place, status unchanged: the ceiling follows the layer
  chain with every layer bounded by its parent and only the pinned base as a root (AC-012, AC-041), subsumption through
  `matchRule` (AC-042), base-approved extensions (AC-043), no per-agent allow (AC-044), settings receive denies, asks
  and grants only (AC-017), the enforcement files guarded and the guard's rules hash-checked (AC-045 to AC-047), review
  as the widening gate (AC-048), hooks and removed denies counted as widening (AC-049, AC-050), production deploys
  closed (AC-051), the deny table carried in the user scope and on the plugin target (AC-018, AC-040, AC-052), and the
  base read from a committed snapshot (AC-053). Awaiting the CTO's re-read; ADR 0537 stays Proposed until it clears
  (T027)
