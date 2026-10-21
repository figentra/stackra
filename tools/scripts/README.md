# `tools/scripts/`

One line per script. Each file's docblock is the full contract; the tests are in `__tests__/` (fixtures in
`__tests__/__fixtures__/`) and run with `node --test` in `pnpm validate`. Commands marked † run through
`infisical run --env=dev --path=/agents` for their token.

| Script                    | Command                                            | Does                                                                                                                                                      |
| ------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate-repository.mjs` | `pnpm validate`                                    | the repository-shape gate: catalogs, names, tier tags, presets, required files, test placement, JSON vs JSONC, forbidden dependencies, service shape      |
| `scaffold.mjs`            | `pnpm new <kind> <name>`                           | renders a member from `tools/scaffold/templates` and formats it                                                                                           |
| `structure.mjs`           | `node tools/scripts/structure.mjs --write-docs`    | the one source of categories, entries, kind folders, banned folders, suffixes, test tiers and exceptions; renders `apps/docs/src/standards/structure.mdx` |
| `agents-sync.mjs`         | `pnpm agents:sync`, `pnpm agents:check`            | projects `.agents/` into `.claude/` and `.opencode/`, renders the `AGENTS.md` rules block, `.mcp.json` and the constitution                               |
| `speckit-sync.mjs`        | `pnpm speckit:sync`                                | installs the Stackra spec-kit preset into `.specify/` and re-renders both integrations                                                                    |
| `spec-gate.mjs`           | `pnpm spec:gate`                                   | spec stage gates, tasks lint, lane and branch checks, and the spec-kit wrap tripwire                                                                      |
| `spec-trace.mjs`          | `pnpm spec:trace`                                  | requirement → task → `@covers` test traceability and spec-vs-diff drift                                                                                   |
| `spec-parse.mjs`          | —                                                  | pure parsers for spec, plan, tasks and `routing.yaml`, shared by spec-gate and spec-trace                                                                 |
| `spec-linear.mjs`         | `pnpm spec:linear` †                               | creates a spec's Linear issue and one sub-issue per task                                                                                                  |
| `linear.mjs`              | `pnpm linear <command>` †                          | the Linear client: `start`, `review`, `done`, `comment`, `link`, `create`, `mine`, `open`, `digest`, `check-pr`                                           |
| `linear-reconcile.mjs`    | `linear-sync.yml` (CI)                             | nightly repair of Linear state from GitHub PRs and ADR statuses                                                                                           |
| `delegate.mjs`            | `pnpm delegate <task-type> "<brief>"`              | hands a task to the executor `.agents/routing.yaml` names, in a fresh worktree (`--issue STA-n` required)                                                 |
| `ai-spend.mjs`            | `pnpm ai:spend`                                    | today's and the 7-day OpenCode spend against the daily cap                                                                                                |
| `doctor.mjs`              | `pnpm doctor`                                      | fresh-machine checklist: toolchain, install, Infisical login, CLIs, agent sync                                                                            |
| `bot-token.mjs`           | `pnpm bot:token` †                                 | mints a GitHub App installation token for `stackra-bot` (or `stackra-reviewer` with the `STACKRA_REVIEWER` prefix)                                        |
| `bot-gh.mjs`              | `pnpm bot:gh`, `pnpm bot:git`, `pnpm bot:review` † | runs `gh` or `git` as `stackra-bot`; `bot:review` runs read, comment and review `gh` as `stackra-reviewer` (ADR 0230)                                     |
| `pr-merge.mjs`            | `pnpm pr:merge [-R owner/repo] <n>` †              | the only agent merge: green Quality Gate, `AI-REVIEW: PASS` on the head SHA, owner approval when needed                                                   |
| `jsonc.mjs`               | —                                                  | the shared JSONC reader for the other scripts                                                                                                             |
| `mcp.sh`                  | `.mcp.yaml`                                        | launches an MCP server with its secrets injected from the vault, never from `.mcp.json`                                                                   |

## Rules

- A script that changes behaviour changes its test in `__tests__/` in the same commit.
- Exit codes are documented in the docblock; a Linear failure never fails a gate
  ([ADR 0065](../../apps/docs/src/adr/0065-linear-gate-is-checked-offline.mdx) rule 7).
- No token in argv, a file or the output.
