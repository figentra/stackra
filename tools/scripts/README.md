<!-- Purpose: one line per repo script and how it runs. Boundary: tools/scripts only. Runtime: docs. Governing contract: each script's docblock; ADR 0022. -->

# `tools/scripts/`

One line per script. Each file's docblock is the full contract; the tests are in `__tests__/` (fixtures in
`__tests__/__fixtures__/`) and run with `node --test` in `pnpm validate`. Commands marked † run through
`secrets-exec.mjs`, which decrypts only the names they need from the `agents` scope of figentra/secrets (ADR 0525).

The internal-operations scripts (agent sync, AI spend, the GitHub bots, `pr:merge`, Linear, delegate, guard port,
secrets import, brand pull) move to the private `figentra` CLI (`@figentra/cli`, ADR 0500) once it is published;
until then they run from here and the root `package.json` aliases call them (STA-1857).

| Script                 | Command                                            | Does                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spec-gate.mjs`        | `pnpm spec:gate`                                   | a shim for `fflow gate` (ADR 0503), kept for the plan-gate hook and the pre-push `spec-branch` step: spec stage gates, tasks lint, lane, branch and the install check |
| `spec-trace.mjs`       | `pnpm spec:trace`                                  | a shim for `fflow trace` (ADR 0503): `@covers` traceability and spec-vs-diff drift                                                                                    |
| `spec-parse.mjs`       | —                                                  | re-exports `@figentra-oss/flow/parse`, the spec, plan and tasks parsers                                                                                                       |
| `spec-linear.mjs`      | `pnpm spec:linear` †                               | a shim for `fflow linear` (ADR 0503): a spec's Linear issue and one sub-issue per task                                                                                |
| `linear.mjs`           | `pnpm linear <command>` †                          | the Linear client: `start`, `review`, `done`, `comment`, `link`, `create`, `mine`, `open`, `digest`, `check-pr`                                                               |
| `record-terminal-demo.mjs` | `node tools/scripts/record-terminal-demo.mjs --out <file.json> -- <command…>` | records a real CLI session as `TerminalLine[]` JSON for `TerminalDemo` (STA-2041); run it on the testbed |
| `bot-token.mjs`        | `pnpm bot:token` †                                 | mints a GitHub App token for `stackra-bot`; the network layer (30 s connect timeout, retries) of bot-gh, pr-merge, linear                               |
| `mcp.sh`               | `.mcp.yaml`                                        | launches an MCP server through `secrets-exec.mjs` with only the secrets it names, never from `.mcp.json`                                                                      |
| `secrets-exec.mjs`     | the † scripts, `mcp.sh`                            | runs one command with the named `agents` secrets of figentra/secrets in its environment, decrypted by sops in memory; prints none                                          |
| `ai-spend.mjs`         | `pnpm ai:spend`                                    | today's and the 7-day OpenCode spend against the daily cap                                                                                                                    |
| `bot-gh.mjs`           | `pnpm bot:gh`, `pnpm bot:git` †                    | runs `gh` or `git` as `stackra-bot` (`bot:review` and the `stackra-reviewer` App are retired, ADR 0523 decision 6) |
| `delegate.mjs`         | `pnpm delegate <task-type> "<brief>"`              | hands a task to the executor `.agents/routing.yaml` names, in a fresh worktree (`--issue STA-n` required)                                                                     |
| `draw-landing-art.mjs` | `node tools/scripts/draw-landing-art.mjs`          | draws the landing's engine, stack and monitor line art into `assets/landing/art/` as four mask layers each (`<name>.<tone>.svg`: ground, dots, line, core) for `Illustration` (STA-2041); rerun after any change, the test fails on a stale file |
| `guard-port.mjs`       | `node tools/scripts/guard-port.mjs <dir> <repo>`   | vendors `.agents/hooks` into figentra/os, muslin or juristra (`<dir>` its `.agents/hooks`) with the port hunks (STA-449)                                                      |
| `linear-reconcile.mjs` | `linear-sync.yml` (CI)                             | nightly repair of Linear state from GitHub PRs and ADR statuses                                                                                                               |
| `pr-merge.mjs`         | `pnpm pr:merge [-R owner/repo] <n>` †              | the only agent merge (enqueues where a merge queue exists): green Quality Gate, `AI-REVIEW: PASS` on the head's patch id, owner approval when needed                          |

The repository checks, `pnpm new`, `pnpm doctor`, `pnpm eas:preflight`, the structure page and the architecture map
are `stackra` commands of `@stackra/cli` (`stackra --help`); their data files stay here (`any-ratchet.baseline.yaml`,
`duplication-baseline.yaml`).

## Rules

- A script that changes behaviour changes its test in `__tests__/` in the same commit.
- Exit codes are documented in the docblock; a Linear failure never fails a gate
  ([ADR 0065](../../apps/docs/src/docs/adr/0065-linear-gate-is-checked-offline.mdx) rule 7).
- No token in argv, a file or the output.
