# Implementation Plan: `stackra mcp` installs every persona and agent from schemas with inheritance

**Spec**: `.agents/specs/sta-2787-agents-install/spec.md` · **Linear**: STA-2787 · **Date**: 2026-11-25

**Input**: Feature specification from `.agents/specs/sta-2787-agents-install/spec.md`

## Summary

Agents become data. Four zod schemas in `@stackra/mcp` (agent, skill, layer, manifest; published as JSON Schema v1)
describe a definition; a pure resolver stacks the layers (user, repo, product, base), follows `extends`, merges each
field by its rule, applies every layer's ceiling and records where each value came from. Pure renderers turn a
resolved agent into Claude Code's own files (subagent Markdown, `SKILL.md` folders, `settings.json` permission entries,
`.mcp.yaml` or `.mcp.json` servers, a plugin folder). A pure planner compares what would be written with the disk and
the install manifest (create, update, unchanged, conflict, foreign, remove, pinned); the node side applies the plan
atomically and writes the manifest last. Seven CLI commands (`agents:list|resolve|validate|diff|install|sync|
uninstall`, plus the existing `agents:check`) carry it, and `toolsOf` serves them from `stackra mcp` with no second
schema. Claude Code runs the agents; Stackra only writes its files.

## Technical Context

- **Language**: TypeScript (ESM), zod 4 (`z.toJSONSchema` for the published files), `yaml` 2 (frontmatter and layer
  files, comments kept when editing `.mcp.yaml`)
- **Members**: `packages/developer/mcp` (`tier:lib`: the core in `.`, file IO in `./node`); `packages/developer/cli`
  (commands); `apps/docs` (guide, ADR notes)
- **Testing**: vitest in `__tests__/` beside the code; temporary-directory repositories for the end-to-end runs
- **Storage**: repository files only; the user scope writes the Claude Code user folder
- **Runtime target**: developer workstation and CI (`agents check`)

## Constitution Check

| Law                                   | Result | Note                                                                              |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI imports `@stackra/mcp`; `@stackra/mcp` imports no CLI or console          |
| Bundle-safe core                      | PASS   | schemas, resolver, renderers, planner are pure in `src/core/`; IO in `src/node/`  |
| Secrets (ADR 0009, 0525)              | PASS   | names only (`${NAME}`); secret-shaped literals refused; no value printed          |
| Security                              | PASS   | deny-wins, ceilings, widening needs a person, MCP entries validated, path fencing |
| HTTP and events                       | N/A    | none                                                                              |
| Tenancy                               | N/A    | none                                                                              |
| Delegation                            | PASS   | Claude only; security-sensitive tasks on Opus                                     |
| Not built yet (ADR 0011)              | PASS   | no hosted schema site claimed; files ship in the package; hosting is a question   |
| Test placement (ADR 0022)             | PASS   | `__tests__/` beside each file                                                     |
| Versions and catalogs                 | PASS   | no new dependency; changesets minor for `@stackra/mcp` and `@stackra/cli`         |
| Deploy modes (ADR 0076)               | PASS   | nothing deployed                                                                  |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                         |
| Docs and ADRs                         | PASS   | guide; new ADR 0537 (Proposed), forward notes on ADR 0282 and 0016                |

## Deploy modes

| Mode       | Behaviour                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------- |
| SaaS       | nothing deployed; the CLI and local MCP run on the workstation, `agents check` in CI          |
| On-prem    | the same; a git or package source can point at an internal mirror                             |
| Air-gapped | the same with `path` sources or pre-installed packages; no source is fetched over the network |

## Correctness properties

- **P-001**: every definition that validates also loads in Claude Code: rendered frontmatter uses only documented
  fields with documented values — Validates: AC-001, AC-006, AC-017
- **P-002**: resolution is a pure function of the layer inputs: the same inputs give the same resolved agents,
  provenance and digests, in any file order — Validates: AC-010, AC-014, AC-019
- **P-003**: deny monotonicity: adding a layer or a definition never removes a deny entry from any resolved agent or
  from `settings.json` — Validates: AC-011, AC-031
- **P-004**: ceiling soundness: no resolved agent holds an allow, a mode or an MCP server above the ceiling of any
  layer on its chain — Validates: AC-012, AC-028, AC-029
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

## Architecture overview

```text
 sources (path | package@exact | git@sha)                                    Claude Code reads
   base: platform/figentra team/roster.yml ──┐                              .claude/agents/<id>.md
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
   with `--with-user` or the user scope. Each layer extends at most one layer; following `extends` past a layer already
   seen is `layer_cycle`. Order, nearest first: user, repo, product, base.
2. **Fetch and pin.** A `path` source is read in place; a `package` source must be installed at the exact version
   named; a `git` source needs a 40-hex commit: the commit is fetched shallow (`git fetch --depth 1 <url> <sha>`) into
   a bare cache under `~/.cache/stackra/agents/` and read with `git archive <sha> <path>` (no branch names, so an install
   is reproducible). The base is always a git source: platform/figentra at a commit of `origin/main` (R5); a package
   source for it comes later through the registry. Each layer's digest is the SHA-256 of its canonical input (sorted
   paths, normalised line ends).
3. **Parse and validate each definition** against the schema major its `$schema` names (no `$schema` reads as v1 while
   v1 is the only major). Skill folders are validated with the skill schema; the roster through its adapter (step 3a).
   - 3a. **Roster adapter.** `team/roster.yml` `personas[]` becomes abstract agents in a layer named `figentra`: `id`,
     `name`, `role`, `persona.displayName` from `display_name`, `persona.character` from `ring` and the `conventions.look`
     line, `escalatesTo`, `products`, `owns` and the channel rows under `metadata`; `tools` entries that are Claude
     tool names (`Read`, `Grep`, `Glob`, `Write`, `Edit`, `Bash`) become the persona's `tools.allow` (a default the
     product agent may replace within its own layer's ceiling); the base sets no tool ceiling until the roster
     carries a policy, but its `policy.deny` comes from the adapter's fixed table for `humans.owner.keeps`
     (secrets, production deploys, deletes: `Bash(gh secret *)`, `Bash(infisical *)`, `Bash(sops *)`, …);
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
7. **Ceilings.** Union every `deny` of every layer on the chain and every `policy.deny` in the stack (P-003). Intersect
   the allow side with each chain layer's `policy` (`tools.allow`, `permissions.allow` by exact rule string,
   `maxMode`, `mcpServers`); anything above is `above_ceiling` (refused, never silently dropped). A layer with no
   `policy` inherits the ceiling of the layer it extends, so a missing policy fails closed to the base.
8. **Disable.** Drop every id any farther layer lists in `disabled` (P-012).
9. **Models.** Map a `model.tier` through the nearest layer whose `models.claude` defines it; an alias (`sonnet`,
   `opus`, `haiku`, `fable`, `inherit`) or a `claude-*` id passes through.
10. **Post-checks.** Required-after-resolution fields, rendered-name collisions, plugin field loss (plugin target),
    widening against the manifest (AC-027). Output: resolved agents and skills, provenance, a digest per agent.

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
- `rosterLayer(roster)`: the roster adapter (step 3a).
- `loadLayerStack(root, options)` (node): finds, fetches, pins and digests the layers.
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
- `stackra-agent-guard.mjs` (rendered, dependency-free): the agent's hook runs it with the agent id; it reads that
  agent's rules from the rendered `.claude/hooks/stackra-agent-guard.rules.json`, matches the `PreToolUse` input with
  the documented rule forms (`Tool`, `Tool(prefix *)`, `Tool(exact)`, `mcp__server`, `mcp__server__tool`,
  `mcp__server__*`), answers deny or ask through the hook's JSON output, and denies when its rules cannot be read.

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
  src/core/agents/functions/render-guard.function.ts
  src/core/agents/functions/plan-install.function.ts
  src/core/agents/functions/unified-diff.function.ts
  src/core/agents/functions/__tests__/*.test.ts
  src/node/agents/functions/load-layer-stack.function.ts
  src/node/agents/functions/fetch-layer-source.function.ts
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
| `tools.allow`                 | replace   | then intersected with every chain ceiling; above is `above_ceiling`                                                                                 |
| `tools.deny`                  | deny-wins | union over the chain; `$remove` and `$replace` refused                                                                                              |
| `permissions.mode`            | replace   | must be at or below `policy.maxMode` of every chain layer                                                                                           |
| `permissions.allow`           | append    | each rule must appear in a chain layer's `policy.permissions.allow`                                                                                 |
| `permissions.ask`             | deny-wins | union; an `ask` can become a `deny` below, never an `allow`                                                                                         |
| `permissions.deny`            | deny-wins | union; a rule in both `allow` and `deny` resolves to deny                                                                                           |
| `skills`                      | append    | ordered union; `{ $remove: [...] }` and `{ $replace: [...] }` accepted                                                                              |
| `mcpServers`                  | keyed     | by server name; a nearer entry replaces the whole entry; each entry validated                                                                       |
| instructions (body sections)  | keyed     | by heading slug: same slug replaces, new slugs append; `instructions: replace` in frontmatter drops the parent body; `{ $remove: [slug] }` accepted |
| `claude.*`                    | keyed     | passthrough fields, each leaf replaces                                                                                                              |
| `hooks`                       | append    | per event, matchers appended; commands fenced to the project (AC-030)                                                                               |
| `disabled`                    | deny-wins | true anywhere farther stays true (P-012)                                                                                                            |
| `metadata`                    | keyed     | deep merge; never rendered into a permission                                                                                                        |

### Skill v1 (`.agents/skills/<name>/SKILL.md` plus supporting files)

Claude Code's `SKILL.md` frontmatter fields (`name`, `description`, `when_to_use`, `argument-hint`, `arguments`,
`disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context`,
`agent`, `background`, `hooks`, `paths`, `shell`, `license`, `compatibility`, `metadata`), plus Stackra's `extends`
(sections merge like agent instructions; `allowed-tools` ceiling-checked; `disallowed-tools` deny-wins), `source` (a
third-party skill: package, exact version, integrity; never vendored), and `evals` (benchmark cases: `id`,
`difficulty` 1 to 5, `prompt`, `check` command). A `score` field is refused (AC-008).

### Layer v1 (`.agents/agents.yaml`)

```yaml
$schema: https://schemas.figentra.com/stackra/agents/layer/v1.json
name: academorix # the `<layer>:` prefix
kind: product # base | product | repo | user
extends:
  {
    name: figentra,
    source: { git: "git@github.com:figentra/figentra.git", ref: "<40-hex>", path: team/roster.yml },
  }
agents: ./agents # folder of agent files (default)
skills: ./skills
models: { claude: { economy: haiku, standard: sonnet, frontier: opus } }
policy: # the ceiling for this layer and every layer below
  maxMode: acceptEdits
  tools: { allow: [Read, Grep, Glob, Write, Edit, Bash, WebFetch] }
  permissions:
    allow: ["Bash(pnpm *)"]
    deny:
      [
        {
          rule: "Bash(gh secret *)",
          reason: "secrets stay with the owner",
          source: "roster rule 3",
        },
      ]
  mcpServers: { allow: [heroui-pro, linear, playwright] }
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
  "ceilings": {
    "console-builder": {
      "tools": ["Bash", "Edit", "Glob", "Grep", "Read", "Write"],
      "mode": "default",
      "allow": [],
      "mcpServers": ["heroui-pro"]
    }
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

Entries are sorted by path then pointer. `ceilings` is what the widening check compares with. `widenings` (R7,
AC-035) is append-only: one record per confirmed widening, with who confirmed it (the terminal's git identity, as a
commit author records it), when (UTC) and each change; it is the only time stamp in the file, so a run with no
widening stays byte-identical (AC-019). A user-scope manifest lives in the user folder and is never committed.

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

| Command (CLI)                 | MCP tool           | Read-only | Input (also the tool's JSON Schema)                                    |
| ----------------------------- | ------------------ | --------- | ---------------------------------------------------------------------- |
| `stackra agents list`         | `agents_list`      | yes       | `--from`, `--with-user`, `--layer`, `--include-abstract`               |
| `stackra agents resolve <id>` | `agents_resolve`   | yes       | `id`, `--from`, `--with-user`, `--provenance` (default on in `--json`) |
| `stackra agents validate`     | `agents_validate`  | yes       | `--from`, `--with-user`, `--upgrade` (CLI writes; refused as a tool)   |
| `stackra agents diff`         | `agents_diff`      | yes       | `--from`, `--scope`, `--target`, `--as-override <path>`                |
| `stackra agents install`      | `agents_install`   | no        | `--from`, `--scope project                                             | user`, `--target claude | plugin`, `--out`, `--overwrite <path>…`, `--keep <path>…`, `--only <id>…` |
| `stackra agents uninstall`    | `agents_uninstall` | no        | `--scope`, `--overwrite <path>…`                                       |
| `stackra agents sync`         | `agents_sync`      | no        | none (reads `.agents/agents.yaml`; renders `.mcp.json` as before)      |
| `stackra agents check`        | none (CI command)  | yes       | none                                                                   |

`--json` documents: `list` → `{ agents: [{ id, layer, name, role, abstract, disabled }] }`; `resolve` → `{ agent,
provenance: { "<field path>": { layer, file, line } } }`; `validate` → `{ findings: [{ code, severity, layer, file,
path, message }] }`; `diff`/`install`/`uninstall`/`sync` → `{ plan: [{ path, state, diff? }], widenings: [...],
written: [...], manifest }`. Exit codes: 0 done or nothing to do, 1 refused (conflict, finding, widening), 2 usage.
`@stackra/mcp` exports the schemas, `resolveAgents`, the renderers, `planInstall` and the node `installAgents`,
`uninstallAgents`.

### Claude Code formats (cited, read 2026-11-25)

| What install writes                   | Documented format used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Source                                         |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `.claude/agents/<id>.md`              | frontmatter `name` (required, ≤256, no `:`, not starting `-`), `description` (required), `tools`, `disallowedTools` (a specifier still removes the whole tool), `model` (`sonnet`, `opus`, `haiku`, `fable`, full id, `inherit`), `permissionMode` (`default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan`), `maxTurns`, `skills`, `mcpServers` (names or inline `.mcp.json` entries), `hooks` (all events), `memory` (`user`, `project`, `local`), `background`, `effort`, `isolation` (`worktree`), `color` (8 names), `initialPrompt`; body = system prompt; project beats user beats plugin; identity from `name` only | code.claude.com/docs/en/sub-agents             |
| plugin target limits                  | plugin subagents ignore `hooks`, `mcpServers`, `permissionMode` (and `initialPrompt`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | code.claude.com/docs/en/sub-agents             |
| `.claude/skills/<name>/SKILL.md`      | folder per skill with supporting files; fields listed under Skill v1; refused name characters; reserved `synced`, `anthropic-skills*`; bundled `ship`, `ship-local`, `steward` win; personal beats project                                                                                                                                                                                                                                                                                                                                                                                                                                   | code.claude.com/docs/en/skills                 |
| plugin folder                         | `.claude-plugin/plugin.json` (`name` required, kebab-case, reserved prefixes `claude-`, `anthropic-`, …), `agents/` (files), `skills/`, `.mcp.json`, `${CLAUDE_PLUGIN_ROOT}`; `claude plugin validate`                                                                                                                                                                                                                                                                                                                                                                                                                                       | code.claude.com/docs/en/plugins-reference      |
| `.claude/settings.json` `permissions` | `allow`, `ask`, `deny` lists merge across scopes; evaluated deny, then ask, then allow; a project `allow` waits for workspace trust, `deny` and `ask` apply at once; `Agent(<name>)` rules                                                                                                                                                                                                                                                                                                                                                                                                                                                   | code.claude.com/docs/en/settings, /permissions |
| MCP rules and servers                 | `mcp__<server>`, `mcp__<server>__<tool>`, `mcp__<server>__*`; `.mcp.json` `mcpServers` with stdio `command`/`args`/`env` or `type: http` `url`/`headers`; `${VAR}` and `${VAR:-default}`; reserved server names                                                                                                                                                                                                                                                                                                                                                                                                                              | code.claude.com/docs/en/mcp, /permissions      |

## Error handling

Every refusal is a finding `{ code, severity, layer, file, path, message }`, never a stack trace, and never quotes a
value the validator classed as a secret. Codes: `unknown_field`, `invalid_value`, `extends_cycle`, `extends_too_deep`,
`extends_not_found`, `extends_changed_in_override`, `layer_cycle`, `layer_source_unpinned`, `layer_digest_mismatch`,
`deny_not_removable`, `above_ceiling`, `unknown_model_tier`, `incomplete_agent`, `name_collision`,
`claude_name_invalid`, `reserved_name`, `secret_literal`, `score_is_measured`, `mcp_server_invalid` (with the
`@stackra/mcp` rule code inside), `mode_refused`, `path_escapes`, `symlink_refused`, `plugin_drops_field`, `conflict`,
`foreign_file`, `widening_needs_a_person`. A source that cannot be fetched fails naming the source, not its content.
`apply` failures restore the files already moved and leave the old manifest.

## Security and tenancy

- **Deny-wins** across the chain and the stack (P-003); allow is bounded by every chain layer's ceiling (P-004); a
  layer without a policy inherits its parent's, so a missing ceiling fails closed to the base.
- **No self-grant.** A product agent cannot exceed its product layer's policy, which cannot exceed the base's; a repo or
  user override can narrow but never widen past the product's ceiling. Widening against the manifest needs an
  interactive confirmation by a person at a terminal, recorded in the manifest (R7, AC-035); the MCP tools and
  `--no-interaction` runs refuse it. `bypassPermissions` is refused everywhere; `auto` only when the base allows it.
- **The base is governed where it lives.** A change to the company base layer is a reviewed pull request in
  platform/figentra at risk R3, where the owner's approval sits; a product pins the base by commit, so a base change
  reaches a product only when its layer file moves the pin, which `agents check` and review see.
- **Scoped rules are enforced natively.** Layer rules go to `settings.json` `permissions` (Claude Code applies a
  settings deny to the main conversation and to subagents); an agent's own scoped deny or ask rules become its
  `PreToolUse` hook calling the rendered guard (AC-031), because `disallowedTools` with a specifier removes the whole
  tool. Note for the reader: a project `allow` waits for workspace trust, so allows never take effect silently.
- **MCP entries** pass the `.mcp.yaml` rules (`unpinned_npx_server`, `secret_in_remote_server`, `secret_without_exec`),
  `https` only for remote hosts other than loopback, no reserved names, `${NAME}` references only, and the layer's
  `policy.mcpServers` list. A new server is a widening.
- **Supply chain.** Sources pin an exact version or a commit; digests go into the manifest; `agents check` in CI fails
  when a layer's digest or any written file drifts.
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
- **Generated cases** (P-002, P-003, P-004): a seeded generator (no new dependency) builds 500 random four-layer
  stacks; each is resolved in shuffled file order (same digest), with an extra random layer (no deny lost) and checked
  against its ceilings.
- **Renderers** (AC-017, AC-018, AC-026, AC-031, P-001): golden files for a subagent, a skill with supporting files,
  settings entries merged into an existing file with unrelated keys, `.mcp.yaml` with comments kept, a plugin folder;
  the guard script run against recorded `PreToolUse` inputs for each rule form and for an unreadable rule file.
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
2. The leaders pull request lands in platform/figentra (with `tariq` renamed to `tarek`), and the base pin moves to
   that `origin/main` commit.
3. Stackra adopts it: `.agents/agents.yaml`, the lane agents (extending `tarek`), then the agent and skill projection
   moves from the workflow tooling's sync to `stackra agents sync` (T022, by behaviour, R1); the guard-paths message
   names the new command.
4. Academorix follows in its own repository on its own issue (T026, AC-037): its 38 agent files become an `academorix`
   product layer extending the base, its 9 skill folders move from `.agents/agents/` to `.agents/skills/`, its session
   personas (Lukas, Selim and the others) become session personas, and its `models.json` tiers become its layer's
   `models`.
5. Minor changesets for `@stackra/mcp` and `@stackra/cli` in the next release; the schemas ship in the package.
6. ADR 0537 moves from Proposed to Accepted with the Planned approval; the index rows change in that commit.

## Delegation and risk plan

Claude only. R3, big tier: two approval stops (ADR 0502), the leader's at Clarified and at Planned. The resolver,
ceilings, guard and planner tasks are security builders on Opus with an independent Opus review; renderers and
commands on Sonnet. Three waves: core (T001 to T012), IO and commands (T013 to T020), consumers and docs (T021 to
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
index rows change to "superseded" and "amended" when 0537 is accepted.

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

| #   | Question             | Ruling                                                                                                                 | Where it lands                                    |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| R1  | fflow (CTO)          | depend on the workflow tooling's behaviour (gate, sync, guard), never on the Flow console or the `@figentra-oss` scope | Dependency boundary; T022                         |
| R2  | tool names (CTO)     | house convention, `agents_list` …                                                                                      | Contracts; AC-032                                 |
| R3  | roster (CTO)         | `team/roster.yml` on `origin/main`; the leaders PR lands first; the lead is Tarek                                      | spec Dependencies; AC-016, AC-034; T007, T021     |
| R4  | ADR (CTO)            | a new ADR, 0537; big tier with two stops; supersedes 0282 decisions 9 and 10                                           | ADRs; AC-038; T024                                |
| R5  | base source (leader) | git commit pin of platform/figentra, through the roster adapter; a package later via the registry                      | step 2 of the algorithm; T007, T013               |
| R6  | schema host (leader) | `$id`s on schemas.figentra.com (STA-2784's ADR); the schemas ship in `@stackra/mcp`                                    | AC-001; T002                                      |
| R7  | widening (leader)    | interactive confirmation, recorded in the manifest (who, when, what); base changes are R3 PRs in platform/figentra     | Manifest v1; Security; AC-027, AC-035; T012, T014 |
| R8  | uninstall (leader)   | `agents_uninstall` is the seventh tool                                                                                 | Contracts; AC-024, AC-032; T017                   |
| R9  | Academorix (leader)  | session personas install as main-thread agents; the 9 skill folders move to `.agents/skills/`                          | AC-036, AC-037; T026                              |

Still open, for the owner (not blocking this plan): whether fflow folds into the `stackra` CLI (R1 keeps this work
independent of the answer).

## Complexity tracking

| Choice                         | Why it is needed                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| A generated guard hook         | Claude Code has no per-subagent scoped deny; `disallowedTools` removes whole tools |
| Keyed instruction sections     | inheritance of prose without copying the parent; a child replaces one section      |
| Git sources pinned to a commit | the base lives in a repository, not a package, and installs must be reproducible   |
