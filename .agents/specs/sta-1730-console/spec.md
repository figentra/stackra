# Feature Specification: `@stackra/console`, the command framework and terminal look of every Stackra CLI

**Created**: 2026-10-31

**Status**: Clarified

**Linear**: STA-1730 (phase 1); STA-1731 (phase 2, its own folder and design stop)

**Clarifications status**: complete

**Input**: the owner approved on 2026-10-31 porting `@stackra/console` (basalt `packages/os/console`, Academorix spec 030) into core and giving every Stackra CLI a Symfony Console and Laravel installer experience: a gradient logo,
robust prompts, one layout, and a colour, logo and glyph per product. `stackra`, `runway` and the `figentra` CLI
(ADR 0500) are hand-built today with plain output and no shared framework. On 2026-10-31 the owner approved the spec
stop ("handle all, all approved") and added STA-1731: every package exposes its own commands, and gen collects them.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/console (new member)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none (the scaffolder writes registry scope lines only; a password prompt never echoes and never logs)
- **ADR needed**: yes. ADR 0501 adds the `Command` kind (a row in the 0294 kind table; a `commands/` group in a
  module, a package's `src/node/` and an app; `.command.ts`), the `@Argument` and `@Option` field decorators, the
  generated `#stackra/commands` registry, and names `@stackra/console` the framework and look of 0500's CLIs
- **New dependencies**: none (`node:util` `parseArgs` and `styleText`, `node:readline`, `Intl.Segmenter`; basalt's
  `@clack/prompts` is replaced by a prompter of our own)
- **Deploy modes**: same everywhere (a library and a bin; nothing deployed)
- **Licence tier**: free (`@stackra/console`)
- **Docs to update**: ADR 0501; an amendment note on ADR 0294 (kind table, groups); `packages/developer/README.md`;
  the package README and AGENTS.md; a docs page `apps/docs/src/docs/packages/console.mdx`
- **Lane**: full
- **Change risk**: R2 (a new member and a new kind; no runtime of any service or app changes)

## Decisions taken at the spec stop (2026-10-31)

1. **Class style.** A command is a class with decorated fields, like an Action with its Schema, never
   `defineConsoleCommand`. Its name and description are written once in the kind's options,
   `extends Command({ name, description })`, the way `Action({ key })` writes its key (ADR 0294 decision 16; `kindOf`
   reads them without constructing). Arguments and options are fields with `@Argument` and `@Option`; their value
   kind comes from `@Str`, `@Int`, `@Num` or `@List` of `@stackra/validation`, and a field with none of them is a
   boolean option or a string argument (the decorator test: nothing restates a type). Collaborators are constructor
   parameters, wired by gen or by the caller (ADR 0294 decision 17); `handle(io)` reads the fields.
2. **gen is optional.** `@stackra/console` and the packages that ship commands never depend on `@stackra/gen`. A
   member that runs gen gets `#stackra/commands`; a standalone app passes `createConsole({ commands: [...] })` and has
   no `.stackra/`. The `create` scaffolder makes the standalone kind.
3. **`@stackra/console` holds no module's commands.** It is the framework only: the `Command` base, the decorators,
   the kernel, IO, prompts, themes, the testing harness and `createConsole`. Database, cache, queue, tenancy and the
   rest ship their commands from their own packages (phase 2).
4. **Prompts are our own** (`node:readline`, no new dependency). **The scaffolder** is a `create` command of the
   package's own `stackra-console` bin. **Themes:** the package ships `STACKRA_THEME` only; `runway` and `figentra`
   build theirs from their brand tokens.

## Users

- **Command author**: writes `class SeedTenantCommand extends Command({ name: "tenant:seed", description })` with
  decorated fields and `handle(io)`, and gets parsing, help, prompts, output and tests from the framework.
- **CLI owner** (stackra, runway, figentra, a customer): one `createConsole({ name, version, theme, commands })`.
- **Operator**: a person at a terminal, a CI job, or a script reading `--json`.
- **Test author**: runs a command in-process with scripted answers and reads exit code, stdout, stderr and JSON.

## Requirements

### Declaring commands

- **FR-001** THE Console Package SHALL declare a command as a class that extends `Command({ name, description,
hidden?, aliases? })`, and SHALL read a command's name, description, arguments and options without constructing it
  or its collaborators.
- **FR-002** THE Console Package SHALL bind each `@Argument` field to the next positional token in field order, and
  each `@Option({ short?, description? })` field to `--<kebab-name>` (and `-<short>`).
- **FR-003** THE Console Package SHALL take a field's value kind from its `@Str`, `@Int`, `@Num` or `@List`
  decorator; WHERE a field has none of them, THE Console Package SHALL treat an option as a boolean and an argument
  as a string.
- **FR-004** THE Console Package SHALL take a field's default from its initialiser (read from an instance built with
  no arguments, since a command's constructor only stores its collaborators), SHALL treat an `@Argument` with no
  initialiser as required unless it is `@Argument({ optional: true })` (the runtime cannot see `?` without gen), and
  SHALL treat every option as optional.
- **FR-005** IF a command's name does not match `[a-z0-9-]+` segments joined by `:`, a required argument follows an
  optional one, two fields share a long or short name, or an option reuses a global option's name, THEN THE Console
  Package SHALL refuse the command with a `ConsoleDeclarationError` that names the command and the field.

### Registering and running

- **FR-006** THE Console Kernel SHALL take its commands from a registry: the classes passed to `createConsole`, or the
  generated `#stackra/commands` of a member that runs gen.
- **FR-007** IF two commands in one registry share a name or an alias, THEN THE Console Kernel SHALL refuse to start
  with a `DuplicateCommandError` that names the name and both classes.
- **FR-008** WHEN a command runs, THE Console Kernel SHALL obtain its instance from the container when one is given
  (`container.get(X)`), else by constructing the class with no arguments.
- **FR-009** WHEN an Invocation supplies `--name value`, `--name=value`, `-s value`, `--no-<flag>`, a repeated `@List`
  option or tokens after `--`, THE Console Kernel SHALL bind them as `node:util.parseArgs` does, converting `@Int` and
  `@Num` values to numbers.
- **FR-010** IF an Invocation misses a required argument, supplies an unknown option, a non-finite number, a value
  outside an `@Int`/`@Num` bound or a surplus positional, THEN THE Console Kernel SHALL return exit code 2 with a
  usage error naming the field, without creating a container.
- **FR-011** IF an Invocation names no registered command, THEN THE Console Kernel SHALL report up to 3 names within
  edit distance 2; WHEN a name is a unique abbreviation by segment (`t:s` for `tenant:seed`), THE Console Kernel
  SHALL run that command.
- **FR-012** THE Console Kernel SHALL return exit code 0 on success, the integer 0 to 255 the handler returns, 1 when
  the handler throws, 2 on a usage error, 130 on SIGINT or a cancelled prompt and 143 on SIGTERM, and SHALL leave
  `process.exitCode` to the node binding.
- **FR-013** WHEN the Console Kernel dispatches a command, THE Console Kernel SHALL create the container (when the
  caller gives a factory) before resolving the command and SHALL close it after the handler returns, throws or is
  interrupted; IF closing fails after a success, THEN THE Console Kernel SHALL return exit code 1 with its message.
- **FR-014** WHEN an Invocation has no command name, carries `--help` or carries `--version`, THE Console Kernel SHALL
  write the command list (by namespace, then name), that command's help, or the name and version, and return exit
  code 0 without creating a container.
- **FR-015** THE Console Kernel SHALL accept the global options `-h/--help`, `-V/--version`, `-v/--verbose`,
  `-q/--quiet`, `-n/--no-interaction`, `--json` and `--ansi`/`--no-ansi` on every command.

### Presentation

- **FR-016** WHEN the Console Kernel writes the command list or a handler calls `io.output.banner()`, THE Console
  Output SHALL write the theme's ASCII logo with a horizontal gradient across the theme's stops, then a line with the
  glyph, the name and the version; WHILE `--json`, `--quiet` or a non-TTY stdout is in effect, THE Console Output SHALL
  write no banner.
- **FR-017** THE Console Package SHALL define a theme as `{ name, logo, gradient, accent, glyph, asciiGlyph }`, and
  `themeFromBrandTokens(colorJson, overrides)` SHALL build one from a brand's DTCG `tokens/color.json`; every theme
  SHALL share one layout, spacing, symbol set and copy.
- **FR-018** THE Console Output SHALL provide `info`, `success`, `warn`, `error`, `line`, `title`, `keyValue`, `list`,
  `table`, `note` (info, warning, alert boxes), `task(label, fn)`, `spinner`, `progress`, `json` and `banner`, and
  SHALL write warnings and errors to standard error.
- **FR-019** WHEN a handler throws, THE Console Output SHALL write an error screen with the error's title, message and
  hint; WHERE `--verbose` is given, THE Console Output SHALL add the stack and the `cause` chain.
- **FR-020** THE Console Package SHALL decide the colour depth once per run: none WHILE `NO_COLOR` is non-empty,
  `--no-ansi` is given, stdout is not a TTY or `TERM=dumb` (unless `--ansi` or `FORCE_COLOR`); 24-bit WHILE `COLORTERM`
  is `truecolor` or `24bit`; else 256; and SHALL quantise the gradient to that depth.
- **FR-021** WHILE the colour depth is none or stdout is not a TTY, THE Console Output SHALL write no escape sequence
  and no cursor movement, SHALL write a spinner as one start line and one end line, SHALL write progress at most every
  10 percent, and SHALL draw boxes in ASCII.
- **FR-022** WHILE `--json` is given, THE Console Kernel SHALL write exactly one JSON document to stdout,
  `{ "ok": true, "data": ... }` from `io.output.json(value)` or the handler's returned object, or
  `{ "ok": false, "error": { "code", "message" } }`, with the exit code of FR-012.
- **FR-023** WHILE stdin or stdout is not a TTY, `CI` is non-empty, or `--no-interaction` or `--json` is given, THE
  Console Package SHALL answer a prompt with its default; IF that prompt has no default, THEN THE Console Package SHALL
  fail the run with exit code 2 naming the prompt and the option that answers it.
- **FR-024** WHILE the run is interactive, THE Console Package SHALL offer `text`, `password`, `confirm`, `select`,
  `multiselect` and `search` prompts in one framed style coloured by the theme, SHALL keep a prompt open while its
  `validate` fails, SHALL echo no character of a `password` answer, and SHALL restore the terminal on every exit.
- **FR-025** WHEN the Operator presses Ctrl-C or Escape in a prompt, THE Console Kernel SHALL close the container and
  return exit code 130.
- **FR-026** THE Console Output SHALL measure text by grapheme cluster (`Intl.Segmenter`), counting wide East Asian
  and emoji graphemes as 2 and combining and isolate marks as 0, SHALL wrap each right-to-left run inside a
  left-to-right layout in FSI U+2068 and PDI U+2069, and SHALL never reorder characters.

### Testing harness

- **FR-027** WHEN a test calls `runCommandForTest(registry, argv, { answers, env, tty, container })`, THE Console
  Package SHALL run the invocation in the test's process and return `{ exitCode, stdout, stderr, json }`, answering
  prompts with `answers` in order, with plain output unless `tty` asks for colour.
- **FR-028** IF a handler asks a prompt after the scripted answers are exhausted, THEN THE Console Package SHALL fail
  the run with an error naming the prompt.

### The `create` scaffolder

- **FR-029** WHEN the Operator runs `stackra-console create <dir>`, THE Console Package SHALL ask for the app name, the
  binary name and the accent colour WHILE interactive (else take `--name`, `--bin`, `--accent`), SHALL write the app,
  and SHALL install it unless `--no-install` is given, with `--pm pnpm|npm` and `--package-spec <spec>` honoured.
- **FR-030** IF `<dir>` exists and is not empty, THEN THE Console Package SHALL refuse with exit code 1 and write
  nothing.
- **FR-031** THE generated app SHALL be standalone TypeScript with no `.stackra/`: `package.json` (bin, `build`,
  `typecheck`, `test`, `start`), `tsconfig.json`, `.npmrc` with the `@stackra` registry scope line and no token,
  `src/main.ts` calling `createConsole`, `src/theme.ts`, `src/commands/greet.command.ts` (an argument, an option, a
  prompt, a table and JSON data) and `src/commands/__tests__/greet.command.test.ts` (help, a run, a scripted prompt,
  `NO_COLOR`, `--json`).

### Documents

- **FR-032** `adoption.md` SHALL say how `stackra` (including its `COMMANDS` array in
  `packages/developer/cli/src/node/constants/commands.constant.ts`), `runway` and `figentra` move onto the framework,
  keeping ADR 0500 decision 7 (a move keeps output; restyling is a later commit). No CLI migrates in STA-1730.
- **FR-033** `flow-visual-spec.md` SHALL be a one-page visual spec that Figentra Flow follows without depending on
  `@stackra/console`.

## Phase 2: STA-1731, commands from every package (own spec folder and design stop)

Builds on phase 1; its spec goes in `.agents/specs/sta-1731-<slug>/` and to the leader before code.

1. **gen collector.** gen discovers every `extends Command` class in the `commands/` group of the member's own
   modules and of each package it depends on (`src/node/commands/`, published under the package's `./node` entry), and
   writes `.stackra/gen/commands.ts` with one explicit static import per class and an exported `commands` array,
   imported as `#stackra/commands`. Duplicate names or aliases fail gen, naming both classes (the STA-1712 pattern for
   integrations). No runtime scanning or globbing. The classes are also wiring bindings, so the container builds them
   with their collaborators.
2. **One console entry per member.** gen writes `.stackra/entry/console.ts`, `createConsole({ commands, container:
() => Container.create(wirings) })`, and the member's `console` script runs it (ADR 0295).
3. **Inventory.** A table of the commands each package should expose (database, cache, queue, scheduler, outbox,
   tenancy, registry, search, AI), and those `stackra`'s `COMMANDS` already has, for owner review.
4. **First commands**, each in its own package: database (`db:migrate`, `db:rollback`, `db:status`, `db:seed`), cache
   (`cache:clear`), queue (`queue:work`, `queue:failed`, `queue:retry`), tenancy (`tenant:list`, `tenant:create`).

## Success criteria

- **SC-001** On stackra-f4, the generated demo app installs, builds, typechecks and passes its tests, and `--help`, the
  example command, a scripted prompt through the harness, `NO_COLOR=1` and `--json` behave as FR-016 to FR-023 say.
- **SC-002** `pnpm verify` is green with the new member, and its tests cover every refusal of FR-005, FR-007, FR-010,
  FR-023, FR-028 and FR-030.
- **SC-003** Under `NO_COLOR=1`, without a TTY and with `CI=1`, captured output contains no byte `0x1b`.
- **SC-004** A table with Arabic and English cells renders every row at the same display width.
- **SC-005** The command list of 50 commands renders in under 150 ms (p95) on the CI runner.

## Out of scope

- Migrating `stackra`, `runway` or `figentra` (FR-032 is the plan only); phase 2 (STA-1731).
- Shell completion scripts, a REPL, command events and middleware.
- Anything in figentra/flow.

## Status history

- 2026-10-31 · — → Draft · Claude (builder) · spec and design sent to the leader with Q1 to Q4
- 2026-10-31 · Draft → Clarified · Claude (builder) · owner "handle all, all approved"; the leader's class-style and
  optional-gen decisions folded in; STA-1731 added as phase 2
