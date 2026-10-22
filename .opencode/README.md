# `.opencode/`

What OpenCode reads in this repository. OpenCode runs the delegated, mechanical tasks that `pnpm delegate` routes to
it (`.agents/routing.yaml`, [ADR 0066](../apps/docs/src/adr/0066-delegation-to-opencode-by-routing-matrix.mdx)). Its
project configuration is the root `opencode.jsonc` (model, `AGENTS.md` as instructions, permissions); it reads the
rules from `AGENTS.md` and the skills from `.agents/skills` directly.

| Path                       | Holds                                                                                                     | Edit here?                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `agents/`                  | subagents generated from `.agents/agents/*.md` with OpenCode's frontmatter and permissions                | no: `guard-paths` refuses it; edit `.agents/agents`  |
| `commands/speckit.*.md`    | the spec-kit commands, rendered by `specify` with the Stackra preset                                      | no: edit `.agents/speckit`, then `pnpm speckit:sync` |
| `plugins/guard/index.ts`   | the guard plugin: denies secret reads and writes and owner-only commands, and edits in the main checkout  | yes                                                  |
| `plugins/guard/decide.ts`  | the plugin's decisions: the shared `.agents/hooks/_rules.mjs` tiers (ask is deny) plus the executor layer | yes                                                  |
| `plugins/guard/__tests__/` | `node:test` suite for `decide.ts`, run by `pnpm test:hooks`                                               | yes                                                  |

## Rules

- OpenCode works only in a worktree; the guard refuses edits in the main checkout.
- Executors commit on their delegate branch and push it with `pnpm bot:git -- push origin HEAD` (ADR 0293, amending
  ADR 0066); every other bot wrapper, Infisical and network git are the lead's.
- The tiers live in `.agents/hooks/_rules.mjs` (shared with Claude's hooks) and again in `opencode.jsonc`, whose
  permission list is order-sensitive (the last match wins). Change a rule in both, with its test.
- `pnpm agents:check` fails on drift between `.agents/` and this folder.

Docs: [concurrent sessions](../apps/docs/src/agents/concurrent-sessions.mdx),
[ADR 0016](../apps/docs/src/adr/0016-agents-source-of-truth.mdx).
