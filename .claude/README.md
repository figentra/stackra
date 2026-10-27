# `.claude/`

What Claude Code reads in this repository. Most of it is projected from [`.agents/`](../.agents) by
`pnpm agents:sync`; edit the source there, never the projection. Claude reads the repository rules through
`CLAUDE.md` → `@AGENTS.md`, so there is no `.claude/rules/`.

| Path               | Holds                                                                                        | Edit here?                                           |
| ------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `settings.json`    | permissions (allow, ask, deny), enabled plugins and the hook wiring to `.agents/hooks/*.mjs` | yes                                                  |
| `launch.json`      | the dev-server launch configuration (the docs site on port 3333)                             | yes                                                  |
| `commands/`        | slash commands: `/sync` (agents sync and check) and `/verify` (the repo gate)                | yes                                                  |
| `agents/`          | subagents generated from `.agents/agents/*.md` with Claude's frontmatter and model tier      | no: `guard-paths` refuses it; edit `.agents/agents`  |
| `hooks/`           | symlinks to `.agents/hooks/*`                                                                | no: edit `.agents/hooks`                             |
| `skills/<name>`    | symlinks to `.agents/skills/<name>`                                                          | no: edit `.agents/skills`                            |
| `skills/speckit-*` | the spec-kit skills, rendered by `specify` with the Stackra preset                           | no: edit `.agents/speckit`, then `pnpm speckit:sync` |
| `worktrees/`       | agent worktrees, local and gitignored                                                        | —                                                    |

## Rules

- `settings.json` and `launch.json` stay strict `.json`: Claude Code reads fixed names (`MUST_STAY_JSON` in
  `tools/scripts/validate-repository.mjs`).
- `pnpm agents:check` (in `pnpm validate` and CI) fails on drift between `.agents/` and this folder.
- No secret goes in `settings.json`; MCP servers that need a token start through `tools/scripts/mcp.sh`, which reads
  the Infisical vault ([secrets rule](../.agents/rules/secrets.md)).

Docs: [agents](../apps/docs/src/docs/agents/index.mdx),
[ADR 0016](../apps/docs/src/docs/adr/0016-agents-source-of-truth.mdx).
