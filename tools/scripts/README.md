<!-- Purpose: one line per repo script and how it runs. Boundary: tools/scripts only. Runtime: docs. Governing contract: each script's docblock; ADR 0022. -->

# `tools/scripts/`

One line per script. Each file's docblock is the full contract; the tests are in `__tests__/` (fixtures in
`__tests__/__fixtures__/`) and run with `node --test` in `pnpm validate`. Commands marked † run through
`infisical run --env=dev --path=/agents` for their token.

The internal-operations scripts (agent sync, AI spend, the GitHub bots, `pr:merge`, Linear, delegate, guard port,
secrets import, brand pull) moved to the private `figentra` CLI (`@figentra/cli`, figentra/figentra `packages/cli`);
the root `package.json` aliases call it. `linear.mjs` and `bot-token.mjs` stay here only as the library
`spec-linear.mjs` and `spec-gate.mjs` import, until those move to `vellum`.

| Script                 | Command                                            | Does                                                                                                                                                 |
| ---------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `speckit-sync.mjs`     | `pnpm speckit:sync`                                | installs the Stackra spec-kit preset into `.specify/` and re-renders both integrations                                                               |
| `spec-gate.mjs`        | `pnpm spec:gate`                                   | spec stage gates, tasks lint, lane and branch checks, and the spec-kit wrap tripwire                                                                 |
| `spec-trace.mjs`       | `pnpm spec:trace`                                  | requirement → task → `@covers` test traceability and spec-vs-diff drift                                                                              |
| `spec-parse.mjs`       | —                                                  | pure parsers for spec, plan, tasks and `routing.yaml`, shared by spec-gate and spec-trace                                                            |
| `spec-linear.mjs`      | `pnpm spec:linear` †                               | creates a spec's Linear issue and one sub-issue per task                                                                                             |
| `linear.mjs`           | `pnpm linear <command>` †                          | the Linear client: `start`, `review`, `done`, `comment`, `link`, `create`, `mine`, `open`, `digest`, `check-pr`                                      |
| `bot-token.mjs`        | `pnpm bot:token` †                                 | mints a GitHub App token for `stackra-bot` or `stackra-reviewer`; the network layer (30 s connect timeout, retries) of bot-gh, pr-merge, linear      |
| `mcp.sh`               | `.mcp.yaml`                                        | launches an MCP server with its secrets injected from the vault, never from `.mcp.json`                                                              |

The repository checks, `pnpm new`, `pnpm doctor`, `pnpm eas:preflight`, the structure page and the architecture map
are `stackra` commands of `@stackra/cli` (`stackra --help`); their data files stay here (`any-ratchet.baseline.yaml`,
`duplication-baseline.yaml`).

## Rules

- A script that changes behaviour changes its test in `__tests__/` in the same commit.
- Exit codes are documented in the docblock; a Linear failure never fails a gate
  ([ADR 0065](../../apps/docs/src/docs/adr/0065-linear-gate-is-checked-offline.mdx) rule 7).
- No token in argv, a file or the output.
