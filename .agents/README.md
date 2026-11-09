# `.agents/` — the source of truth for every AI artifact

One canonical tree, projected into each assistant's own directory by
`fflow sync` (`pnpm spec:sync`; `projection: true` in `flow.config.json`). Edit here; never edit the
projection ([ADR 0016](../apps/docs/src/docs/adr/0016-agents-source-of-truth.mdx)).

| Entry                     | Holds                                                         | Projected to                                                             |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`rules/`](rules)         | always-on and file-scoped repository rules                    | listed in the "Rules index" of the root `AGENTS.md` by Flow              |
| [`agents/`](agents)       | subagent definitions, neutral frontmatter, no model ids       | generated into `.claude/agents/` and `.opencode/agents/`                 |
| [`hooks/`](hooks)         | the guard, hint and context hooks                             | symlinked into `.claude/hooks/`                                          |
| [`skills/`](skills)       | invocable skills (`<name>/SKILL.md`)                          | symlinked into `.claude/skills/`; OpenCode reads `.agents/skills` itself |
| [`reference/`](reference) | fenced upstream material (the Encore skills, ADR 0258)        | not projected; read on purpose by `compiler-engineer`                    |
| [`specs/`](specs)         | Flow specs, one `sta-<n>-<slug>/` folder per Linear issue     | read in place, not projected                                             |
| `models.yaml`             | which model each assistant runs for each agent tier           | read by `fflow sync`                                            |
| `routing.yaml`            | task type → executor, model and agent; the daily OpenCode cap | read by `pnpm delegate` and `pnpm ai:spend`                              |

A folder's `README.md` is documentation and is never projected.

## Generated, not hand-edited

Generated files open with a provenance marker. `fflow gate ci` (part of `pnpm validate`) fails on drift or on a
hand-edited projection rather than silently overwriting it; `pnpm spec:sync` repairs it. The sync also renders
`.mcp.yaml` into the gitignored local `.mcp.json` (on install outside CI; the check compares it only if present).
`stackra validate --repository` lints the agent sources.

```bash
pnpm spec:sync                                # fflow sync: project into .claude/ and .opencode/
pnpm exec fflow check                         # verify; fails on drift
```

The `guard-paths` hook refuses writes to `.claude/agents/`, `.opencode/agents/`, `.mcp.json` and the generated
block of `AGENTS.md`.

## Writing for this folder

Keep every rule and agent short and **true**. A wrong always-on rule is loaded into every session and misleads at a
cost; verify each claim against a real file, and name the check that enforces it (or say "planned"). See
[rules that don't rot](../apps/docs/src/docs/agents/rules-that-dont-rot.mdx).
