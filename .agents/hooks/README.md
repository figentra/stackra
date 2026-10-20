# `.agents/hooks/`

The agent hooks, written once and wired into Claude Code by `.claude/settings.json` (`$CLAUDE_PROJECT_DIR/.agents/hooks/…`).
`pnpm agents:sync` also symlinks each file into `.claude/hooks/`. Node 24 and no dependencies, so a hook runs before
`pnpm install`. OpenCode gets the same secret rules from its own plugin, `.opencode/plugins/guard`.

| File                    | Event                                             | Does                                                                                                          |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `_io.mjs`               | —                                                 | shared stdin/stdout protocol helpers (`readStdin`, `deny`, `context`, `failOpen`)                             |
| `guard-bash.mjs`        | PreToolUse (Bash)                                 | refuses commands that destroy history, print or write secrets, or bypass the release or migration process     |
| `guard-paths.mjs`       | PreToolUse (Write, Edit, MultiEdit, NotebookEdit) | refuses writes to secret files (`.env*` and similar), generated output, lockfiles, changelogs and projections |
| `post-write-checks.mjs` | PostToolUse (Write, Edit, MultiEdit)              | reports, never fixes or blocks, a written file that oxfmt would reformat                                      |
| `prompt-hints.mjs`      | UserPromptSubmit                                  | one-line reminders keyed on the prompt's topic, each pointing at the rule that owns it                        |
| `session-context.mjs`   | SessionStart (startup, resume, compact, clear)    | re-states the repository invariants, the branch, the dirty tree, today's OpenCode spend and the Linear digest |
| `__tests__/`            | —                                                 | `node:test` suites, run by `pnpm test:hooks` (part of `pnpm validate`)                                        |

## Rules

- A guard denies with a reason that names the right way to do the thing; a hint or check never blocks.
- A hook fails open on its own errors (`failOpen`): a crashed hook never blocks work.
- Change a pattern together with its test in `__tests__/`.
- What the hooks do not enforce yet is listed under Enforcement in each rule in [`../rules`](../rules); the docs page
  is [hooks](../../apps/docs/src/agents/hooks.mdx).
