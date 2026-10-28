# `tools/scripts/`

One line per script. Each file's docblock is the full contract; the tests are in `__tests__/` (fixtures in
`__tests__/__fixtures__/`) and run with `node --test` in `pnpm validate`. Commands marked † run through
`infisical run --env=dev --path=/agents` for their token.

| Script                       | Command                                            | Does                                                                                                                                                 |
| ---------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate-repository.mjs`    | `pnpm validate`                                    | thin wrapper: the repository-shape gate (config, structure and catalogue checks) now in `@stackra/repo-checks`; `stackra check` runs the same        |
| `doc-standard.mjs`           | `pnpm validate`                                    | thin wrapper: the doc-standard check (ADR 0007) in `@stackra/repo-checks`                                                                            |
| `catalogue-completeness.mjs` | `node tools/scripts/catalogue-completeness.mjs`    | thin wrapper: the lang catalogue gate (ADR 0403) in `@stackra/repo-checks`                                                                           |
| `repo-checks.mjs`            | —                                                  | loads `@stackra/repo-checks` from source for the wrappers (type stripping plus a `#` resolve hook)                                                   |
| `scaffold.mjs`               | `pnpm new <kind> <name>`                           | renders a member from `tools/scaffold/templates` and formats it                                                                                      |
| `structure.mjs`              | `node tools/scripts/structure.mjs --write-docs`    | re-exports the structure tables of `@stackra/repo-checks` for the scaffold and renders `apps/docs/src/docs/standards/structure.mdx`                  |
| `agents-sync.mjs`            | `pnpm agents:sync`, `pnpm agents:check`            | projects `.agents/` into `.claude/` and `.opencode/`, renders the `AGENTS.md` rules block, the gitignored `.mcp.json` and the constitution           |
| `speckit-sync.mjs`           | `pnpm speckit:sync`                                | installs the Stackra spec-kit preset into `.specify/` and re-renders both integrations                                                               |
| `spec-gate.mjs`              | `pnpm spec:gate`                                   | spec stage gates, tasks lint, lane and branch checks, and the spec-kit wrap tripwire                                                                 |
| `spec-trace.mjs`             | `pnpm spec:trace`                                  | requirement → task → `@covers` test traceability and spec-vs-diff drift                                                                              |
| `spec-parse.mjs`             | —                                                  | pure parsers for spec, plan, tasks and `routing.yaml`, shared by spec-gate and spec-trace                                                            |
| `spec-linear.mjs`            | `pnpm spec:linear` †                               | creates a spec's Linear issue and one sub-issue per task                                                                                             |
| `linear.mjs`                 | `pnpm linear <command>` †                          | the Linear client: `start`, `review`, `done`, `comment`, `link`, `create`, `mine`, `open`, `digest`, `check-pr`                                      |
| `linear-reconcile.mjs`       | `linear-sync.yml` (CI)                             | nightly repair of Linear state from GitHub PRs and ADR statuses                                                                                      |
| `delegate.mjs`               | `pnpm delegate <task-type> "<brief>"`              | hands a task to the executor `.agents/routing.yaml` names, in a fresh worktree (`--issue STA-n` required)                                            |
| `ai-spend.mjs`               | `pnpm ai:spend`                                    | today's and the 7-day OpenCode spend against the daily cap                                                                                           |
| `doctor.mjs`                 | `pnpm doctor`                                      | fresh-machine checklist: toolchain, install, Infisical login, CLIs, agent sync                                                                       |
| `bot-token.mjs`              | `pnpm bot:token` †                                 | mints a GitHub App token for `stackra-bot` or `stackra-reviewer`; the network layer (30 s connect timeout, retries) of bot-gh, pr-merge, linear      |
| `bot-gh.mjs`                 | `pnpm bot:gh`, `pnpm bot:git`, `pnpm bot:review` † | runs `gh` or `git` as `stackra-bot`; `bot:review` runs read, comment and review `gh` as `stackra-reviewer` (ADR 0230)                                |
| `pr-merge.mjs`               | `pnpm pr:merge [-R owner/repo] <n>` †              | the only agent merge (enqueues where a merge queue exists): green Quality Gate, `AI-REVIEW: PASS` on the head's patch id, owner approval when needed |
| `package-cycles.mjs`         | `pnpm validate`                                    | fails on any workspace package cycle (dependencies, dev, peer, optional), printing the full path; exports the workspace member reader                |
| `duplicate-exports.mjs`      | `pnpm validate`                                    | fails when one exported name is declared in two packages' `src/`; `ALLOWED` (intended copies) and `PENDING` (other batches) exempt a name            |
| `architecture-map.mjs`       | `node tools/scripts/architecture-map.mjs`          | writes the docs architecture map (archify candidate and HTML asset); `pnpm validate` runs its drift check                                            |
| `jsonc.mjs`                  | —                                                  | the shared JSONC reader for the other scripts                                                                                                        |
| `mcp.sh`                     | `.mcp.yaml`                                        | launches an MCP server with its secrets injected from the vault, never from `.mcp.json`                                                              |
| `guard-port.mjs`             | `node tools/scripts/guard-port.mjs <dir> <repo>`   | vendors `.agents/hooks` into figentra/os, muslin or juristra (`<dir>` its `.agents/hooks`) with the port hunks (STA-449)                             |

## Rules

- A script that changes behaviour changes its test in `__tests__/` in the same commit.
- Exit codes are documented in the docblock; a Linear failure never fails a gate
  ([ADR 0065](../../apps/docs/src/docs/adr/0065-linear-gate-is-checked-offline.mdx) rule 7).
- No token in argv, a file or the output.
