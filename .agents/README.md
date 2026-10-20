# `.agents/` — the source of truth for every AI artifact

One canonical tree, projected into each assistant's own directory by
[`tools/scripts/agents-sync.mjs`](../tools/scripts/agents-sync.mjs) (`pnpm agents:sync`). Edit here; never edit the
projection ([ADR 0016](../apps/docs/src/adr/0016-agents-source-of-truth.mdx)).

| Entry                 | Holds                                                         | Projected to                                                             |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`rules/`](rules)     | always-on and file-scoped repository rules                    | rendered into the marked block of the root `AGENTS.md`                   |
| [`agents/`](agents)   | subagent definitions, neutral frontmatter, no model ids       | generated into `.claude/agents/` and `.opencode/agents/`                 |
| [`hooks/`](hooks)     | the guard, hint and context hooks                             | symlinked into `.claude/hooks/`                                          |
| [`skills/`](skills)   | invocable skills (`<name>/SKILL.md`)                          | symlinked into `.claude/skills/`; OpenCode reads `.agents/skills` itself |
| [`specs/`](specs)     | spec-kit specs, one `sta-<n>-<slug>/` folder per Linear issue | read in place, not projected                                             |
| [`speckit/`](speckit) | the Stackra spec-kit preset source                            | installed into `.specify/presets/` by `pnpm speckit:sync`                |
| `models.yaml`         | which model each assistant runs for each agent tier           | read by agents-sync                                                      |
| `routing.yaml`        | task type → executor, model and agent; the daily OpenCode cap | read by `pnpm delegate` and `pnpm ai:spend`                              |

A folder's `README.md` is documentation and is never projected.

## Generated, not hand-edited

Generated files open with a provenance marker. `pnpm agents:check` (part of `pnpm validate`) fails on drift or on a
hand-edited projection rather than silently overwriting it; `pnpm agents:sync` repairs it. agents-sync also renders
`.mcp.yaml` into `.mcp.json` and the constitution into `.specify/memory/constitution.md`.

```bash
pnpm agents:sync                              # project into every detected assistant (.claude/, .opencode/)
pnpm agents:check                             # verify; fails on drift
node tools/scripts/agents-sync.mjs --list     # show the mapping
node tools/scripts/agents-sync.mjs --lint     # validate agent sources only; writes nothing
```

The `guard-paths` hook refuses writes to `.claude/agents/`, `.opencode/agents/`, `.mcp.json` and the generated
block of `AGENTS.md`.

## Writing for this folder

Keep every rule and agent short and **true**. A wrong always-on rule is loaded into every session and misleads at a
cost; verify each claim against a real file, and name the check that enforces it (or say "planned"). See
[rules that don't rot](../apps/docs/src/agents/rules-that-dont-rot.mdx).
