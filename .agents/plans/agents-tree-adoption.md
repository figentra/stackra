# Adopting an agents tree in Stackra

Read-only evaluation, 2026-10-19. Sources: B = `~/Projects/.old/old/basalt`, F = `~/Projects/.old/old/figentra`, S = Stackra, sdlc = `~/.claude/plugins/cache/figentra-sdlc/sdlc/0.1.0` (the installed version; 0.2.0 is in the cache too but marked orphaned).

## 1. Inventory

| item | basalt | figentra | stackra today | covered globally? |
| --- | --- | --- | --- | --- |
| Agents | 27 in `.agents/agents` + 2 non-agent `.md` files | 46 `.md` files + 9 **skill folders that were put in `agents/` by mistake** (heroui-*, sanity-*, find-skills) | none | **sdlc has 12 agents whose bodies match B's byte for byte** (I diffed code-reviewer, architecture-guardian, test-engineer and spec-executor) |
| Rules | 5, with neutral frontmatter (`always`/`applies_to`/`manual`) | 13 (B's 5 plus tenancy, http, module-boundary, not-built-yet, vision, service-checklist, phased×2) | 0 (AGENTS.md is the rule list) | `~/.claude/rules` holds 8 of F's. They are Claude-only, Figentra/Basalt-branded, and cite ADRs that don't exist |
| Hooks | `_io`, guard-bash (has the Infisical rules), guard-paths, post-write-checks | B's set plus context-health, session-context, prompt-hints | `_io`, guard-bash, context-health, session-context (copies of F's, partly de-branded) | none |
| Skills | 87 vendored, symlinked into `.claude/skills` | 120 vendored | none | **~110 are already in `~/.claude/skills` / `~/.agents/skills`**. Only B's 14 design-agency skills are missing (design-*, ux-*, wireframing…) |
| Templates | requirements/design/tasks | same | none | sdlc ships newer ones (B's differ by 13–73 lines) |
| Specs | 40 `NNN-*` folders, Basalt-specific | the same 40, copied | none | sdlc's skills write `.agents/specs/` |
| models.json | tier → model for claude/kiro/opencode | same | none | — |
| Sync script | `tools/scripts/agents-sync.mjs` (1401 lines) + test (576 lines, 36 pass) | none (its `.claude`/`.opencode` were hand copies of B's output) | none | — |
| `.claude/settings.json` | hooks wired to `.claude/hooks/*` symlinks, permissions, MCP allow-list | same | SessionStart, guard-bash and context-health, pointed straight at `.agents/hooks` | — |
| `opencode.jsonc` | — | — | model, `instructions: [AGENTS.md]`, deny-list | — |

## 2. How `agents-sync.mjs` works

Input is `.agents/{skills,hooks,templates,specs,rules,agents}` plus `.agents/models.json`. The script auto-detects targets: any of `.claude`, `.kiro`, `.clinerules`, `.cursor` or `.opencode` that exists.

| kind | strategy | output |
| --- | --- | --- |
| skills, hooks, templates, specs | one relative symlink per entry | `.claude/<kind>/<entry>`, `.kiro/…`. OpenCode gets no skills because it reads `.agents/skills` natively |
| agents | generated: neutral frontmatter (`name, description, tools, tier, model, mode, permissions, skills`) rendered per dialect, with `tier` resolved through models.json | `.claude/agents`, `.kiro/agents`, `.opencode/agents` |
| rules | generated: neutral frontmatter translated per dialect | `.claude/rules` (frontmatter stripped), `.kiro/steering`, `.cursor/rules/*.mdc`, `.clinerules/`. For OpenCode, a marked block in root `AGENTS.md`: always-on rules in full, scoped rules as an index |

- **Marker:** each generated file carries `<!-- generated from .agents/<kind>/<x>.md by tools/scripts/agents-sync.mjs — edit the source, not this file -->`. The AGENTS.md block uses `BEGIN generated…` / `END generated…`. A file without the marker at a generated path counts as a **conflict** and is never overwritten.
- **Modes:** `--check` reports drift, missing or stale entries and exits 1. `--prune` deletes stale links. `--lint` validates agent sources: unknown keys, name ≠ file stem, backticked repo paths that don't exist, and shell commands in an agent that has no Bash tool. `--list` prints the mapping. It uses only built-in node modules.

**Bugs and Basalt-specific parts**

1. **`--check` in B exits 2 right now.** The agent filter skips only `README.md` and `*-NOTES.md`, so `DESIGN-AGENCY-COMPLETE.md` fails as an agent with no frontmatter.
2. **Rules load twice in Stackra.** Rules would go into the AGENTS.md block and also into `.claude/rules`, and S's `CLAUDE.md` is `@AGENTS.md`. Pick one route.
3. The comment saying Claude Code can't load rules per file is out of date: `.claude/rules/*.md` accepts a `paths:` frontmatter. I didn't test this here.
4. Targets are picked by whichever directories exist, so a stray `.cursor/` makes the script start writing to it.
5. About 40% of the code (KIRO_TOOLS, KIRO_CAPABILITIES, the Cursor and Cline dialects) is for Kiro, Cursor and Cline, which Stackra doesn't use.
6. Hard-coded values: OpenCode's model is `amazon-bedrock/zai.glm-5`, which was retired per plan conflict 8, and the REFERENCE regex names `go.work`, `pyproject.toml` and `.gitlab-ci.yml`.

**Verdict:** port it and cut it down rather than rewrite. Keep only the claude and opencode targets, and keep the agents, rules-block, skill-link and check/lint paths, which should land at about 450 lines. Keep the tests that cover those paths. The provenance, conflict and drift logic is the hard part, and it is already tested.

## 3. Recommendation

| option | duplication | drift | Claude + OpenCode | onboarding | clean main session | verdict |
| --- | --- | --- | --- | --- | --- | --- |
| (a) copy everything | 12 agents and ~110 skills duplicated | high: 3 hand-kept copies, which is what F ended up with | yes, by hand | heavy | no: 120 skills and the Figentra rules load every session | reject |
| (b) `.agents/` + sync only | none inside the repo, but sdlc's 12 agents get re-vendored | `--check` catches it | yes | good | ok | most of the answer |
| (c) global sdlc + global rules, with only repo items in-repo | none | low | **no: OpenCode sees neither the plugin nor `~/.claude/rules`** | teammates must hand-install the global setup | no: global rules carry Figentra and vision content into Stackra | partial |
| (d) package as a Claude plugin | none | low | **no, Claude-only** | `enabledPlugins` | yes | too early: one repo, and the content changes every week |

**Winner: (b) + (c) together.** Use one canonical `.agents/` for repo-specific content: rules, the hooks S already points at, about 6–8 new agents, models.json, and a handful of repo skills. A trimmed `agents-sync` projects it into `.claude/agents`, `.opencode/agents`, `.claude/skills` and the AGENTS.md rules block. The sdlc plugin stays the source for the 12 generic agents, the spec skills and the templates. Pin it in `.claude/settings.json` with `extraKnownMarketplaces` + `enabledPlugins` so a fresh clone gets prompted to install it. Generic skills stay installed globally and are not vendored. Once the repo rules exist, a human trims `~/.claude/rules` back to cross-project content only, so Stackra stops loading tenancy, vision and Basalt citations.

## 4. Adoption list

### Hooks (`.agents/hooks`, referenced directly from settings.json, not symlinked)

| item | action |
| --- | --- |
| `_io.mjs` | KEEP (S). B's version is 59 lines; diff it and take B's if it adds `deny()` |
| `guard-bash.mjs` | KEEP S. PORT from B: the `infisical export` and `infisical secrets get` without `--silent` rules (conflict 9), and `encore secret get`. Fix the comment `tools/scripts/tag-released-packages.mjs`, which doesn't exist |
| `guard-paths.mjs` | PORT from B. Keep the pnpm-lock, CHANGELOG, dist and `.env` rules. Drop uv.lock, go.sum and .venv. ADD `.claude/agents/*`, `.opencode/agents/*` and the AGENTS.md generated block (edit the source instead). Wire it on `Write\|Edit\|MultiEdit\|NotebookEdit` |
| `post-write-checks.mjs` | PORT from B, oxfmt only. Drop gofumpt and ruff. It must never block |
| `session-context.mjs` | KEEP. **Fix:** invariant 5 says `apps/docs/adr/*.mdx`; the real path is `apps/docs/src/adr` |
| `context-health.mjs` | **DROP.** It reads `CLAUDE_TOOL_CALL_COUNT`, which Claude Code doesn't set, so it never fires, yet it spawns node on every tool call (plan conflict 13) |
| `prompt-hints.mjs` (F) | DROP for now. All of its hints are Figentra domain hints. Rewrite later if it turns out to be needed |

### Rules (`.agents/rules`, neutral frontmatter, rendered into the AGENTS.md block)

| rule | action |
| --- | --- |
| versions, task-vocabulary, concurrent-sessions | PORT from B. Remove go.work/uv/pyproject mentions; keep `turbo.jsonc`, `mise.toml`, `pnpm-workspace.yaml` refs |
| workspace-layout | PORT from B and **rewrite** for S: drop go.work and uv, use `packages/<category>/<name>` and tier tags. sdlc's architecture-guardian and package-steward read this exact path |
| secrets | PORT from B, merged with global `secrets.md`. De-brand and cite Stackra docs pages, not Basalt ADR-0085 |
| module-boundary, not-built-yet, http-conventions, service-checklist | PORT from global/F, de-branded: `@stackra/*` tiers, no academorix/os paths, ADR refs renumbered per the docs-port plan §3 |
| tenancy | PORT as `manual: true` until the first tenant table (plan conflict 10) |
| vision, phased-execution, PHASED_WORKFLOW | DROP: Vision is another repo, and the phased docs describe the dead hook |
| AGENTS.md hand table | KEEP outside the generated block |

### Agents

- **Covered by sdlc, DROP from the repo:** delivery-orchestrator, architecture-guardian, code-reviewer, test-engineer, release-operations, package-steward, dependency-steward, accessibility-reviewer, docs-governance, spec-author, spec-planner, spec-executor.
- **NEW (P0)**, with `tier:` set: `security-tenancy-reviewer` (from F `security-tenancy-reviewer` + B `security-compliance-reviewer`), `code-standards-steward` (from B).
- **NEW (P1):** `service-builder`, `frontend-builder`, `mobile-builder`, `api-contract-reviewer`, `design-brand-reviewer`, `i18n-steward` (sources in docs-port plan §7). Each new agent needs a de-brand pass and `--lint` clean.
- **DROP:** B and F's design agency, product-agent, ai-agents-builder, and the folded stewards (plan §7).

### Skills, templates, models, settings

| item | action |
| --- | --- |
| Generic skills (encore-*, heroui-*, expo-*, vitest, pnpm, turborepo…) | DROP from the repo. They are installed globally. List the expected set in `.agents/skills/README.md` |
| Repo skills | NEW only when Stackra-specific: e.g. `stackra-scaffold` (`pnpm new`), `docs-adr` re-pointed to `apps/docs/src/adr` |
| Templates | DROP. sdlc's are canonical (conflict 11) |
| Specs | DROP B and F's 40. New specs go in `.agents/specs/` |
| `models.json` | PORT. Remove `kiro`. Set claude economy→haiku, standard→sonnet, frontier→opus. Set opencode tiers explicitly, since the Bedrock GLM default is retired |
| `.claude/settings.json` | ADD guard-paths and post-write hooks, `permissions` (from F, minus go/uv), `enabledMcpjsonServers`, and `extraKnownMarketplaces` + `enabledPlugins: {"sdlc@figentra-sdlc": true}`. REMOVE context-health |
| `opencode.jsonc` | Keep. Drop the `instructions` key if OpenCode V2 ignores it (as B's script states); it reads AGENTS.md anyway |

## 5. Tasks for Sonnet subagents (parallel unless noted)

| # | task | owns | check |
| --- | --- | --- | --- |
| T1 | Port and trim `agents-sync.mjs` to claude + opencode: agents, AGENTS.md rules block, skill links, `--check`/`--lint`. Fix the non-agent `.md` filter. Don't project rules to `.claude/rules` | `tools/scripts/agents-sync.mjs`, `agents-sync.test.mjs`, `package.json` scripts `agents:sync`/`agents:check` | `node --test tools/scripts/agents-sync.test.mjs`; add `pnpm agents:check` to `validate` |
| T2 | Hooks: guard-bash Infisical/encore rules, port guard-paths and post-write-checks, fix the session-context ADR path, delete context-health | `.agents/hooks/*` | `node --test .agents/hooks/*.test.mjs` (new: feed stdin JSON, assert deny/allow); extend the `validate` glob |
| T3 | settings.json wiring + sdlc `enabledPlugins` + permissions | `.claude/settings.json` | JSON schema-valid; a manual session start shows the SessionStart context |
| T4 | Rules batch A: versions, task-vocabulary, concurrent-sessions, workspace-layout (rewritten) | `.agents/rules/{those}.md`, `rules/README.md` | `agents:check` clean; paths exist (`--lint`-style ref check) |
| T5 | Rules batch B: secrets, module-boundary, not-built-yet, http-conventions, service-checklist, tenancy (manual), all de-branded | `.agents/rules/{those}.md` | `grep -riE 'figentra\|basalt\|academorix' .agents/rules` returns nothing |
| T6 | `models.json` + the P0 agents (security-tenancy-reviewer, code-standards-steward) | `.agents/models.json`, `.agents/agents/{2}.md` | `pnpm agents:lint` |
| T7 | P1 agents (service/frontend/mobile builders, api-contract, design-brand, i18n) | `.agents/agents/{6}.md` | `pnpm agents:lint`; no name collides with an sdlc agent |
| T8 (after T1, T4–T7) | Run `agents:sync`, commit the projections and the AGENTS.md block, update `opencode.jsonc` | `.claude/agents`, `.opencode/agents`, `AGENTS.md`, `opencode.jsonc` | `pnpm agents:check` exits 0; `pnpm validate` green |
| T9 (human) | Trim `~/.claude/rules` to cross-project content | global | — |
