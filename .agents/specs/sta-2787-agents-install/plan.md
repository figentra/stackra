# Implementation Plan: `stackra mcp` installs every persona and agent from schemas with inheritance

**Spec**: `.agents/specs/sta-2787-agents-install/spec.md` · **Linear**: STA-2787 · **Date**: 2026-11-25

**Input**: Feature specification from `.agents/specs/sta-2787-agents-install/spec.md`

## Summary

Agents become data. Four zod schemas in `@stackra/mcp` (agent, skill, layer, manifest; published as JSON Schema v1)
describe a definition; a pure resolver stacks the layers (user, repo, product, base), follows `extends`, merges each
field by its rule, bounds every layer's own policy by its parent's effective ceiling down to the pinned base, checks
every agent against that ceiling by rule subsumption, and records where each value came from. Pure renderers turn a
resolved agent into Claude Code's own files (subagent Markdown, `SKILL.md` folders, `settings.json` deny, ask and
grant entries, `.mcp.yaml` or `.mcp.json` servers, the guard hook, a plugin folder). A pure planner compares what
would be written with the disk and the install manifest (create, update, unchanged, conflict, foreign, remove,
pinned); the node side applies the plan atomically and writes the manifest last. Seven new or widened CLI commands
(`agents:list`, `agents:resolve`, `agents:validate`, `agents:diff`, `agents:install` and `agents:uninstall` new,
`agents:sync` widened), plus the widened CI command `agents:check`, carry it, and `toolsOf`
serves the seven as MCP tools from `stackra mcp` with no second schema. Claude Code runs the agents; Stackra only writes
its files. The policy is defence in depth around two boundaries Stackra does not own: code-owner review of the policy
files (with `agents check` in CI) for widening, and GitHub branch protection for protected branches.

## Technical Context

- **Language**: TypeScript (ESM), zod 4 (`z.toJSONSchema` for the published files), `yaml` 2 (frontmatter and layer
  files, comments kept when editing `.mcp.yaml`)
- **Members**: `packages/developer/mcp` (`tier:lib`: the core in `.`, file IO in `./node`); `packages/developer/cli`
  (commands); `apps/docs` (guide, ADR notes)
- **Testing**: vitest in `__tests__/` beside the code; temporary-directory repositories for the end-to-end runs
- **Storage**: repository files only; the user scope writes the Claude Code user folder
- **Runtime target**: developer workstation and CI (`agents check`)

## Constitution Check

| Law                                   | Result | Note                                                                             |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI imports `@stackra/mcp`; `@stackra/mcp` imports no CLI or console         |
| Bundle-safe core                      | PASS   | schemas, resolver, renderers, planner are pure in `src/core/`; IO in `src/node/` |
| Secrets (ADR 0009, 0525)              | PASS   | names only (`${NAME}`); secret-shaped literals refused; no value printed         |
| Security                              | PASS   | deny-wins, layer-chain ceilings, guarded policy files, review gates widening     |
| HTTP and events                       | N/A    | none                                                                             |
| Tenancy                               | N/A    | none                                                                             |
| Delegation                            | PASS   | Claude only; security-sensitive tasks on Opus                                    |
| Not built yet (ADR 0011)              | PASS   | no hosted schema site claimed; files ship in the package; hosting is a question  |
| Test placement (ADR 0022)             | PASS   | `__tests__/` beside each file                                                    |
| Versions and catalogs                 | PASS   | no new dependency; changesets minor for `@stackra/mcp` and `@stackra/cli`        |
| Deploy modes (ADR 0076)               | PASS   | nothing deployed                                                                 |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                        |
| Docs and ADRs                         | PASS   | guide; new ADR 0537 (Proposed), forward notes on ADR 0282 and 0016               |

## Deploy modes

| Mode       | Behaviour                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------- |
| SaaS       | nothing deployed; the CLI and local MCP run on the workstation, `agents check` in CI (no key) |
| On-prem    | the same; a git or package source can point at an internal mirror                             |
| Air-gapped | the same: the base is the committed snapshot, other sources are `path` or installed packages  |

## Correctness properties

- **P-001**: every definition that validates also loads in Claude Code: rendered frontmatter uses only documented
  fields with documented values — Validates: AC-001, AC-006, AC-017
- **P-002**: resolution is a pure function of the layer inputs: the same inputs give the same resolved agents,
  provenance and digests, in any file order — Validates: AC-010, AC-014, AC-019
- **P-003**: deny monotonicity: adding a layer or a definition never removes a deny entry from any resolved agent or
  from `settings.json` — Validates: AC-011, AC-031
- **P-004**: ceiling soundness: no installed agent, skill or grant holds a tool, mode, MCP server, hook or allowed
  tool outside the effective ceiling of the nearest layer of the stack, and so outside any farther layer's; the
  agent's own `extends` chain plays no part in the bound — Validates: AC-012, AC-028, AC-029, AC-049
- **P-005**: termination: resolution ends for every input; cycles and chains deeper than 16 are refused —
  Validates: AC-004, AC-009
- **P-006**: idempotence: install after install writes nothing; install then uninstall restores the tree byte for byte
  when nothing was edited — Validates: AC-019, AC-024
- **P-007**: no silent loss: a path whose content differs from the manifest hash is never overwritten without an
  explicit `--overwrite` for that path — Validates: AC-021, AC-022, AC-024
- **P-008**: all or nothing: a refused install leaves the disk unchanged; an interrupted install is completed by the
  next run without a false conflict (content equal to the desired output is adopted) — Validates: AC-020, AC-021
- **P-009**: no widening without a person: an MCP call or a non-interactive run never writes a plan that widens —
  Validates: AC-027
- **P-010**: fencing: every write lands inside the allowed roots; no symbolic link is followed out — Validates: AC-030
- **P-011**: no secret leaves: no output, diff, error or manifest holds a value a validator classed as a secret —
  Validates: AC-007, AC-029
- **P-012**: disabled stays disabled: an agent a farther layer disables is never installed below it — Validates: AC-013
- **P-013**: no unbounded ceiling: every effective ceiling is explicit in all five parts, and every layer chain ends
  at the pinned base, whose table states them all; a parentless layer that is not the pinned base is `root_not_base`,
  a base missing a part is `no_ceiling` — Validates: AC-012, AC-039, AC-041
- **P-014**: ceilings only shrink down the chain: for every layer L with parent M, effective(L) ⊆ effective(M), and a
  layer whose own policy reaches outside effective(M) plus its base-approved extensions is refused, never narrowed
  silently — Validates: AC-012, AC-043
- **P-015**: subsumption is sound: `ruleWithin(r, C)` true implies every call `matchRule(r, ·)` matches is matched by
  some rule in C; an undecidable pair is false — Validates: AC-042
- **P-016**: no ceiling leaks into the session: every allow rule in `settings.json` is a layer grant inside its
  effective ceiling; no ceiling-only rule and no agent rule is ever written there — Validates: AC-017, AC-044
- **P-017**: the guard guards itself: every enforcement file is matched by a deny row (built-in tools and the Bash
  write forms), and the guard denies everything when its rules file is missing, empty, invalid or off its recorded
  hash — Validates: AC-031, AC-045, AC-046, AC-047
- **P-018**: widening is complete: any change that adds a tool, mode, grant, server, hook, allowed tool or shell, or
  removes a deny or ask rule, is a widening, and a recorded widening must match the computed one in CI —
  Validates: AC-027, AC-048, AC-050
- **P-019**: no production deploy without a person: every probe in the fixed production-deploy and secret-write list is
  matched by a deny or ask row, whatever allow rules the ceiling or grants hold — Validates: AC-051
- **P-020**: the deny table travels: project scope, user scope and the plugin target each enforce every base deny and
  ask row (settings plus guard, guard in frontmatter, guard in the plugin's hooks) — Validates: AC-018, AC-040,
  AC-052
- **P-021**: the base is what was reviewed: the base snapshot read by install and check matches the digest the product
  layer file names, and nothing is fetched outside `--refresh-base` — Validates: AC-016, AC-053

## Architecture overview

```text
 sources (path | package@exact | git@sha)                                    Claude Code reads
   base: .agents/vendor/base/<sha> (roster) ─┐                              .claude/agents/<id>.md
   product: <repo>/.agents/agents.yaml ──────┤  load → validate → resolve   .claude/skills/<n>/SKILL.md
   repo: <target>/.agents/overrides/ ────────┤  (pure, provenance) → render .claude/settings.json (permissions)
   user: $STACKRA_AGENTS_HOME/overrides/ ────┘  → plan(disk, manifest)      .mcp.yaml | .mcp.json
                                                → apply (atomic) → manifest  .claude/hooks/stackra-agent-guard.mjs
                                                                             .claude/stackra-agents.json (manifest)
 stackra agents <cmd> (CLI)  ==  stackra mcp tools agents_<cmd> (toolsOf, same definition and --json document)
```

### Dependency boundary (ruling R1)

This design relies on the behaviour of Stackra's workflow tooling, named by what it does: the spec gate (stage and
trace checks), the sync that projects `.agents/` into `.claude/` and `.opencode/`, and the guard hooks in
`.agents/hooks`. It relies on nothing in the retired Flow console and on nothing specific to the `@figentra-oss` scope or
the `fflow` command name. Today that behaviour ships as `fflow`; the CTO recommends folding it into the `stackra` CLI,
and the owner has not confirmed. Either way this work only takes over one behaviour, the agent and skill projection
(T022); the gate and the guard stay where they are, and only command names in the docs change if the fold happens.

### Layer resolution algorithm

1. **Load the stack.** Start at the target repository. Its `.agents/agents.yaml` (layer v1) names the product layer
   (`self`, or `from:` a source when the repository only consumes a product) and that layer's `extends` names the base.
   `--from <source>` replaces the product layer for one run. The repo layer is `.agents/overrides/` of the target when
   present; the user layer is `$STACKRA_AGENTS_HOME/overrides/` (default `~/.stackra/agents/overrides/`) and is read only
   with `--with-user` or the user scope. Each layer extends exactly one farther layer, and the repo and user layers
   extend the product layer implicitly; following `extends` past a layer already seen is `layer_cycle`. The chain must
   end at the pinned base: a layer that extends nothing and is not the base (a `--from` layer with no `extends`, a
   product file with no `extends`) is `root_not_base` (AC-041). The accepted base is fixed in code
   (`BASE_SOURCE`: platform/figentra, `team/roster.yml`, read through the adapter); the pure resolver takes it as a
   parameter only so tests can pass a synthetic base, and no CLI flag or environment variable sets it. Order, nearest
   first: user, repo, product, base.
2. **Fetch and pin.** A `path` source is read in place; a `package` source must be installed at the exact version
   named; a `git` source needs a 40-hex commit. The base is platform/figentra at a commit of `origin/main` (R5), and the
   product layer file names it by source, commit and digest; install and `agents check` read it from the committed
   snapshot `.agents/vendor/base/<commit>/` (the roster file and a `source.json` with the source, commit and digest)
   and refuse a snapshot whose digest differs (`layer_digest_mismatch`, AC-053). Only `stackra agents install
--refresh-base <commit>`, run by a person, fetches: the commit shallow (`git fetch --depth 1 <url> <sha>`) into a bare
   cache under `~/.cache/stackra/agents/`, read with `git archive <sha> <path>` with the person's own git access, then
   the snapshot and the layer file's pin and digest are rewritten (a reviewed, code-owned change, AC-048). CI therefore
   needs no credential, and the air-gapped mode holds. A package source for the base comes later through the registry.
   Each layer's digest is the SHA-256 of its canonical input (sorted paths, normalised line ends).
3. **Parse and validate each definition** against the schema major its `$schema` names (no `$schema` reads as v1 while
   v1 is the only major). Skill folders are validated with the skill schema; the roster through its adapter (step 3a).
   - 3a. **Roster adapter.** `team/roster.yml` `personas[]` becomes abstract agents in a layer named `figentra`: `id`,
     `name`, `role`, `persona.displayName` from `display_name`, `persona.character` from `ring` and the `conventions.look`
     line, `escalatesTo`, `products`, `owns` and the channel rows under `metadata`; `tools` entries that are Claude
     tool names (`Read`, `Grep`, `Glob`, `Write`, `Edit`, `Bash`) become the persona's `tools.allow` (a default the
     product agent may replace within its own layer's ceiling); the adapter gives the base layer the explicit base
     policy of the fixed table `BASE_POLICY` (Data models, "Base policy"): its tool, mode, allow-rule, MCP-server and
     hooks ceilings, its deny and ask tables, which follow the roster's `humans.owner.keeps` (secrets, production
     deploys, history rewrites, destructive deletes), and the `BASE_EXTENSIONS` table (Data models, "Base
     extensions");
     other entries (`Linear MCP`, `gh (read)`) are kept under `metadata.tools` and grant nothing; `permissions.never`
     becomes an instruction section and, where it names a CLI (`force-push`, `gh secret`), a deny rule from the
     adapter's fixed table. The adapter writes nothing back.
4. **Index.** Per layer, definitions by id. A definition with no `extends` whose id also exists farther out shadows it
   (an override); a definition with `extends: <ref>` names its parent (`<id>` searched from its own layer outward, or
   `<layer>:<id>`). A shadowing definition may not change `extends` (`extends_changed_in_override`).
5. **Order.** Depth-first over (layer, id) nodes with three colours; a grey node met again is `extends_cycle` with the
   path; depth above 16 is `extends_too_deep`. The result is each agent's chain from the farthest ancestor to the
   nearest definition.
6. **Merge.** Fold the chain farthest first with the per-field rules (Data models, merge table). Every assignment
   records `{ layer, file, line }` for its field path and, for lists, for each element.
7. **Ceilings.** Deny and ask first: union every `deny` and `ask` of every definition and every layer's `policy.deny`
   and `policy.ask` in the stack (P-003). Then the allow side, along the **layer chain** (never an agent's `extends`
   chain), farthest first:
   - 7a. `effective(base) = BASE_POLICY` (all five parts stated, else `no_ceiling`).
   - 7b. For each nearer layer L with parent M: `allowed(L) = effective(M) ∪ extensions(L)`, where `extensions(L)` is
     the `BASE_EXTENSIONS` entries whose `layer` is L's name and whose `repository` matches the target repository's
     `origin` remote (only for a product layer; a repo or user layer gets none). Every item of L's own policy must lie
     within `allowed(L)`: `tools.allow` and `mcpServers.allow` by name, `permissions.allow` by `ruleWithin` (step 7d),
     `maxMode` by the order `plan` < `dontAsk` < `default` < `acceptEdits` < `auto` (`bypassPermissions` is refused
     always), and `hooks.allow` within M's (for a product layer: allowed when the base's `hooks.product` is true). An
     item outside is `above_ceiling` on the layer, never silently dropped, with a hint naming the extension path when L
     is a product layer (AC-043). A part L leaves out is taken from M. Then `effective(L) = own(L)`, now known to lie
     inside `allowed(L)`.
   - 7c. The bound for the install is `effective(N)`, N the nearest layer of the stack: every installable agent's
     `tools.allow`, `permissions.mode`, `mcpServers`, `hooks` (step 7e), every skill's `allowed-tools`, and every
     layer's `grants.permissions.allow` must lie within it; anything outside is `above_ceiling`, naming the agent (or
     layer), the field and the layer whose own policy set the bound. Because effective ceilings only shrink down the
     chain (P-014), this one check bounds every agent by every layer it is in or below, including an agent that extends
     a sibling in its own layer.
   - 7d. `ruleWithin(r, C)` (subsumption, AC-042): r is within C when some c in C of the same tool covers every call r
     matches. For `Bash`: if r has no `*`, `matchRule(c, r's text)`; if r has wildcards, c must be a prefix pattern (a
     single trailing `*`, ` *` or `:*`, no other `*`) whose literal part (the text before its `*`, so `pnpm ` with its
     space for `Bash(pnpm *)`) is a prefix of r's literal part before its first `*`. For `Read`/`Edit`: the same over gitignore path patterns with the same anchor (`//`,
     `~/`, `/`). For `WebFetch(domain:…)`: equal, or c is `*.d` and r a subdomain of d. For MCP: `mcp__s__*` covers
     every `mcp__s__…`, `mcp__s__v_*` covers `mcp__s__v_…`. Every other pair is false (fail closed, P-015).
   - 7e. Hooks: only the base and a product layer may declare hooks on agents and skills, and a product only when
     `effective(base).hooks.product` is true (it is: the base table allows project-fenced product hooks); a hook from a
     repo or user layer must match an entry of the product layer's `policy.hooks.allow` (exact command, plus the
     SHA-256 of a project script it runs), else `hook_not_allowed` (AC-049).

   No resolution ever runs with an unbounded ceiling (P-013).

8. **Disable.** Drop every id any farther layer lists in `disabled` (P-012).
9. **Models.** Map a `model.tier` through the nearest layer whose `models.claude` defines it; an alias (`sonnet`,
   `opus`, `haiku`, `fable`, `inherit`) or a `claude-*` id passes through.
10. **Post-checks.** Required-after-resolution fields, rendered-name collisions, plugin field loss (plugin target),
    widening against the manifest's ceilings (AC-027, AC-050). Output: resolved agents and skills, provenance, a digest
    per agent, the session's settings entries (denies, asks, grants) and the guard rules.

### Conflict and diff UX

The planner classifies every path it would touch:

| State     | Meaning                                                         | Install does                  |
| --------- | --------------------------------------------------------------- | ----------------------------- |
| create    | not on disk, not in the manifest                                | writes                        |
| update    | on disk with the manifest's hash; the desired content differs   | writes                        |
| unchanged | the disk already holds the desired content (manifest or not)    | adopts it into the manifest   |
| conflict  | on disk with a hash different from the manifest's (a hand edit) | refuses the whole run         |
| foreign   | on disk, not in the manifest, content differs                   | refuses the whole run         |
| remove    | in the manifest, no longer produced                             | deletes when the hash matches |
| pinned    | marked pinned by an earlier `--keep`                            | leaves it, reports it         |

A refused run prints, per path, a unified diff (on disk → would write, three lines of context) and the three ways
out: `--overwrite <path>` (or `--overwrite-all` at an interactive terminal), `--keep <path>` (pin), or
`stackra agents diff --as-override <path>`, which prints the override definition (only the changed frontmatter fields
and instruction sections) to save under `.agents/overrides/` so the edit survives every later sync. The `--json`
document carries the same plan with `diff` strings, so an MCP client shows it as is. Widening is listed separately:
`+ tools.allow: Write (agent console-builder, from layer academorix)`.

## Components and responsibilities

- `agentSchema`, `skillSchema`, `layerSchema`, `manifestSchema` (zod, v1): the one source of every rule a file can
  break; `agentsJsonSchemas()` emits the four JSON Schemas.
- `parseAgentFile(text, path)`: frontmatter plus Markdown body into a definition; `##` headings become keyed
  instruction sections (`slug(heading)`); line numbers kept for provenance.
- `rosterLayer(roster)`: the roster adapter (step 3a), which attaches `BASE_POLICY` and `BASE_EXTENSIONS`.
- `BASE_POLICY`: the explicit base ceiling, deny table and ask table (Data models, "Base policy"), data only, tested
  row by row. `BASE_EXTENSIONS`: the base-approved items per product (Data models, "Base extensions"). `BASE_SOURCE`:
  the one accepted root (platform/figentra, `team/roster.yml`).
- `ruleWithin(rule, ceiling)`: subsumption through `matchRule` (step 7d), false when undecidable.
- `loadLayerStack(root, options)` (node): finds the layers, reads the base snapshot and checks its digest, pins and
  digests the rest; `refreshBase(commit)` (node, CLI only) fetches and rewrites the snapshot.
- `validateDefinitions(stack)`: schema and pre-resolution findings with codes.
- `resolveAgents(stack)`: steps 4 to 10; returns resolved agents, skills, provenance, findings.
- `mergeField(rule, parent, child)`: one function per merge kind (replace, append, keyed, deny-wins, ceiling).
- `renderSubagent(agent)`, `renderSkill(skill)`, `renderSettingsEntries(stack)`, `renderMcpServers(stack)`,
  `renderPlugin(stack, out)`, `renderGuard()`: Claude Code files as text, with the provenance comment.
- `planInstall(desired, disk, manifest, options)`: the state table, the diffs, the widenings, the next manifest.
- `unifiedDiff(before, after)`: a line diff with hunks and context (pure; the CLI's `lineDiff` stays as it is).
- `applyInstall(plan, root)` (node): temp file plus rename per path, JSON settings edited by pointer with key order
  kept, `.mcp.yaml` edited through `yaml`'s document API (comments kept), manifest last; a failed rename restores the
  paths already moved from their backups.
- Commands (`@stackra/cli`): `AgentsListCommand`, `AgentsResolveCommand`, `AgentsValidateCommand`,
  `AgentsDiffCommand`, `AgentsInstallCommand`, `AgentsUninstallCommand`, and the widened `AgentsSyncCommand` and
  `AgentsCheckCommand`; all but `agents:check` (a CI command) declare `tool`, `readOnly` for list, resolve, validate
  and diff.
- `stackra-agent-guard.mjs` (rendered, dependency-free): every hook runs it as
  `node <guard> --rules-sha256 <hex> [--base] [--agent <id>]` on `PreToolUse` with the matcher
  `Bash|Read|Edit|Write|NotebookEdit|WebFetch|mcp__.*`. It first checks the rendered
  `.claude/hooks/stackra-agent-guard.rules.json` (or the user-folder or plugin copy beside it): readable, valid against
  its schema, holding the base table, and equal in SHA-256 to the `--rules-sha256` value and to the manifest's
  `guard.rules` entry; on any failure it denies every call (P-017). With `--base` it applies every base deny and ask
  row, the S rows as well as the G rows, so a frontmatter hook alone carries the whole table where no settings file
  exists (user scope, AC-018) or settings are not read (plugin target, AC-052). With `--agent <id>`, or when the hook
  input's `agent_type` names an agent (plugin target), it applies that agent's own deny and ask rules. It matches the
  `PreToolUse` input with the documented rule forms (`Tool`, `Tool(prefix *)`, `Tool(exact)`, `Read(path)` and
  `Edit(path)` gitignore patterns with `//`, `~/` and `/` anchors, `WebFetch(domain:…)`, `mcp__server`,
  `mcp__server__tool`, `mcp__server__*`), tokenises a Bash command (splitting compound commands, stripping the
  documented wrappers and leading assignments, following `cd <dir> &&`, `git -C <dir>` and `git -c k=v`), recognises
  git's force flags, refspecs, branch deletions, `--no-verify` and `core.hooksPath` in any position, the Bash write
  forms aimed at a protected path (AC-045) and every form of `stackra agents install|sync|uninstall` (AC-046), reads
  the current branch for `git reset --hard`, and answers deny or ask through the hook's JSON output. It never answers
  allow: silence leaves the call to Claude Code's permission rules. Claude Code's hooks page says to use the permission
  system for a hard allow or deny, so the S rows stay in `settings.json` where one exists, and the guard is defence in
  depth around them.
- `matchRule(rule, command)`: the one pure matcher of Claude Code's documented Bash rule semantics (everything before
  the first `*` literal, `*` any text including spaces, a trailing ` *` also matches the bare command, `:*` as a
  trailing wildcard), shared by the guard and the tests; its fixtures are the rows of the permissions page's own
  wildcard table.

## Files and folders

```text
packages/developer/mcp/
  schemas/agents/agent/v1.json                       (generated, committed, shipped in "files")
  schemas/agents/skill/v1.json
  schemas/agents/layer/v1.json
  schemas/agents/manifest/v1.json
  src/core/agents/constants/agent-schema.constant.ts
  src/core/agents/constants/skill-schema.constant.ts
  src/core/agents/constants/layer-schema.constant.ts
  src/core/agents/constants/manifest-schema.constant.ts
  src/core/agents/constants/merge-rules.constant.ts
  src/core/agents/constants/claude-formats.constant.ts      (documented fields, values, reserved names)
  src/core/agents/constants/roster-tool-map.constant.ts
  src/core/agents/constants/base-policy.constant.ts         (the explicit base ceiling, deny and ask tables, BASE_SOURCE)
  src/core/agents/constants/base-extensions.constant.ts     (base-approved items per product, AC-043)
  src/core/agents/types/*.type.ts                          (definition, layer, resolved agent, provenance, plan)
  src/core/agents/errors/agents-finding.error.ts
  src/core/agents/functions/agents-json-schemas.function.ts
  src/core/agents/functions/parse-agent-file.function.ts
  src/core/agents/functions/roster-layer.function.ts
  src/core/agents/functions/validate-definitions.function.ts
  src/core/agents/functions/merge-field.function.ts
  src/core/agents/functions/resolve-agents.function.ts
  src/core/agents/functions/render-subagent.function.ts
  src/core/agents/functions/render-skill.function.ts
  src/core/agents/functions/render-settings-entries.function.ts
  src/core/agents/functions/render-mcp-servers.function.ts
  src/core/agents/functions/render-plugin.function.ts
  src/core/agents/functions/match-rule.function.ts
  src/core/agents/functions/rule-within.function.ts          (subsumption, step 7d)
  src/core/agents/functions/render-guard.function.ts
  src/core/agents/functions/plan-install.function.ts
  src/core/agents/functions/unified-diff.function.ts
  src/core/agents/functions/__tests__/*.test.ts
  src/node/agents/functions/load-layer-stack.function.ts
  src/node/agents/functions/fetch-layer-source.function.ts
  src/node/agents/functions/refresh-base.function.ts         (`--refresh-base`, the only base fetch)
  src/node/agents/functions/read-install-state.function.ts
  src/node/agents/functions/apply-install.function.ts
  src/node/agents/functions/claude-user-dir.function.ts
  src/node/agents/functions/__tests__/*.test.ts              (temporary-repository end-to-end runs)
  src/node/agents/functions/__tests__/fixtures/              (synthetic base, product, repo, user layers)
  src/index.ts, src/node/index.ts                            (exports)
  tools/gen-agents-schemas.mjs                               (writes schemas/ from the zod source)
  AGENTS.md, README.md
packages/developer/cli/src/node/
  commands/agents-list.command.ts
  commands/agents-resolve.command.ts
  commands/agents-validate.command.ts
  commands/agents-diff.command.ts
  commands/agents-install.command.ts
  commands/agents-uninstall.command.ts
  commands/agents-sync.command.ts                            (widened)
  commands/agents-check.command.ts                           (widened)
  commands/__tests__/agents-*.command.test.ts
  constants/commands.constant.ts
  constants/mcp-command.constant.ts                          (the agents commands join toolsOf)
.agents/agents.yaml                                          (Stackra's own layer: product, extends figentra)
.agents/vendor/base/<commit>/                                (the committed base snapshot and its source.json)
.github/CODEOWNERS                                           (policy paths, through the owner-only list, AC-048)
.agents/agents/lanes/stackra-lane.md                         (abstract; the shared lane rules)
.agents/agents/lanes/l1-foundation.md … l8-template-pro.md
.agents/README.md
apps/docs/src/docs/agents/agents-install.mdx
apps/docs/src/docs/adr/0537-agent-schemas-layers-and-native-install.mdx   (new, Proposed; drafted with the spec)
apps/docs/src/docs/adr/0282-developer-experience-skills-cli-mcp-and-vellum-as-the-sdlc.mdx (forward note)
apps/docs/src/docs/adr/0016-agents-source-of-truth.mdx       (forward note)
apps/docs/src/docs/adr/index.mdx
apps/docs/adr/numbers.yaml                                   (0537 reserved)
.changeset/agents-install.md
```

## Data models and migrations

No database. Four file formats, all `version`ed by their `$schema` URL.

### Agent v1 (`.agents/agents/<id>.md`: YAML frontmatter, Markdown body = instructions)

```yaml
---
$schema: https://schemas.figentra.com/stackra/agents/agent/v1.json
id: console-builder # ^[a-z][a-z0-9-]{0,62}$; the installed `name`
extends: figentra:rasim # optional; <id> or <layer>:<id>
abstract: false
name: Rasim
role: Console builder
description: Builds and changes screens in apps/console from a brief. Use for any console UI work.
persona:
  displayName: "Rasim · Console (AI)" # rendered first in description and as the opening line
  character: { look: "stylised soft 3D", ring: "#5B8DEF", color: blue } # color: a Claude Code colour name
  voice: { tone: plain, person: second, rules: ["short sentences", "names the file it changed"] }
model: { tier: executor } # or an alias / claude-* id / inherit
effort: medium
tools: { allow: [Read, Grep, Glob, Write, Edit, Bash], deny: [WebFetch] }
permissions:
  mode: default # default | acceptEdits | plan | dontAsk | auto (ceiling-checked)
  deny:
    [{ rule: "Bash(git push *)", reason: "the integrator pushes", source: "roster: never merge" }]
  ask: []
skills: [heroui-react, code-review]
mcpServers:
  - heroui-pro # a name the repository already configures
  - playwright: { command: npx, args: ["-y", "@playwright/mcp@0.0.41"] }
claude: { isolation: worktree, maxTurns: 80, memory: project, background: false } # passthrough, documented only
session: false # true: a session persona, started with `claude --agent <id>` (AC-036); may set claude.initialPrompt
disabled: false
metadata: { owns: ["lanes console-revamp"], escalatesTo: owner }
---
```

The body follows the closing `---`: each level-two heading (for example "Mission") opens one instruction section,
keyed by the heading's slug.

### Merge table (per field; farthest first, nearest last)

| Field                         | Rule      | Detail                                                                                                                                              |
| ----------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$schema`                     | own       | each definition is read by its own major; the result is the internal model                                                                          |
| `session`                     | replace   | a session persona renders `initialPrompt` from `claude.initialPrompt` (AC-036)                                                                      |
| `id`, `extends`, `abstract`   | own       | never inherited; `abstract` defaults to false                                                                                                       |
| `name`, `role`, `description` | replace   | nearest non-empty wins                                                                                                                              |
| `persona.*`                   | keyed     | deep merge by key; each leaf replaces                                                                                                               |
| `model`, `effort`             | replace   | tier mapped after the merge (step 9)                                                                                                                |
| `tools.allow`                 | replace   | then checked against the install bound (step 7c); outside is `above_ceiling`                                                                        |
| `tools.deny`                  | deny-wins | union over the chain; `$remove` and `$replace` refused                                                                                              |
| `permissions.mode`            | replace   | must be at or below the install bound's `maxMode` (step 7c)                                                                                         |
| `permissions.allow`           | refused   | not in agent v1: `agent_allow_unsupported` (AC-044); a layer `grants` entry is the only allow written to `settings.json`                            |
| `permissions.ask`             | deny-wins | union; an `ask` can become a `deny` below, never an `allow`                                                                                         |
| `permissions.deny`            | deny-wins | union; a rule in both `allow` and `deny` resolves to deny                                                                                           |
| `skills`                      | append    | ordered union; `{ $remove: [...] }` and `{ $replace: [...] }` accepted                                                                              |
| `mcpServers`                  | keyed     | by server name; a nearer entry replaces the whole entry; each entry validated                                                                       |
| instructions (body sections)  | keyed     | by heading slug: same slug replaces, new slugs append; `instructions: replace` in frontmatter drops the parent body; `{ $remove: [slug] }` accepted |
| `claude.*`                    | keyed     | passthrough fields, each leaf replaces                                                                                                              |
| `hooks`                       | append    | per event, matchers appended; fenced to the project (AC-030); base and product only unless the product allows it (7e); every new one widens         |
| `disabled`                    | deny-wins | true anywhere farther stays true (P-012)                                                                                                            |
| `metadata`                    | keyed     | deep merge; never rendered into a permission                                                                                                        |

### Base policy (`BASE_POLICY`, the company base's explicit ceiling; the CTO reads these values)

The roster has no policy yet, so the adapter attaches this fixed table to the base layer. It is data in
`base-policy.constant.ts` (a code-owned path, AC-048), tested row by row, and changes only through a reviewed pull
request (risk R3). The allow side is a **ceiling**: it bounds what layers may grant and agents may hold, and is never
written into `settings.json` itself (AC-017, P-016). When the
roster carries its own policy, the roster's wins and the table is retired. Sources: the shared settings files in use
today, Stackra's `.claude/settings.json` and Academorix's `.claude/settings.json`, and the servers in Stackra's
`.mcp.yaml` and Academorix's `.mcp.json`; personal `settings.local.json` approvals are not company policy and were left
out.

- **`tools.allow`** (Claude Code built-in tools, by their documented names, code.claude.com/docs/en/tools-reference):
  `Read`, `Grep`, `Glob`, `LSP`, `Edit`, `Write`, `NotebookEdit`, `Bash`, `WebFetch`, `WebSearch`, `Skill`, `Agent`,
  `SendMessage`, `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode`, `EnterWorktree`, `ExitWorktree`, `Monitor`,
  `TaskCreate`, `TaskGet`, `TaskList`, `TaskUpdate`, `TaskStop`, `TodoWrite`, `ToolSearch`, `ListMcpResourcesTool`,
  `ReadMcpResourceTool`, `ReportFindings`. Left out on purpose: tools that publish or send outside the repository or
  act on the claude.ai account (`Artifact`, `PushNotification`, `SendUserFile`, `SendFeedback`, `ShareOnboardingGuide`,
  `ListPlugins`, `SearchPlugins`, `ListSkills`, `SearchSkills`, `SuggestPluginInstall`, `SuggestSkills`), tools that
  schedule beyond the session (`CronCreate`, `CronDelete`, `CronList`, `RemoteTrigger`, `ScheduleWakeup`), and
  `PowerShell`, `REPL`, `Workflow`, `WaitForMcpServers`, `EndConversation`, `SubagentHandback` (no product agent
  needs them today). A product that needs one asks for a base change.
- **`maxMode`**: `acceptEdits`. `auto` is not in the table, so it is refused; `bypassPermissions` is refused always.
- **`hooks`**: `product: true` (a product layer may declare hooks on its agents and skills, fenced to the project and
  recorded as widenings); repo and user layers only through the product's `policy.hooks.allow` (step 7e). The guard
  hook is the base's own and is always present.
- **`permissions.allow`** (the ceiling of rules a layer may grant; checked by subsumption, step 7d), CTO-narrowed
  2026-11-25 and again 2026-11-26:
  - from Stackra's shared settings: `Bash(turbo *)`, `Bash(mint *)`, `Bash(docker ps*)`, `Bash(docker logs *)`,
    `Bash(docker compose *)`, `Bash(docker build *)`, `Bash(lefthook *)`, `Bash(gitleaks *)`, `Bash(oxfmt *)`,
    `Bash(oxlint *)`, `Bash(shfmt *)`, `Bash(jq *)`, `Bash(pnpm *)`, `Bash(mise *)`, `Bash(git *)`, `Bash(cd *)`,
    `Bash(encore *)`, `Bash(wrangler *)`, `Bash(eas *)` (the deploy and secret forms of the last three are denied
    below, AC-051); `Bash(node *)` moved to the ask table (2026-11-26: it runs arbitrary code, so every Bash pattern
    rule can be bypassed through it);
  - MCP rules, server-wide only for servers with no write tools: documentation servers `mcp__context7`,
    `mcp__heroui-react`, `mcp__heroui-native`, `mcp__uniwind`, `mcp__cloudflare-docs`, `mcp__resend-docs`,
    `mcp__aws-knowledge`, and local-only servers `mcp__encore` (the app on the workstation) and `mcp__playwright` (a
    local browser); for servers that also write, read-only tools only: `mcp__linear__get_*`, `mcp__linear__list_*`,
    `mcp__linear__search_*`; `mcp__encore-cloud__app_list`, `mcp__encore-cloud__env_list`,
    `mcp__encore-cloud__build_list`, `mcp__encore-cloud__build_logs`, `mcp__encore-cloud__rollout_list`,
    `mcp__encore-cloud__rollout_get`, `mcp__encore-cloud__rollout_logs`, `mcp__encore-cloud__rollout_watch`,
    `mcp__encore-cloud__infra_list`, `mcp__encore-cloud__cron_list`, `mcp__encore-cloud__db_schema`,
    `mcp__encore-cloud__api_describe`, `mcp__encore-cloud__metrics_query`, `mcp__encore-cloud__source_*`,
    `mcp__encore-cloud__telemetry_*`, `mcp__encore-cloud__trace_*`; `mcp__cloudflare-api__search`,
    `mcp__cloudflare-api__docs`, `mcp__cloudflare-api__whoami`; and for `expo` and `posthog` the tools each server
    annotates `readOnlyHint: true` at the version the products pin, listed by exact name in T028 (no server-wide rule);
  - and `WebFetch(domain:…)`
    for `code.claude.com`, `docs.anthropic.com`, `opencode.ai`, `turborepo.com`, `pnpm.io`, `heroui.com`, `encore.dev`,
    `docs.expo.dev`, `mintlify.com`, `infisical.com`, `developers.cloudflare.com`, `vitest.dev`, `github.com`,
    `raw.githubusercontent.com`, `ai-sdk.dev`, `linear.app`;
  - in place of `Bash(npx *)` (arbitrary package execution, dropped): the tools the products' agents and skills
    actually run through npx, by the lockfile-pinned `pnpm exec` form: `Bash(pnpm exec playwright *)`,
    `Bash(pnpm exec expo *)`, `Bash(pnpm exec sanity *)` (Playwright and Expo in both repositories' skills, Sanity in
    Academorix's). These are explicit for a product whose layer does not allow `Bash(pnpm *)` (they sit inside
    `Bash(pnpm *)` by subsumption, so a product may also grant them under it). A one-off tool outside the lockfile,
    `npx -y <tool>@<exact version> …`, is outside the base ceiling and enters only as a base extension for that product
    (AC-043), never a wildcard on the package.
  - dropped: `Bash(infisical *)` (`infisical run` injects secrets into any command). An exact infisical command a
    product needs is a base extension for that product (AC-043), still under the deny rows below.
  - not in the base ceiling: `Bash(gh pr edit * -R academorix/academorix-legacy --add-label ready-to-merge)`. It is the
    first base extension (Base extensions below): the owner's label rule of 18 Nov lets Academorix agents set
    `ready-to-merge`, one label per train when it is ready; the Academorix layer then grants it (T026, AC-037).
  - `Bash(pnpm *)` would also admit `pnpm dlx <package>`, which fetches and runs a package like `npx`; the CTO ruled
    (2026-11-25) that the deny table closes it and the other package runners (see "package runners" below).
  - The broad rules that stay (`Bash(git *)`, `Bash(wrangler *)`, `Bash(pnpm *)`) are bounded by the deny and ask
    tables below and by each product's own deny and ask rules, which always win. They are a ceiling, not a grant: a
    product grants a narrower rule inside them when it needs one without a prompt.
  - Stated plainly: `Bash(pnpm *)` and `Bash(git *)` run project code (package scripts, git hooks), so no Bash pattern
    is a sandbox around them. A production deploy is closed by the deny rows below and, as the boundary, by keeping
    production credentials off workstations and behind the deploy pipeline's environment approval; protected branches
    are closed by GitHub branch protection. The deny table and the guard are defence in depth around both.
- **`mcpServers.allow`** (the servers the products configure today): `aws-knowledge`, `betterstack`,
  `cloudflare-api`, `cloudflare-docs`, `context7`, `elevenlabs`, `encore`, `encore-cloud`, `expo`, `figma`, `github`,
  `heroui-native`, `heroui-native-pro`, `heroui-pro`, `heroui-react`, `linear`, `next-devtools`, `playwright`,
  `posthog`, `resend`, `resend-docs`, `sanity`, `sentry`, `stripe`, `uniwind`, and `stackra` (the local developer MCP
  this work serves). A new server needs a base pull request at risk R3, or a base extension for one product. Being on
  this list lets a layer configure the server; using its tools without a prompt needs an allow rule above.
- **`protectedBranches`**: `[main]`, the branches the git rules below protect.
- **`policy.deny`** (the deny table; never removable below). Each row says where it is enforced:
  **S** = a `settings.json` `permissions.deny` rule (Claude Code applies it to the main conversation and to
  subagents); **G** = the generated guard (AC-031, AC-040), run as a `PreToolUse` hook from `settings.json`, from every
  installed agent's frontmatter and, on the plugin target, from the plugin's `hooks/hooks.json`, for what a settings rule
  cannot express. The guard also enforces every S row itself (P-020), so the table holds where no settings file is
  written (user scope) or read (plugin target).
  - secrets (S): `Read(//**/.env)`, `Read(//**/.env.*)`, `Read(//**/.dev.vars)`, `Read(//**/*.pem)`,
    `Read(//**/*.key)`, `Read(~/.ssh/id_*)`, `Read(~/.aws/**)`, `Read(~/.config/gh/**)`, `Read(~/.git-credentials)`,
    `Read(~/.npmrc)`, `Read(~/.netrc)`, `Bash(printenv*)`, `Bash(env)`, `Bash(infisical export*)`,
    `Bash(infisical secrets get*)`, `Bash(infisical secrets set*)`, `Bash(infisical token*)`, `Bash(gh secret *)`,
    `Bash(encore secret set*)`, `Bash(security find-generic-password*)`, `Bash(security find-internet-password*)`,
    `Bash(security dump-keychain*)`;
  - secrets read through Bash (G): a Bash command naming a path the secret `Read` rows cover (`cat .env`, `source
.env`, `. ./.dev.vars`, `cp ~/.aws/credentials x`) where Claude Code's own Bash analysis does not reach (it covers
    `cat`, `head`, `tail`, `sed`, `tee` and redirects); best effort, since a program that opens files itself is not
    visible to any rule;
  - production deploys and secret writes (S for the plain shapes, G behind runners and global options such as
    `pnpm exec wrangler deploy`, `pnpm --filter x exec eas submit`, `npx wrangler deploy`, `wrangler --env prod deploy`;
    AC-051): `Bash(encore deploy*)`, `Bash(wrangler deploy*)`, `Bash(wrangler versions deploy*)`,
    `Bash(wrangler rollback*)`, `Bash(wrangler secret*)`, `Bash(eas submit*)`, `Bash(eas update*)`,
    `Bash(eas secret*)`, `Bash(eas env:create*)`, `Bash(eas env:update*)`, `Bash(eas env:delete*)`,
    `mcp__encore-cloud__rollout_trigger`; and (G) `eas build … --auto-submit`;
  - the files that enforce the policy (S as `Edit` rules, which Claude Code applies to Edit, Write and NotebookEdit
    and to Bash redirects and the file commands it recognises; G for the other Bash write forms: `cp`, `mv`, `rm`,
    `ln`, `chmod`, `truncate`, `sed -i`, `git checkout --`, `git restore`; AC-045): `Edit(/.claude/settings.json)`,
    `Edit(/.claude/settings.local.json)`, `Edit(/.claude/agents/**)`, `Edit(/.claude/skills/**)`,
    `Edit(/.claude/hooks/**)`, `Edit(/.claude/stackra-agents.json)`, `Edit(/.mcp.json)`, `Edit(/.agents/vendor/**)`,
    and the same under the user folder (`Edit(~/.claude/settings.json)`, `Edit(~/.claude/agents/**)`,
    `Edit(~/.claude/skills/**)`, `Edit(~/.claude/hooks/**)`, `Edit(~/.claude/stackra-agents.json)`; the guard reads
    `CLAUDE_CONFIG_DIR` when it is set). `.claude/` is also one of Claude Code's protected paths, which prompt in every
    mode but `bypassPermissions` (refused here); the deny turns that prompt into a refusal. The definition sources
    are in the ask table instead, so agents can still help author them with a person seeing each edit;
  - running the installer from an agent (S for the plain shapes, G for the rest; AC-046): `Bash(stackra agents install*)`,
    `Bash(stackra agents sync*)`, `Bash(stackra agents uninstall*)`, `Bash(pnpm stackra agents *)`,
    `Bash(pnpm exec stackra agents *)`; the guard covers `pnpm --filter x exec stackra agents …`, `npx stackra agents …`,
    `node <path>/stackra… agents install|sync|uninstall` and the `mise exec --` and one-level `sh -c` forms. The
    read-only `agents list|resolve|validate|diff|check` stay allowed, and the MCP tools stay available because they
    refuse every widening (AC-027);
  - package runners that fetch and run an arbitrary package (S for the plain shapes, G for the rest; CTO ruling
    2026-11-25): `Bash(pnpm dlx *)`, `Bash(pnpx *)`, `Bash(bunx *)`, `Bash(yarn dlx *)`, and `Bash(bun x *)` (Bun's
    documented spelling of `bunx`). A trailing ` *` also matches the bare command, and Claude Code strips wrappers and
    leading assignments first, so `timeout 30 pnpm dlx x` and `CI=1 bunx x` are caught by S. A settings prefix cannot
    see past a runner's global options, so the guard denies `dlx` after any of them: `pnpm --filter x dlx …`,
    `pnpm -F x dlx …`, `pnpm -C dir dlx …`, `pnpm --dir dir dlx …`, `pnpm -w dlx …`, `pnpm -r dlx …`,
    `pnpm --silent dlx …`, `yarn --cwd dir dlx …`, and the same commands behind `mise exec … --` or one level of
    `sh -c` / `bash -c`. `pnpm exec`, `pnpm run`, `pnpm install` and `pnpm --filter x <script>` stay allowed: they run
    only what the lockfile installed;
  - destructive deletes (S): `Bash(rm -rf /)`, `Bash(rm -rf / *)`, `Bash(rm -rf ~*)`, `Bash(rm -rf $HOME*)`;
  - skipping the commit hooks (S and G): `Bash(LEFTHOOK=0*)`, `Bash(git config core.hooksPath*)`,
    `Bash(git config --local core.hooksPath*)`; the guard is the authority, because Claude Code matches rules past a
    leading variable assignment, and it also refuses `git commit --no-verify` and `-n`, `git push --no-verify`, and a
    commit, merge, rebase, cherry-pick, am or push run with `core.hooksPath` set for that command (`git -c
core.hooksPath=/dev/null commit …`, `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_n`/`GIT_CONFIG_VALUE_n` assignments,
    `GIT_CONFIG_PARAMETERS`);
  - history rewrites, any branch (S): `Bash(git filter-branch *)`, `Bash(git filter-repo *)` (a trailing ` *` also
    matches the bare command);
  - global git configuration (S): `Bash(git config --global *)`;
  - force pushes to a protected branch (S for the shapes agents write, G for every shape): `Bash(git push --force * main)`,
    `Bash(git push --force-with-lease * main)`, `Bash(git push -f * main)`, `Bash(git push * main --force)`,
    `Bash(git push * main --force-with-lease)`, `Bash(git push * main -f)`, `Bash(git push * +main)`. The guard also
    catches a force flag in any position, combined short flags (`-uf`), `--force-with-lease=<ref>`, `--force-if-includes`,
    refspecs `HEAD:main`, `+HEAD:main`, `refs/heads/main`, and `git -C <dir>`, `git -c k=v` and wrapper forms;
  - deleting a protected branch (S for the common shapes, G for all): `Bash(git push * :main)`,
    `Bash(git push * --delete main)`, `Bash(git push --delete * main)`, `Bash(git push * -d main)`,
    `Bash(git branch -d main)`, `Bash(git branch -D main)`, `Bash(git branch --delete main)`,
    `Bash(git branch --delete --force main)`; the guard covers the remaining forms (`:refs/heads/main`, flags after
    the name, several names). "Deleting branches on main" means deleting `main` itself, locally or on the remote
    (confirmed by the CTO, 2026-11-25);
  - `git reset --hard` on a protected branch (G only): a settings rule cannot see the current branch, so the guard reads
    it (`git rev-parse --abbrev-ref HEAD` in the command's effective directory, after `cd <dir> &&` or `-C <dir>`) and
    denies when it is protected, detached on a protected branch's commit, or unknown (fail closed).
  - Harmless neighbours stay allowed: `git push origin feature`, `git push --force-with-lease origin feature`,
    `git push origin main` (no force), `git push --force origin main-backup`, `git branch -d feature`,
    `git reset --hard` on a feature branch and `git config user.name …` all pass the deny table; the tests list
    each one. Likewise `wrangler dev`, `wrangler types`, `eas build` (no `--auto-submit`), `eas whoami`,
    `encore run`, `stackra agents diff` and edits to `.agents/specs/**`.
- **`policy.ask`** (the ask table; never removable below, never turned into an allow; S rows in `settings.json`
  `permissions.ask` and enforced by the guard as well): `Bash(node *)` (arbitrary code), `mcp__cloudflare-api__execute`
  (reads and writes through one tool), `mcp__encore-cloud__db_query` (production data), and the agent and policy
  definition sources (AC-045): `Edit(/.agents/agents.yaml)`, `Edit(/.agents/agents/**)`, `Edit(/.agents/skills/**)`,
  `Edit(/.agents/overrides/**)`, `Edit(/.agents/hooks/**)`, `Edit(/.agents/models.yaml)`, `Edit(/.mcp.yaml)`, and the
  user layer `Edit(~/.stackra/agents/**)`. Claude Code prompts for a matching ask rule even when an allow rule or the
  mode would approve it.

### Base extensions (`BASE_EXTENSIONS`, AC-043)

The one reviewed path for an item outside the base ceiling. Data in `base-extensions.constant.ts`, beside
`BASE_POLICY` and changed the same way (a code-owned pull request at risk R3); it moves to platform/figentra with the
policy when the roster carries one. Each entry:

```yaml
- layer: academorix # the product layer's name
  repository: github.com/academorix/academorix-legacy # matched against the target's origin remote
  permissions.allow:
    ["Bash(gh pr edit * -R academorix/academorix-legacy --add-label ready-to-merge)"]
  reason: "the owner's label rule of 18 Nov: Academorix agents set ready-to-merge, one label per train"
  approvedIn: "<pull request reference>"
```

An entry may name `tools.allow`, `permissions.allow` and `mcpServers.allow` items; never `maxMode`, `hooks` or a deny
or ask change. The table test checks that no entry is matched by a deny row as a whole, that each entry names a layer,
a repository, a reason and an approving pull request, and that an entry for one layer is never applied to another.
The repository binding is a convenience against mistakes, not a proof (a remote can be renamed locally); the items are
reviewed rules whichever repository uses them, and the policy files that name the layer are code-owned (AC-048).

### Skill v1 (`.agents/skills/<name>/SKILL.md` plus supporting files)

Claude Code's `SKILL.md` frontmatter fields (`name`, `description`, `when_to_use`, `argument-hint`, `arguments`,
`disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context`,
`agent`, `background`, `hooks`, `paths`, `shell`, `license`, `compatibility`, `metadata`), plus Stackra's `extends`
(sections merge like agent instructions; `allowed-tools` checked against the install bound by subsumption, and a new
entry is a widening; `disallowed-tools` deny-wins; `hooks` bounded like agent hooks (step 7e); a changed `shell` is a
widening, AC-050), `source` (a
third-party skill: package, exact version, integrity; never vendored), and `evals` (benchmark cases: `id`,
`difficulty` 1 to 5, `prompt`, `check` command). A `score` field is refused (AC-008).

### Layer v1 (`.agents/agents.yaml`)

```yaml
$schema: https://schemas.figentra.com/stackra/agents/layer/v1.json
name: academorix # the `<layer>:` prefix
kind: product # product | repo | user (a file may not declare `base`; the base comes only from BASE_SOURCE)
extends: # required: a layer that extends nothing is `root_not_base` (AC-041)
  {
    name: figentra,
    source: { git: "git@github.com:figentra/figentra.git", ref: "<40-hex>", path: team/roster.yml },
    snapshot: .agents/vendor/base/<40-hex>/, # committed; read by install and check (AC-053)
    digest: "sha256-…",
  }
agents: ./agents # folder of agent files (default)
skills: ./skills
models: { claude: { economy: haiku, standard: sonnet, frontier: opus } }
policy: # this layer's own ceiling; bounded by the parent's effective ceiling (step 7b), never written to settings
  maxMode: acceptEdits
  tools: { allow: [Read, Grep, Glob, Write, Edit, Bash, WebFetch] }
  permissions:
    allow: [
        "Bash(pnpm *)",
        "Bash(gh pr edit * -R academorix/academorix-legacy --add-label ready-to-merge)",
      ] # 2nd: extension
    deny:
      [
        {
          rule: "Bash(gh secret *)",
          reason: "secrets stay with the owner",
          source: "roster rule 3",
        },
      ]
    ask: []
  mcpServers: { allow: [heroui-pro, linear, playwright] }
  hooks: { allow: [] } # hooks a repo or user layer may add (exact command, plus sha256 of a project script)
grants: # written to settings.json for the whole session (main thread and every agent); each inside the ceiling
  permissions:
    allow:
      [
        "Bash(pnpm exec playwright test *)",
        "Bash(gh pr edit * -R academorix/academorix-legacy --add-label ready-to-merge)",
      ]
disabled: []
install: { scope: project, target: claude }
```

### Manifest v1 (`.claude/stackra-agents.json`, committed with the project install)

```json
{
  "$schema": "https://schemas.figentra.com/stackra/agents/manifest/v1.json",
  "generator": "@stackra/cli 0.34.0",
  "scope": "project",
  "layers": [
    {
      "name": "figentra",
      "kind": "base",
      "source": { "git": "…", "ref": "…", "path": "team/roster.yml" },
      "digest": "sha256-…"
    },
    {
      "name": "academorix",
      "kind": "product",
      "source": { "path": ".agents" },
      "digest": "sha256-…"
    }
  ],
  "entries": [
    {
      "path": ".claude/agents/console-builder.md",
      "kind": "agent",
      "id": "console-builder",
      "sha256": "…",
      "resolved": "sha256-…",
      "state": "managed"
    },
    {
      "path": ".claude/skills/heroui-react/SKILL.md",
      "kind": "skill-file",
      "skill": "heroui-react",
      "sha256": "…"
    },
    {
      "path": ".claude/settings.json",
      "kind": "settings-entry",
      "pointer": "/permissions/deny",
      "value": "Bash(gh secret *)",
      "from": "academorix",
      "preexisting": false
    },
    { "path": ".mcp.yaml", "kind": "mcp-server", "name": "linear", "sha256": "…" }
  ],
  "guard": { "script": "sha256-…", "rules": "sha256-…" },
  "ceilings": {
    "session": {
      "grants": ["Bash(pnpm exec playwright test *)"],
      "deny": ["Bash(gh secret *)", "…"],
      "ask": ["Bash(node *)", "…"],
      "hooks": [
        {
          "event": "PreToolUse",
          "matcher": "Bash|Read|Edit|Write|NotebookEdit|WebFetch|mcp__.*",
          "command": "node .claude/hooks/stackra-agent-guard.mjs --rules-sha256 … --base",
          "commandSha256": "…",
          "scriptSha256": "…"
        }
      ]
    },
    "agents": {
      "console-builder": {
        "tools": ["Bash", "Edit", "Glob", "Grep", "Read", "Write"],
        "mode": "default",
        "mcpServers": ["heroui-pro"],
        "deny": ["Bash(git push *)"],
        "ask": [],
        "hooks": [
          { "event": "PreToolUse", "matcher": "…", "commandSha256": "…", "scriptSha256": "…" }
        ]
      }
    },
    "skills": { "heroui-react": { "allowedTools": [], "shell": null, "hooks": [] } }
  },
  "widenings": [
    {
      "confirmedBy": "<git user.name> <git user.email>",
      "confirmedAt": "2026-11-25T10:42:07Z",
      "changes": [
        {
          "agent": "console-builder",
          "field": "tools.allow",
          "before": ["Read"],
          "after": ["Read", "Write"],
          "layer": "academorix"
        }
      ]
    }
  ]
}
```

Entries are sorted by path then pointer. `ceilings` is what the widening check compares with (AC-050): a new tool,
mode, grant, server, hook (or a changed hook command or script hash), `allowedTools` entry or `shell` value, and any
deny or ask rule missing from the new set, is a widening. `guard` holds the hashes the guard checks itself against
(AC-047). `widenings` (R7, AC-035) is append-only: one record per confirmed widening, with who the terminal's git
identity says confirmed it (a claim, as a commit author is), when (UTC) and each change; it is the only time stamp in
the file, so a run with no widening stays byte-identical (AC-019). It is a pointer for reviewers; the approval is the
code owner's review of the change that adds it (AC-048). A user-scope manifest lives in the user folder and is never
committed.

### Versioning (v1 and v2 side by side)

- A schema is closed per major (`additionalProperties: false` outside `metadata` and `x-` keys), so a typo fails.
- Additive, optional fields ship as revisions of v1 at the same URL (`x-revision` in the file); an older CLI reports
  `unknown_field` with "update @stackra/cli (schema revision n)".
- A breaking change is v2 at `…/agent/v2.json`. The resolver keeps one parser per major and an upgrade function
  (`upgradeAgentV1`) into the internal model, so a v1 base and a v2 product resolve together. `agents validate
--upgrade` rewrites v1 files as v2. v1 stays readable for at least two CLI minors after v2 ships and while any
  manifest in the organisation records a v1 layer. A file without `$schema` reads as v1 until v2 ships, then is refused.
- The manifest has its own major; a newer CLI reads an older manifest and rewrites it on the next install.

## Contracts

| Command (CLI)                 | MCP tool           | Read-only | Input (also the tool's JSON Schema)                                                                                                                                                                              |
| ----------------------------- | ------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stackra agents list`         | `agents_list`      | yes       | `--from`, `--with-user`, `--layer`, `--include-abstract`                                                                                                                                                         |
| `stackra agents resolve <id>` | `agents_resolve`   | yes       | `id`, `--from`, `--with-user`, `--provenance` (default on in `--json`)                                                                                                                                           |
| `stackra agents validate`     | `agents_validate`  | yes       | `--from`, `--with-user`, `--upgrade` (CLI writes; refused as a tool)                                                                                                                                             |
| `stackra agents diff`         | `agents_diff`      | yes       | `--from`, `--scope`, `--target`, `--as-override <path>`                                                                                                                                                          |
| `stackra agents install`      | `agents_install`   | no        | `--from`, `--scope project\|user`, `--target claude\|plugin`, `--out`, `--overwrite <path>…`, `--keep <path>…`, `--only <id>…`, `--refresh-base <commit>` (CLI only; refused as a tool and from an agent's Bash) |
| `stackra agents uninstall`    | `agents_uninstall` | no        | `--scope`, `--overwrite <path>…`                                                                                                                                                                                 |
| `stackra agents sync`         | `agents_sync`      | no        | none (reads `.agents/agents.yaml`; renders `.mcp.json` as before)                                                                                                                                                |
| `stackra agents check`        | none (CI command)  | yes       | `--base-ref <ref>` (CI: compare ceilings with the base ref's manifest)                                                                                                                                           |

`--json` documents: `list` → `{ agents: [{ id, layer, name, role, abstract, disabled }] }`; `resolve` → `{ agent,
provenance: { "<field path>": { layer, file, line } } }`; `validate` → `{ findings: [{ code, severity, layer, file,
path, message }] }`; `diff`/`install`/`uninstall`/`sync` → `{ plan: [{ path, state, diff? }], widenings: [...],
written: [...], manifest }`. Exit codes: 0 done or nothing to do, 1 refused (conflict, finding, widening), 2 usage.
`agents check --base-ref <ref>` (AC-048) reads the base ref's manifest with `git show <ref>:.claude/stackra-agents.json`,
resolves the head from its committed sources and snapshot (no network), computes the widenings between the two, and
fails unless the head's manifest adds exactly those widening records in this change; because the manifest and the
sources are code-owned, such a change cannot merge without a code owner's review. It also fails on any planned file
change, finding or snapshot digest mismatch, as before.
`@stackra/mcp` exports the schemas, `resolveAgents`, the renderers, `planInstall` and the node `installAgents`,
`uninstallAgents`.

### Claude Code formats (cited, read 2026-11-25)

| What install writes                   | Documented format used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Source                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `.claude/agents/<id>.md`              | frontmatter `name` (required, ≤256, no `:`, not starting `-`), `description` (required), `tools`, `disallowedTools` (a specifier still removes the whole tool), `model` (`sonnet`, `opus`, `haiku`, `fable`, full id, `inherit`), `permissionMode` (`default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan`), `maxTurns`, `skills`, `mcpServers` (names or inline `.mcp.json` entries), `hooks` (all events), `memory` (`user`, `project`, `local`), `background`, `effort`, `isolation` (`worktree`), `color` (8 names), `initialPrompt`; body = system prompt; project beats user beats plugin; identity from `name` only | code.claude.com/docs/en/sub-agents                    |
| plugin target limits                  | plugin subagents ignore `hooks`, `mcpServers`, `permissionMode` (and `initialPrompt`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | code.claude.com/docs/en/sub-agents                    |
| `.claude/skills/<name>/SKILL.md`      | folder per skill with supporting files; fields listed under Skill v1; refused name characters; reserved `synced`, `anthropic-skills*`; bundled `ship`, `ship-local`, `steward` win; personal beats project                                                                                                                                                                                                                                                                                                                                                                                                                                   | code.claude.com/docs/en/skills                        |
| plugin folder                         | `.claude-plugin/plugin.json` (`name` required, kebab-case, reserved prefixes `claude-`, `anthropic-`, …), `agents/` (files), `skills/`, `.mcp.json`, `${CLAUDE_PLUGIN_ROOT}`; `claude plugin validate`                                                                                                                                                                                                                                                                                                                                                                                                                                       | code.claude.com/docs/en/plugins-reference             |
| `.claude/settings.json` `permissions` | `allow`, `ask`, `deny` lists merge across scopes; evaluated deny, then ask, then allow; a project `allow` waits for workspace trust, `deny` and `ask` apply at once; `Agent(<name>)` rules                                                                                                                                                                                                                                                                                                                                                                                                                                                   | code.claude.com/docs/en/settings, /permissions        |
| hooks (guard wiring)                  | `PreToolUse` input carries `agent_id` and `agent_type` inside a subagent or an `--agent` session; plugin hooks in `hooks/hooks.json` with `${CLAUDE_PLUGIN_ROOT}`, merged with user and project hooks; frontmatter hooks run only while that subagent runs and, for a project agent, only after workspace trust (a `-p` run does not count); a hook deny blocks even when an allow rule matches; "use the permission system rather than a hook to enforce a hard allow or deny"                                                                                                                                                              | code.claude.com/docs/en/hooks (read 2026-11-26)       |
| permission rule details               | `Edit(path)` rules cover Edit, Write and NotebookEdit and Bash redirects and recognised file commands (`cat`, `head`, `tail`, `sed`, `tee`), not programs that open files themselves; `/path` is relative to the settings source, `//path` absolute, `~/path` home; an ask rule prompts even when an allow rule matches; allow rules take tool-name globs only after a literal `mcp__<server>__` prefix (`mcp__github__get_*`); `.claude` is a protected path                                                                                                                                                                                | code.claude.com/docs/en/permissions (read 2026-11-26) |
| MCP rules and servers                 | `mcp__<server>`, `mcp__<server>__<tool>`, `mcp__<server>__*`; `.mcp.json` `mcpServers` with stdio `command`/`args`/`env` or `type: http` `url`/`headers`; `${VAR}` and `${VAR:-default}`; reserved server names                                                                                                                                                                                                                                                                                                                                                                                                                              | code.claude.com/docs/en/mcp, /permissions             |

## Error handling

Every refusal is a finding `{ code, severity, layer, file, path, message }`, never a stack trace, and never quotes a
value the validator classed as a secret. Codes: `unknown_field`, `invalid_value`, `extends_cycle`, `extends_too_deep`,
`extends_not_found`, `extends_changed_in_override`, `layer_cycle`, `layer_source_unpinned`, `layer_digest_mismatch`,
`deny_not_removable`, `above_ceiling`, `no_ceiling`, `unknown_model_tier`, `incomplete_agent`, `name_collision`,
`claude_name_invalid`, `reserved_name`, `secret_literal`, `score_is_measured`, `mcp_server_invalid` (with the
`@stackra/mcp` rule code inside), `mode_refused`, `path_escapes`, `symlink_refused`, `plugin_drops_field`, `conflict`,
`foreign_file`, `widening_needs_a_person`, `root_not_base`, `agent_allow_unsupported`, `hook_not_allowed`,
`guard_rules_mismatch` (the guard's own refusal text), `widening_unrecorded` and `widening_record_mismatch` (CI). A
source that cannot be fetched fails naming the source, not its content.
`apply` failures restore the files already moved and leave the old manifest.

## Security and tenancy

- **Threat model.** The actor this design guards against is an agent in a session (a mistaken or prompt-injected
  model with the session's tools), not the person at the keyboard and not another repository. The person's own
  machine and the user scope rest on the person; a project's policy rests on review.
- **Where the boundaries are.** Two things Stackra does not own are the boundaries, and this design is defence in
  depth around them: (1) **review**: the policy files are code-owned and `agents check --base-ref` in CI fails on any
  widening not recorded in the same change, so no widening merges without a code owner (AC-048); (2) **GitHub branch
  protection** for protected branches, and the deploy pipeline's environment approval with production credentials kept
  off workstations for production deploys. Claude Code's own permissions page says a Bash rule is not a security
  boundary around a program invoked another way, and its hooks page says to use the permission system for a hard
  allow or deny; we follow both: S rows in `settings.json` where one exists, the guard behind them.
- **One ceiling model** (step 7, P-004, P-013, P-014). Deny and ask are unions over everything (P-003). On the allow
  side, every layer's effective ceiling is its own policy inside its parent's effective ceiling, along the layer chain,
  down to the pinned base; an over-reaching layer is refused, not narrowed; the only root is the pinned base
  (`root_not_base`), whose table states all five parts (`no_ceiling`). Every installed agent, skill and grant is then
  checked against the nearest layer's effective ceiling, so an agent's own `extends` chain (a sibling in the same
  layer, say) cannot route around a layer. Rules are compared by subsumption, failing closed (P-015). This is the
  harvested `AGENT_CEILING` rule: nothing starts unbounded.
- **Rules outside the base** enter only as base extensions (AC-043): reviewed with the base table, named per product
  and repository, items only (never a mode or a hook), and always under the deny and ask tables.
- **What reaches the session.** `settings.json` applies to the main thread and every agent, so it receives only deny
  and ask rules and explicit layer grants (AC-017, P-016). A ceiling is never a grant, and there is no per-agent allow
  in v1 (AC-044): Claude Code has no native per-agent allow, and a guard that answered allow would itself be a grant
  path. Per-agent narrowing is native (`tools`, `disallowedTools`, `permissionMode`, `mcpServers` in the agent's
  frontmatter) or the agent's own guard deny and ask rules (AC-031). A project `allow` also waits for workspace trust.
- **The policy guards its own files** (AC-045 to AC-047, P-017). Rendered files (settings, agents, skills, hooks, the
  manifest, `.mcp.json`, the base snapshot) are denied to every edit tool and to the Bash write forms; definition
  sources (`.agents/agents.yaml`, agents, skills, overrides, hooks, models, `.mcp.yaml`) are ask rules, so a person
  sees each edit while agents can still help write them, and review sees the result. Running the installer from an
  agent's Bash is denied; the MCP tools refuse every widening. The guard checks its rules file against the hash on its
  command line and in the manifest and fails closed on a mismatch or an empty or invalid file.
- **Widening needs review; the terminal prompt is a convenience** (AC-027, AC-035, AC-048, AC-050, P-018). Widening
  covers new tools, modes, grants, servers, hooks (command and script hashes), skill `allowed-tools` and `shell`, and
  removed deny or ask rules. A run that would widen asks a person at an interactive terminal and refuses in a
  non-interactive run, an MCP call or a run started from an agent session; but an agent could drive a pseudo-terminal
  and the recorded git identity is a claim, so neither is trusted as approval. The approval is the code owner's review
  of the change, which CI forces. `bypassPermissions` is refused everywhere; `auto` only when the base allows it.
- **Hooks are bounded** (AC-049): only the base and a product may declare them; a repo or user layer only what the
  product lists by exact command and script hash; every new or changed hook is a widening.
- **The base is governed where it lives.** A change to the company base layer is a reviewed pull request in
  platform/figentra at risk R3, where the owner's approval sits; while `BASE_POLICY` and `BASE_EXTENSIONS` live in
  `@stackra/mcp` they change by a code-owned pull request here at risk R3. A product pins the base by commit and
  commits the snapshot with its digest, so a base change reaches a product only when its layer file moves the pin, a
  code-owned change that `agents check` and review see (AC-053, P-021).
- **The table travels** (AC-018, AC-040, AC-052, P-020). The guard enforces every deny and ask row itself, so the user
  scope (no settings file) carries the full table in each agent's frontmatter hook, and the plugin target carries it
  in the plugin's `hooks/hooks.json`, with an agent's own rules applied by the hook input's `agent_type`. Frontmatter
  hooks of a project agent run only after workspace trust is accepted (a `-p` run does not count), so in the project
  scope the `settings.json` deny rules are the first line and the guard the second.
- **Known gaps, stated.** `Bash(pnpm *)`, `Bash(git *)` and the package scripts and git hooks they run can execute any
  project code, and a program that opens files itself is invisible to every rule; the guard catches the named shapes
  (force pushes, deploys, package runners, hook skipping, writes to policy files) and the boundaries above catch the
  rest. Sandboxing shell commands (Claude Code's sandbox) is the stronger tool and is left to each product's settings.
- **MCP entries** pass the `.mcp.yaml` rules (`unpinned_npx_server`, `secret_in_remote_server`, `secret_without_exec`),
  `https` only for remote hosts other than loopback, no reserved names, `${NAME}` references only, and the effective
  ceiling's `mcpServers` list. A new server is a widening. Configuring a server is not using it: its tools still need
  an allow rule (read-only tools only for servers that write, AC-051) or a prompt.
- **Supply chain.** Sources pin an exact version or a commit; digests go into the manifest and the layer file; the base
  is a committed snapshot checked against its digest; `agents check` in CI fails when a layer's digest or any written
  file drifts, and needs no credential (AC-053).
- **Fencing.** Writes stay in the allowed roots (AC-030); supporting files are copied as bytes, symbolic links and
  `..` refused; hook commands must resolve inside the project (`${CLAUDE_PROJECT_DIR}`) or the user folder.
- **Privacy.** Roster and agent files carry no personal data (roster rule 5); the adapter copies channel rows to
  `metadata` only and never renders an email address into an installed file.
- **Tenancy**: none (no tenant data).

## Testing strategy

- **Schemas** (AC-001 to AC-008): table tests per field and code; the generated JSON Schemas compared with the
  committed files; a fixture of every documented Claude Code field rendered and re-parsed.
- **Resolver** (AC-009 to AC-016, P-002 to P-005, P-012): one test per merge-table row; cycle and depth; provenance
  for scalar, list element and section; tier mapping; disabled; the roster adapter against a copy of `roster.yml`'s
  shape (synthetic personas, no real channel rows).
- **Base ceiling** (AC-039, P-013): `BASE_POLICY` checked row by row: each tool name is a documented built-in; each
  rule parses as a Claude Code rule; no allow rule is also denied, and no allow rule is wholly inside a deny rule
  (`ruleWithin(allow, deny table)` false); `Bash(npx *)`, `Bash(infisical *)`, `Bash(node *)` and the `ready-to-merge`
  rule are absent from the allow side; no server-wide MCP allow names a server with write tools; a product layer with
  no policy resolves to the base's explicit ceiling; an allow above it (a tool, a rule, a server, `auto` mode) is
  `above_ceiling`; the base missing any of its five parts is `no_ceiling`.
- **Layer-chain ceilings** (AC-012, AC-041, P-004, P-013, P-014), one test per row:
  - a product policy naming `Bash(curl *)` (outside the base) is refused on the layer with `above_ceiling`, never
    narrowed; with no extension the hint names `BASE_EXTENSIONS`;
  - a repo layer's policy naming a tool its product left out is refused, even though the base allows that tool;
  - an agent in the product layer that `extends` a sibling in the same layer (never reaching the base by `extends`)
    and asks for `Write` when the product's ceiling leaves it out is `above_ceiling` naming the product layer;
  - the same agent extending a base persona whose roster tools include `Write`: still `above_ceiling` (the product
    bound applies whatever the agent's chain);
  - a repo override narrowing the product: a product agent holding a tool the repo left out is `above_ceiling`
    naming the repo layer;
  - `--from <dir>` whose layer file has no `extends`: `root_not_base`; a layer file declaring `kind: base`: refused;
    the pure resolver given a synthetic base through its parameter resolves; the CLI has no flag or variable that sets
    it (a test lists the command's options and the environment it reads);
  - a layer omitting `mcpServers` takes its parent's list; a layer omitting all of its policy resolves to its parent's
    effective ceiling.
- **Subsumption** (AC-042, P-015): `ruleWithin` passes `Bash(pnpm exec playwright test *)` and `Bash(pnpm install)`
  under `Bash(pnpm *)`, `mcp__linear__get_issue` under `mcp__linear__get_*`, `Edit(/src/**/*.ts)` under
  `Edit(/src/**)`, `WebFetch(domain:docs.github.com)` under `WebFetch(domain:*.github.com)`; it fails `Bash(pnpmx *)`
  and `Bash(pnpm*)` under `Bash(pnpm *)` (word boundary), `Bash(git * main)` under `Bash(git push *)`, a rule of another
  tool, and every pair with a `*` in the middle of the ceiling rule (fail closed); generated pairs check that a pass
  implies every sampled command `matchRule` accepts for the rule is accepted by the ceiling.
- **Extensions** (AC-043): the Academorix `ready-to-merge` rule passes for a layer named `academorix` whose target's
  origin is the named repository, and is `above_ceiling` for a layer of another name or another origin; an extension
  naming `maxMode` or a hook is refused by the table test; an extension rule still loses to a deny row; every entry
  carries a reason and an approving pull request.
- **Session settings** (AC-017, AC-044, P-016): for random stacks, every `permissions.allow` rule written to
  `settings.json` is a layer grant inside the bound, and none is a ceiling-only rule; an agent file with
  `permissions.allow` is `agent_allow_unsupported`; denies and asks are written in full.
- **Self-protection** (AC-045, AC-046, AC-047, P-017): the S rows match Edit, Write and NotebookEdit inputs for every
  rendered path (project and user folder) and leave `.agents/specs/**`, `src/**` and `README.md` alone; the ask rows
  match the definition sources; the guard denies a redirect into `.claude/settings.json`, an in-place `sed` of the
  guard's rules file, a `cp` over `.claude/agents/a.md`, an `rm` of the manifest, a `git checkout --` of
  `.claude/settings.json`, a symlink over `.mcp.json`, and every installer form (`stackra agents install`,
  `pnpm exec stackra agents sync`, `pnpm --filter x exec stackra agents uninstall`, `npx stackra agents install`,
  `node node_modules/@stackra/cli/bin/stackra.mjs agents install`, `sh -c 'stackra agents sync'`) while allowing
  `stackra agents diff` and `stackra agents check`; the guard denies every call when its rules file is missing, empty
  (`{}`), schema-invalid, lacks the base table, or differs from the `--rules-sha256` value or the manifest's hash.
- **Widening completeness** (AC-027, AC-048, AC-050, P-018): each of these against a recorded manifest is a widening
  and is refused without a person: a new tool, a mode raised, a new grant, a new MCP server, a new hook, a hook command
  changed, a hook script's bytes changed (same command), a new skill `allowed-tools` entry, a changed skill `shell`, a
  product deny rule removed then `agents_sync` called, an ask rule removed; the run is refused under `CLAUDECODE=1`
  even at a terminal; `agents check --base-ref` in a temporary repository fails a commit that widens with no record,
  fails a record that does not match, and passes a commit that adds the matching record; a narrowing (a new deny) needs
  no record.
- **Hooks** (AC-049): a hook on a repo-layer agent not listed by the product is `hook_not_allowed`; listed with the
  wrong script hash, refused; listed and matching, accepted and recorded as a widening.
- **Production deploys** (AC-051, P-019): a fixed probe list (recorded `PreToolUse` inputs, never run), each matched by
  a deny or ask row whatever the grants: the deploy, versions-deploy, rollback and secret subcommands of `wrangler`
  (plain, behind `pnpm exec`, behind `npx`, and after a global option such as `--env`), the submit, update, secret and
  env-write subcommands of `eas`, `eas build` with `--auto-submit`, `encore deploy`, the MCP calls
  `mcp__encore-cloud__rollout_trigger` (deny), `mcp__cloudflare-api__execute` and `mcp__encore-cloud__db_query` (ask),
  and a `node -e` one-liner that shells out to a force push (ask); hook skipping: `git -c core.hooksPath=<dir> commit`,
  the `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_0`/`GIT_CONFIG_VALUE_0` form, `git config core.hooksPath <dir>` and
  `git push --no-verify` are denied; `wrangler dev`, `eas build -p ios` and `encore run` are not.
- **Deny table, both ways** (AC-039, AC-040): `matchRule` reproduces every row of the permissions page's wildcard
  table. Each S rule matches its intended commands (`git push --force origin main`, `git push -f origin main`,
  `git push origin main --force-with-lease`, `git push origin +main`, `git push origin :main`, `git filter-branch`,
  `git filter-repo --path x`, `git config --global user.email x`) and none of the harmless neighbours
  (`git push origin feature`, `git push --force-with-lease origin feature`, `git push origin main`,
  `git push --force origin main-backup`, `git branch -d feature`, `git config user.name x`). The guard with `--base`
  denies the shapes S misses (`git push origin HEAD:main -uf`, `git -C repo push --force origin main`,
  `timeout 30 git push -f origin refs/heads/main`, `cd repo && git push --force-with-lease=main origin main`,
  `git branch feature -D main`, `git commit --no-verify -m x`, `LEFTHOOK=0 git commit -m x`), and for
  `git reset --hard` reads the branch from a temporary repository: denied on `main`, allowed on `feature`, denied when
  the branch cannot be read.
- **Package runners, both ways** (AC-039, AC-040): S denies `pnpm dlx cowsay`, `pnpm dlx` (bare),
  `pnpx create-vite`, `bunx prettier --check .`, `bun x prettier`, `yarn dlx create-next-app`,
  `timeout 30 pnpm dlx x`, `CI=1 bunx x`; the guard with `--base` denies the flag-variant shapes S misses
  (`pnpm --filter web dlx x`, `pnpm -F web dlx x`, `pnpm -C apps/web dlx x`, `pnpm --dir apps/web dlx x`,
  `pnpm -w dlx x`, `pnpm -r --silent dlx x`, `yarn --cwd apps/web dlx x`, `mise exec -- pnpm dlx x`,
  `sh -c 'pnpm dlx x'`); and neither denies `pnpm exec playwright test`, `pnpm install`, `pnpm run build`,
  `pnpm --filter x test`, `pnpm --filter x exec vitest`, `yarn install` or `bun install`.
- **Generated cases** (P-002, P-003, P-004, P-013, P-014): a seeded generator (no new dependency) builds 500 random
  four-layer stacks, including agents that extend siblings and layers with partial policies; each is resolved in
  shuffled file order (same digest), with an extra random layer (no deny lost), and checked: every installed agent and
  grant is inside every layer's effective ceiling, and effective ceilings only shrink down the chain.
- **Renderers** (AC-017, AC-018, AC-026, AC-031, P-001): golden files for a subagent, a skill with supporting files,
  settings entries merged into an existing file with unrelated keys, `.mcp.yaml` with comments kept, a plugin folder;
  the guard script run against recorded `PreToolUse` inputs for each rule form and for an unreadable rule file; the
  `settings.json` guard entry merged and removed with the manifest.
- **The table travels** (AC-018, AC-040, AC-052, P-020): for each target (project, user, plugin), every base deny and
  ask row is replayed as a recorded `PreToolUse` input through the hooks that target installs and must come back deny
  or ask: in the user scope with no settings file (the frontmatter hook alone), and on the plugin target through
  `hooks/hooks.json` (an S row such as `Read(//**/.env)` included); on the plugin target an agent's own deny rule
  applies to an input whose `agent_type` names it and not to another agent's input; a plugin install of an agent with
  scoped rules succeeds, and one with its own `permissionMode` is still `plugin_drops_field`.
- **Base snapshot** (AC-053, P-021): install and check read the committed snapshot with no network (the fetcher is
  stubbed to fail); a changed byte in the snapshot is `layer_digest_mismatch`; `--refresh-base` refused as a tool and
  from an agent's Bash; refresh against a temporary bare repository rewrites the snapshot, pin and digest.
- **Planner and apply** (AC-019 to AC-025, AC-027, AC-030, P-006 to P-011): temporary git repositories: install twice
  (no write), hand edit then install (refused, nothing written, diff shown), `--keep`, `--overwrite`, `--as-override`
  round trip (the override reproduces the edit), interrupted apply then re-run, uninstall to a byte-identical tree,
  widening refused without a TTY and through `toolsOf`, a symlinked skill file refused.
- **Tools** (AC-032): `toolsOf` lists the seven tools with their read-only flags; a tool call returns the command's
  `--json` document.
- **Proof** (AC-033): an end-to-end test installs a synthetic product layer extending a synthetic base into a fresh
  `git init` folder and checks the files; the recorded proof run uses the real Academorix layer on the Mac:
  `claude --agent <id> -p "…"`, its output pasted into the pull request.
- **Widening record** (AC-035): a confirmed widening appends one record with the git identity, the UTC time and the
  changes; a second run with no widening leaves the manifest byte-identical.
- **Consumers** (AC-034, AC-036): the lane agents validate and install in this repository's own `agents check`; a
  session persona renders `initialPrompt` and starts with `claude --agent <id>` in the proof run.
- **Academorix migration** (AC-037): the follow-up in Academorix runs `stackra agents validate` and `diff` on its new
  layer before install, and its recorded proof starts Lukas with `claude --agent lukas`.
- **ADR** (AC-038): the docs build and the `adr-numbers` check (`stackra check`, config phase) pass with 0537.

## Rollout

1. Merge behind nothing: the new commands are additive; `agents:sync` keeps rendering `.mcp.json` first and installs
   agents only when `.agents/agents.yaml` exists.
2. Before any repository installs: the policy paths (AC-048) join the owner-only CODEOWNERS list in this repository,
   "require review from code owners" is confirmed on its protected branch, and `agents check --base-ref` joins CI;
   each consuming product does the same in its migration.
3. The leaders pull request lands in platform/figentra (with `tariq` renamed to `tarek`), and the base pin moves to
   that `origin/main` commit (a person runs `--refresh-base`, and the snapshot lands by review).
4. Stackra adopts it: `.agents/agents.yaml`, the lane agents (extending `tarek`), then the agent and skill projection
   moves from the workflow tooling's sync to `stackra agents sync` (T022, by behaviour, R1); the guard-paths message
   names the new command.
5. Academorix follows in its own repository on its own issue (T026, AC-037): its 38 agent files become an `academorix`
   product layer extending the base, its 9 skill folders move from `.agents/agents/` to `.agents/skills/`, its session
   personas (Lukas, Selim and the others) become session personas, its layer grants the `ready-to-merge` label rule
   through the base extension (not the base ceiling), its policy paths become code-owned, and its `models.json` tiers
   become its layer's `models`.
6. Minor changesets for `@stackra/mcp` and `@stackra/cli` in the next release; the schemas ship in the package.
7. ADR 0537 moves from Proposed to Accepted once the CTO's read of this revision clears it (the one acceptance gate);
   the index rows change in that commit.

## Delegation and risk plan

Claude only. R3, big tier: two approval stops (ADR 0502), the leader's at Clarified and at Planned, and the CTO's read
of the security model, which blocked the first plan on 2026-11-26 and re-reads this revision; ADR 0537 is accepted
only after that read. The resolver, ceilings, subsumption, extensions, guard, self-protection and planner tasks are
security builders on Opus with an independent Opus review; renderers and commands on Sonnet. Three waves: core (T001 to T012), IO and commands (T013 to T020), consumers and docs (T021 to
T026).

## ADRs

A new ADR, [0537](../../../apps/docs/src/docs/adr/0537-agent-schemas-layers-and-native-install.mdx) (Proposed
2026-11-25, ruling R4), reserved in `apps/docs/adr/numbers.yaml` (key `"0537"`, the register's quoted form). 0535 and
0536 are taken by open work: 0535 by PR figentra/stackra#1041 (the design system tier split) and 0536 by the branch
`figentra/sta-2783-box-deploy` (box deploys); neither is in the register on main yet, so this ADR was renumbered from
0535 to 0537 at the leader's review. The ADR: agent definitions are schema'd data in layers, and
`stackra agents` installs them into each tool's native files. It supersedes ADR 0282 decisions 9 and 10 for agent and
skill files (0282 keeps them for everything else), amends ADR 0016 (layers and the schema) and ADR 0503 (the agent and
skill projection moves to `stackra agents sync`, by behaviour). ADR 0282 and ADR 0016 carry forward notes now; the
index rows change to "superseded" and "amended" when 0537 is accepted, after the CTO's read of this revision (T027).

## Docs

`apps/docs/src/docs/agents/agents-install.mdx` (layers, schema, merge table, the commands, conflict handling, the
widening record, the proof steps, the Academorix migration), `.agents/README.md`, the package `README.md` and
`AGENTS.md`, ADR 0537.

## Harvest from the retired Flow console (read-only)

| Taken                                                                                                                                         | From                                                      | Why / how it lands                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Identity vs behaviour split (catalogue persona vs hired agent)                                                                                | `shared/agents.ts`, `docs/agents-migration.md`            | the base layer holds identity (name, role, persona); product agents hold behaviour and `extends` the persona             |
| "Name · Role" display rule and its split with fallbacks                                                                                       | `shared/agent-name.ts`                                    | `persona.displayName` rendered first in `description`; the roster's `<Name> · <Role> (AI)` convention                    |
| Ceiling semantics: a new agent starts at the minimal ceiling, a missing row fails closed                                                      | `shared/iam.ts` `AGENT_CEILING`, migration plan step 6    | a layer without a policy inherits its parent's ceiling; widening needs a person (Flow needed an owner step-up)           |
| Tool policy `allow` / `approve` / `off` and its defaults from MCP tool annotations                                                            | `shared/apps.ts` `TOOL_POLICIES`, `defaultPolicy`         | maps one to one onto Claude Code `allow` / `ask` / `deny`; a new MCP server defaults to `ask` unless the layer allows it |
| Kill switch per persona, everywhere                                                                                                           | `shared/kill.ts` `kill_personas`                          | `disabled` (deny-wins): a farther layer's disable cannot be undone below                                                 |
| Rule rows with `id`, `pattern`, `reason`, `source`                                                                                            | `shared/flow-guard-rules.ts`                              | every deny rule carries `reason` and `source`, shown in diffs and the guard's refusal                                    |
| Scores are measured, never typed in; benchmark case shape (difficulty 1 to 5, a check)                                                        | `docs/skill-scoring.md` (formula v2), `shared/scoring.ts` | skill `evals` cases; a `score` field is refused                                                                          |
| Not taken: prices, hiring counts, marketplace publishing, D1 tables, the nightly runner, appeals, step-up sessions, the sandbox network rules | the same files                                            | they need a runtime or a business model we no longer run; Claude Code and the repository are the runtime                 |

## Rulings applied (2026-11-25, PR figentra/stackra#1080)

| #   | Question             | Ruling                                                                                                                                                                                                           | Where it lands                                                  |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| R1  | fflow (CTO)          | depend on the workflow tooling's behaviour (gate, sync, guard), never on the Flow console or the `@figentra-oss` scope                                                                                           | Dependency boundary; T022                                       |
| R2  | tool names (CTO)     | house convention, `agents_list` …                                                                                                                                                                                | Contracts; AC-032                                               |
| R3  | roster (CTO)         | `team/roster.yml` on `origin/main`; the leaders PR lands first; the lead is Tarek                                                                                                                                | spec Dependencies; AC-016, AC-034; T007, T021                   |
| R4  | ADR (CTO)            | a new ADR, 0537; big tier with two stops; supersedes 0282 decisions 9 and 10                                                                                                                                     | ADRs; AC-038; T024                                              |
| R5  | base source (leader) | git commit pin of platform/figentra, through the roster adapter; a package later via the registry                                                                                                                | step 2 of the algorithm; T007, T013                             |
| R6  | schema host (leader) | `$id`s on schemas.figentra.com (STA-2784's ADR); the schemas ship in `@stackra/mcp`                                                                                                                              | AC-001; T002                                                    |
| R7  | widening (leader)    | interactive confirmation, recorded in the manifest (who, when, what); base changes are R3 PRs in platform/figentra; revised at the CTO's read (2026-11-26): a convenience, not a boundary; review gates widening | Manifest v1; Security; AC-027, AC-035, AC-048; T012, T014, T034 |
| R8  | uninstall (leader)   | `agents_uninstall` is the seventh tool                                                                                                                                                                           | Contracts; AC-024, AC-032; T017                                 |
| R9  | Academorix (leader)  | session personas install as main-thread agents; the 9 skill folders move to `.agents/skills/`                                                                                                                    | AC-036, AC-037; T026                                            |

Still open, for the owner (not blocking this plan): whether fflow folds into the `stackra` CLI (R1 keeps this work
independent of the answer).

## Complexity tracking

| Choice                         | Why it is needed                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| A generated guard hook         | Claude Code has no per-subagent scoped deny; `disallowedTools` removes whole tools  |
| Keyed instruction sections     | inheritance of prose without copying the parent; a child replaces one section       |
| Git sources pinned to a commit | the base lives in a repository, not a package, and installs must be reproducible    |
| A committed base snapshot      | CI and air-gapped installs read the base with no credential and no network          |
| Rule subsumption, not equality | a product grants narrower rules inside the base; exact strings refused real needs   |
| Base extensions                | one reviewed path for the few rules a product needs that the base must not hold     |
| The guard enforces S rows too  | the user scope writes no settings and plugins ignore agent hooks; the table travels |
