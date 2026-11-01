# Adoption: moving `stackra`, `runway` and `figentra` onto `@stackra/console`

**Spec**: [spec.md](./spec.md) FR-032 · **Linear**: STA-1730 (plan only; nothing migrates here) · ADR 0506, ADR 0500

## The rule that orders everything

ADR 0500 decision 7: a command that moves keeps its flags, exit codes, stdout and stderr. A restyle comes afterwards,
in its own commit. So each CLI moves in two steps:

1. **Port.** Each command becomes a `Command` class with `@Argument`/`@Option` fields, and its `run` body becomes
   `handle(io)`. Its existing writes stay as they are: they go through `io.output.line(...)`, or for a byte-exact
   stream through the stdout the command already holds. The old tests move with it. The parity run on the ci-box
   (0500 decision 7) compares the old output with the new.
2. **Restyle.** Swap to the shared components (`task`, `note`, `table`, the error screen, the banner on the command
   list) and add `--json` where a script reads the output. This is a separate PR per CLI, with the output change
   called out in its changeset.

## Differences to settle in the port

| Today                                                                                   | On `@stackra/console`                          | How the port bridges it                                                                                                                                            |
| --------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Spaced names (`stackra mcp sync`, `figentra bot gh`)                                    | `:`-joined names (`mcp:sync`)                  | Declare `mcp:sync`, and the kernel's `splitInvocation` joins two leading words when they form a registered `a:b` name (a small kernel change in the first port PR) |
| `CliCommand` data objects (`name`, `summary`, `usage`, `options`, `positionals`, `run`) | Classes; the help is generated from the fields | `usage` text goes away; the generated help covers it, and a parity test pins the `--help` lines that scripts read                                                  |
| Exit 1 on every error in `runway` (`runway: <reason>`)                                  | 1 on an error, 2 on usage                      | Usage errors that scripts check move to exit 2 only in the restyle step                                                                                            |
| `-n` free in some commands                                                              | `-n` is `--no-interaction`                     | A command that used `-n` keeps its long name and loses the short one (named in the changeset)                                                                      |

## Order

1. **`stackra`** (`@stackra/cli`): `COMMANDS` in `packages/developer/cli/src/node/constants/commands.constant.ts`
   becomes the registry of `createConsole`. Each `*_COMMAND` constant becomes a class in
   `src/node/commands/<name>.command.ts`; `toolCommand(...)` and `checkCommand(...)` become small base classes the
   tool and check commands extend. Once STA-1731 lands, the commands that belong to a package (`db:migrate`,
   `db:rollback`, `search:reindex`, `search:status`, `settings:apply`, `settings:diff`) move into that package's
   `commands/` group. The `stackra` binary then loads its own commands and, inside a project, the project's
   `#stackra/commands`. Theme: `STACKRA_THEME`.
2. **`runway`** (`@stackra/runway`): `runRunway`'s verbs (`deploy`, `promote`, `status`) become three commands. Its
   theme comes from the Runway brand tokens through `themeFromBrandTokens`, in the runway package, not here.
3. **`figentra`** (`@figentra/cli`, figentra/figentra `packages/cli`, local `.next/figentra/packages/cli`): its
   `src/route.mjs` and `src/commands/*.mjs` move to TypeScript `Command` classes. Its theme comes from the Figentra
   brand tokens (`figentra brand pull`). The secret guards keep matching its command names (0500 decision 8):
   renames such as `bot gh` → `bot:gh` stay spaced on the command line through the joining rule above, so
   `.agents/hooks/_rules.mjs` and the OpenCode guard need no change. If one does, it changes in the same commit.

Each step is one PR, gated on a box by stackra-f4.

## Later, if wanted

- `@stackra/create-console`: a thin wrapper so `pnpm create @stackra/console my-cli` works, calling
  `stackra-console create`. It is not needed for `pnpm dlx @stackra/console create my-cli`.
- Shell completion generated from the registry.

## Not affected

Figentra Flow (`figentra/flow`) stays independent and never depends on `@stackra/console`; it follows
[flow-visual-spec.md](./flow-visual-spec.md) on its own.
