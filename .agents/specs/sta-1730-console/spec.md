# Feature Specification: `@stackra/console`, the command framework and terminal look of every Stackra CLI

**Created**: 2026-10-31

**Status**: Draft <!-- spec and design stop: waiting for the leader's approval before any build -->

**Linear**: STA-1730

**Clarifications status**: pending <!-- the open questions at the end go to the leader and the owner -->

**Input**: the owner approved on 2026-10-31 porting `@stackra/console` (basalt `packages/os/console`, Academorix spec 030) into core and giving every Stackra CLI a Symfony Console and Laravel installer experience: a gradient logo,
robust prompts, one layout, and a colour, logo and glyph per product. `stackra`, `runway` and the `figentra` CLI
(ADR 0500) are hand-built today with plain output and no shared framework.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/console (new member)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none (the scaffolder writes registry scope lines only; a password prompt never echoes and never logs)
- **ADR needed**: yes. ADR 0501 adds the `Command` kind (row in the 0294 kind table, a `commands/` group for modules
  and apps, `.command.ts`) and names `@stackra/console` as the CLI framework and presentation standard of 0500's CLIs
- **New dependencies**: none (`node:util` `parseArgs` and `styleText`, `node:readline`, `Intl.Segmenter`; the basalt
  port used `@clack/prompts`, which is replaced by a prompter of our own, see Q2)
- **Deploy modes**: same everywhere (a library and a bin; nothing deployed)
- **Licence tier**: free (`@stackra/console`)
- **Docs to update**: ADR 0501; ADR 0294 kind and group tables (by amendment note); `packages/developer/README.md`;
  the package README and AGENTS.md; a docs page `apps/docs/src/docs/packages/console.mdx`
- **Lane**: full
- **Change risk**: R2 (a new member and a new kind; no runtime of any service or app changes)

## Users

- **Command author**: writes `class SeedCommand extends Command({ name, description, arguments, options })` with a
  typed `handle(input, io)`, and gets parsing, help, prompts, output and tests for free.
- **CLI owner** (stackra, runway, figentra, a customer): one `runNodeConsole({ name, version, theme, commands })` call.
- **Operator**: a person at a terminal, or a CI job, or a script reading `--json`.
- **Test author**: runs a command in-process with scripted answers and reads exit code, stdout and stderr.

## Requirements

### Declaring and running commands (ported from spec 030, adapted to v3)

- **FR-001** A command is a class that extends `Command({ name, description, arguments?, options?, hidden?, aliases? })`.
  The options are inert and serialisable; reading them (`kindOf`) never constructs the class.
- **FR-002** `handle(input, io)` gets its input type from the declaration: a `number` option is a `number`, an
  optional argument with no default is `T | undefined`, an unknown name is a type error (type tests).
- **FR-003** Declaration errors are refused at declaration time with a named error: bad command name (`[a-z0-9-]+`
  joined by `:`), a required argument after an optional one, a duplicate name, an option that reuses a global option.
- **FR-004** The kernel builds its command list from the classes it is given or from a container
  (`container.getAll(Command)`); two commands with one name are refused with both class names.
- **FR-005** Parsing (`node:util.parseArgs`): positionals in order, `--name value`, `--name=value`, `-n value`,
  `--no-<flag>`, `--`, defaults, `number` conversion, repeated options as arrays. A usage error exits 2, names the
  argument or option, and never constructs or boots anything.
- **FR-006** An unknown command lists up to 3 names within edit distance 2 ("Did you mean ...?"); a unique prefix of a
  namespace runs the command (`t:s` for `tenant:seed`, as Symfony does).
- **FR-007** Exit codes: 0 success, the handler's integer 0 to 255, 1 on a thrown error, 2 on usage, 130 on SIGINT or a
  cancelled prompt, 143 on SIGTERM. The kernel returns the code; only the node binding sets `process.exitCode`.
- **FR-008** Lifecycle: a container is created only to dispatch (never for list, help or version) and is closed after
  the handler, after a throw and after a signal; a close failure after success exits 1 with its message.
- **FR-009** Global options on every command: `-h/--help`, `-V/--version`, `-v/--verbose`, `-q/--quiet`,
  `-n/--no-interaction`, `--json`, `--ansi`/`--no-ansi`.

### Presentation (the Laravel installer and Laravel Prompts feel)

- **FR-010** A banner: the theme's ASCII logo coloured by a horizontal gradient across the theme's stops, then the
  product name, version and glyph line. Shown on the command list and by `io.output.banner()`; never under `--json`,
  `--quiet` or a non-TTY stdout.
- **FR-011** A theme is a small object: `name`, `logo` (lines), `gradient` (2 to 5 hex stops), `accent` (hex), `glyph`
  (one grapheme, with an ASCII fallback). `themeFromBrandTokens(colorJson, overrides)` builds one from a brand's DTCG
  `tokens/color.json`. Layout, spacing, symbols and copy are the same for every theme; only colour, logo and glyph
  change.
- **FR-012** Output components: `info`, `success`, `warn`, `error`, `line`, `title`, `keyValue`, `list`, `table`,
  `note` (a boxed note: info, warning, alert), `task(label, fn)` (the Laravel "label ....... DONE" line), `spinner`,
  `progress`, `json`, and an error screen for a thrown error (title, message, a hint when the error has one, the stack
  and cause chain under `--verbose`). Warnings and errors go to stderr.
- **FR-013** Colour depth is decided once per run: none under `NO_COLOR` (non-empty), `--no-ansi`, a non-TTY stdout
  (unless `FORCE_COLOR` or `--ansi`) or `TERM=dumb`; 24-bit with `COLORTERM=truecolor|24bit`; else 256; else 16. The
  gradient degrades to the nearest colour of the depth, and to plain text at none.
- **FR-014** Plain mode (no colour or no TTY): no escape sequence at all, no cursor movement, a spinner prints one line
  when it starts and one when it ends, progress prints at most every 10 %, boxes use ASCII (`+-|`).
- **FR-015** `--json`: no banner, no colour, no spinner; the run writes exactly one JSON document to stdout,
  `{ "ok": true, "data": <value> }` from `io.output.json(value)` or the handler's return data, or
  `{ "ok": false, "error": { "code", "message" } }` with the same exit code as without `--json`. Prompts behave as
  non-interactive.
- **FR-016** Interaction: prompts run only when stdin and stdout are TTYs, `CI` is unset or empty, and neither
  `--no-interaction` nor `--json` is given. Otherwise a prompt with a default answers with it, and one without fails
  the run with exit 2 naming the prompt and the option that would answer it.
- **FR-017** Prompts: `text` (placeholder, default, validate), `password` (echoes nothing; never logged), `confirm`,
  `select`, `multiselect`, `search` (filter as you type), in a framed Laravel Prompts style coloured by the theme;
  Ctrl-C or Escape cancels with exit 130; a validation message keeps the prompt open.
- **FR-018** Right-to-left text: widths come from grapheme clusters (`Intl.Segmenter`) with wide East Asian and
  zero-width characters counted correctly, so Arabic and Hebrew align in tables, boxes and task lines; an RTL run inside
  an LTR layout is wrapped in Unicode isolates (FSI U+2068 ... PDI U+2069) and is never reversed by us. Tests use Arabic.

### Testing harness

- **FR-019** `runCommandForTest(commands | container, argv, { answers, env, tty })` runs in-process and returns
  `{ exitCode, stdout, stderr, json }`; answers are used in order; a prompt after the last answer fails naming the
  prompt; output is plain unless the test asks for colour.

### The `create` scaffolder (like `laravel new`)

- **FR-020** `stackra-console create <dir>` (the package's own bin, built on the framework itself) shows the banner,
  asks for the app name, the binary name and the theme accent when interactive (flags answer them otherwise:
  `--name`, `--bin`, `--accent`, `--no-install`, `--pm pnpm|npm`, `--package-spec <spec>`), refuses a non-empty
  folder, writes the app, and installs.
- **FR-021** The generated app is plain TypeScript with no Stackra monorepo assumptions: `package.json` (bin, `build`,
  `typecheck`, `test`, `start`), `tsconfig.json`, `.npmrc` with the `@stackra` registry scope line only (no token),
  `src/main.ts`, `src/theme.ts`, `src/commands/greet.command.ts` (an argument, an option, a prompt, a table and
  `--json` data) and `src/commands/__tests__/greet.command.test.ts` (help, run, a scripted prompt, `NO_COLOR`,
  `--json`). It builds with `tsc` and tests with `vitest`.

### Adoption and the Flow visual spec (documents only)

- **FR-022** `adoption.md` in this folder says how `stackra`, `runway` and `figentra` move onto the framework, in an
  order that keeps ADR 0500 decision 7 (a move keeps output; restyling is its own later commit). No CLI migrates in
  this issue.
- **FR-023** `flow-visual-spec.md` in this folder is a one-page visual spec Figentra Flow can follow without depending
  on `@stackra/console`: banner, symbols, spacing, colours by role, plain and JSON rules.

## Success criteria

- **SC-001** On stackra-f4: the generated demo app installs, builds, typechecks and passes its tests; `--help`, the
  example command, a scripted prompt through the harness, `NO_COLOR=1` and `--json` all behave as FR-013 to FR-016 say.
- **SC-002** `pnpm verify` is green with the new member; the package's own tests cover every refusal of FR-003 to FR-007
  and FR-016, and the type tests cover FR-002.
- **SC-003** Under `NO_COLOR=1`, without a TTY and with `CI=1`, captured output contains no byte `\x1b`.
- **SC-004** A table with Arabic and English cells has every row the same display width.
- **SC-005** The command list of 50 commands renders in under 150 ms (p95) on the CI runner.

## Out of scope

- Migrating `stackra`, `runway` or `figentra` (FR-022 is the plan only).
- Shell completion scripts, a REPL, command events and middleware; gen emitting the command wiring (gen discovers
  `commands/` once the kind lands in the kind table; a customer app without gen passes its classes).
- Anything in figentra/flow.

## Open questions (for the leader and the owner)

- **Q1** ADR 0501 for the `Command` kind and the `commands/` group (0294 has "Command: a CLI command only" in its
  vocabulary, but no kind row). Approve the number and scope?
- **Q2** Prompts: our own `node:readline` prompter (no new dependency, full theme control; recommended) or
  `@clack/prompts` from a new catalog entry (the basalt port's choice; needs the owner)?
- **Q3** The scaffolder's home: a `stackra-console` bin inside `@stackra/console` (recommended; `pnpm dlx
@stackra/console create my-cli`), or `stackra new console-app` in `@stackra/cli`, or a separate
  `@stackra/create-console` for `pnpm create`?
- **Q4** Themes shipped in the package: `STACKRA_THEME` only (recommended; runway and figentra build theirs from their
  brand tokens in their own package), or all three?
