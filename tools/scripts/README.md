<!-- Purpose: one line per repo script and how it runs. Boundary: tools/scripts only. Runtime: docs. Governing contract: each script's docblock; ADR 0022. -->

# `tools/scripts/`

One line per script. Each file's docblock is the full contract; the tests are in `__tests__/` (fixtures in
`__tests__/__fixtures__/`) and run with `node --test` in `pnpm validate`. Commands marked † run through
`infisical run --env=dev --path=/agents` for their token.

| Script                 | Command                                            | Does                                                                                                                                                 |
| ---------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents-sync.mjs`      | `pnpm agents:sync`, `pnpm agents:check`            | projects `.agents/` into `.claude/` and `.opencode/`, renders the `AGENTS.md` rules block, the gitignored `.mcp.json` and the constitution           |
| `speckit-sync.mjs`     | `pnpm speckit:sync`                                | installs the Stackra spec-kit preset into `.specify/` and re-renders both integrations                                                               |
| `spec-gate.mjs`        | `pnpm spec:gate`                                   | spec stage gates, tasks lint, lane and branch checks, and the spec-kit wrap tripwire                                                                 |
| `spec-trace.mjs`       | `pnpm spec:trace`                                  | requirement → task → `@covers` test traceability and spec-vs-diff drift                                                                              |
| `spec-parse.mjs`       | —                                                  | pure parsers for spec, plan, tasks and `routing.yaml`, shared by spec-gate and spec-trace                                                            |
| `spec-linear.mjs`      | `pnpm spec:linear` †                               | creates a spec's Linear issue and one sub-issue per task                                                                                             |
| `linear.mjs`           | `pnpm linear <command>` †                          | the Linear client: `start`, `review`, `done`, `comment`, `link`, `create`, `mine`, `open`, `digest`, `check-pr`                                      |
| `linear-reconcile.mjs` | `linear-sync.yml` (CI)                             | nightly repair of Linear state from GitHub PRs and ADR statuses                                                                                      |
| `delegate.mjs`         | `pnpm delegate <task-type> "<brief>"`              | hands a task to the executor `.agents/routing.yaml` names, in a fresh worktree (`--issue STA-n` required)                                            |
| `ai-spend.mjs`         | `pnpm ai:spend`                                    | today's and the 7-day OpenCode spend against the daily cap                                                                                           |
| `bot-token.mjs`        | `pnpm bot:token` †                                 | mints a GitHub App token for `stackra-bot` or `stackra-reviewer`; the network layer (30 s connect timeout, retries) of bot-gh, pr-merge, linear      |
| `bot-gh.mjs`           | `pnpm bot:gh`, `pnpm bot:git`, `pnpm bot:review` † | runs `gh` or `git` as `stackra-bot`; `bot:review` runs read, comment and review `gh` as `stackra-reviewer` (ADR 0230)                                |
| `pr-merge.mjs`         | `pnpm pr:merge [-R owner/repo] <n>` †              | the only agent merge (enqueues where a merge queue exists): green Quality Gate, `AI-REVIEW: PASS` on the head's patch id, owner approval when needed |
| `mcp.sh`               | `.mcp.yaml`                                        | launches an MCP server with its secrets injected from the vault, never from `.mcp.json`                                                              |
| `guard-port.mjs`       | `node tools/scripts/guard-port.mjs <dir> <repo>`   | vendors `.agents/hooks` into figentra/os, muslin or juristra (`<dir>` its `.agents/hooks`) with the port hunks (STA-449)                             |

`product-gate.mjs` (`node tools/scripts/product-gate.mjs --core <dir> --checkout <dir> --product <name> --out <dir>`)
links core into a scratch copy of a pinned product (`product-gate.matrix.yaml`), runs gen, typecheck, test and
`test:int`, writes JSON and markdown summaries, and excuses known failures only through `product-gate.allow.yaml`
(an STA issue and an expiry of at most 30 days per entry; STA-1813).

The repository checks, `pnpm new`, `pnpm doctor`, `pnpm eas:preflight`, the structure page and the architecture map
are `stackra` commands of `@stackra/cli` (`stackra --help`); their data files stay here (`any-ratchet.baseline.yaml`,
`duplication-baseline.yaml`).

## Rules

- A script that changes behaviour changes its test in `__tests__/` in the same commit.
- Exit codes are documented in the docblock; a Linear failure never fails a gate
  ([ADR 0065](../../apps/docs/src/docs/adr/0065-linear-gate-is-checked-offline.mdx) rule 7).
- No token in argv, a file or the output.
