# Implementation Plan: `@stackra/console`

**Spec**: [spec.md](./spec.md) · **Linear**: STA-1730 · **Status**: Planned (approved 2026-10-31)

## Summary

Port basalt's `@stackra/console` (58 files, spec 030) into `packages/developer/console`, rewrite its declaration from
the retired provider API (`defineValue`, `defineFactory`, string tokens) to a v3 `Command` kind, add a presentation
layer of our own (themes, gradient banner, components, prompts, colour depth, plain and JSON modes, bidi-safe width),
ship a `stackra-console create` scaffolder, and verify a generated app on stackra-f4.

## What the port keeps and what it changes

| basalt (spec 030)                                                    | core                                                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `defineConsoleCommand({ name, inject, handle: (deps) => fn })`       | `class X extends Command({ name })` with `@Argument`/`@Option` fields, deps by constructor  |
| `console.command:<name>` value providers, walked from a module graph | a registry: `createConsole({ commands })` or gen's `#stackra/commands` (STA-1731)           |
| `ApplicationLike` start, resolve, close                              | `boot: () => Promise<Container>`, `container.get(X)`, `container.close()`                   |
| `@clack/prompts` prompter                                            | `ReadlinePrompter` of our own (no dependency)                                               |
| `styler.ts` (named `styleText` colours), `render-table.ts`           | `core/presentation/`: depth, gradient, width, box, table, components                        |
| parse, suggestions, help, list, run bracket, exit codes, signals     | kept, with tests written for them (basalt had only 5 meta tests, which `validate` replaces) |
| `./testing` run harness, scripted prompter, memory streams           | kept, plus `json` in the result and a `tty` switch                                          |

## Member shape

`packages/developer/console`, `@stackra/console`, `tier:lib`, `category:developer`, runtimes `node`; files of
`pnpm new package console --category developer`. Entries (ADR 0294 decision 15): `.` (core), `./contracts`, `./node`,
`./testing`; bin `stackra-console`. Dependencies: `@stackra/container`, `@stackra/contracts` and `@stackra/validation` (`workspace:*`; never `@stackra/gen`); dev
from existing catalogs. Every file carries the four-field contract and TSDoc on every export.

```
src/contracts/  types/ (CommandOptions, ArgumentDeclaration, OptionDeclaration, InputOf, ConsoleTheme, PromptSpec,
                ConsolePorts, ExitCode) · ports/ (Prompter, Terminal)
src/core/       bases/command.base.ts (createKind "command") · decorators/ (argument, option) · functions/read-command
                (kind options + field decorators + initialiser defaults → CommandStructure) · errors/ (UsageError, ConsoleDeclarationError,
                DuplicateCommandError, PromptCancelledError, NonInteractivePromptError) · functions/ (parse-invocation,
                suggest-names, render-help, render-list, run-console, run-bracket, decide-mode, color-depth,
                gradient, display-width, isolate-bidi, render-box, render-table) · services/ (ConsoleOutput,
                Spinner, Progress) · constants/ (STACKRA_THEME, GLOBAL_OPTIONS, SYMBOLS)
                · functions/theme-from-brand-tokens
src/node/       create-console, readline-prompter (raw-mode keys), node-terminal, process-signals,
                stackra-console.ts (the bin) · commands/create.command.ts · functions/write-app,
                functions/install-app · templates/ (the generated app's files as typed string functions)
src/testing/    run-command-for-test, scripted-prompter, memory-terminal, manual-signals
```

## Key designs

**Command kind.** `Command(options)` is `createKind("command", CommandBase)` with `{ name, description, hidden?,
aliases? }`. `@Argument(options?)` and `@Option(options?)` are `createDecorator` field decorators that may mark the
`command` kind only; the value kind is read from `Str.members`, `Int.members`, `Num.members` and `List.members` of
`@stackra/validation`. `readCommand(X)` builds the serialisable structure once (cached per class): kind options, fields
in declaration order, defaults from an instance built with no arguments. The kernel assigns parsed values to the
instance's fields, then calls `handle(io)`. `io` is `{ output, prompt, signal, verbose, json, interactive }`; `handle`
returns `number | void | object` (an object is the `--json` data).

```typescript
// src/commands/greet.command.ts
export class GreetCommand extends Command({ name: "greet", description: "Greet someone" }) {
  /** Who to greet; asked for when missing. */
  @Argument({ optional: true })
  who?: string;

  /** Upper-case the greeting. */
  @Option({ short: "s" })
  shout = false;

  /** How many times to greet. */
  @Option({ short: "t" })
  @Int({ min: 1, max: 10 })
  times = 1;

  /** Greets, and returns the name for `--json`. */
  async handle(io: CommandIo) {
    const who =
      this.who ?? (await io.prompt.text({ message: "Who?", default: "world", option: "who" }));
    for (let i = 0; i < this.times; i++)
      io.output.success(this.shout ? `HELLO ${who.toUpperCase()}` : `Hello ${who}`);
    return { who };
  }
}
```

**Registry and entry.** `createConsole({ name, version, theme, commands, container? })` returns
`{ run(argv, ports?) }`; the node binding wires process streams, TTY, env and signals. `container` is a factory
(`() => Container.create(wirings)`), called only to dispatch; without it a command is built with `new X()`. Phase 2
(STA-1731) adds gen's emitter `emit-commands` (beside `emit-webhooks`, a `command` row in `kind-files.constant.ts`):
`.stackra/gen/commands.ts` with one static import per discovered class, duplicates refused, and
`.stackra/entry/console.ts` calling `createConsole` with it. Nothing in this package imports gen.

**Mode, decided once** (`decideMode(ports, globals)` → `{ depth: 0|16|256|24, interactive, json, quiet, unicode }`):
`json` forces depth 0 and non-interactive; `CI` or no TTY makes it non-interactive; `NO_COLOR`/`--no-ansi`/no TTY/
`TERM=dumb` give depth 0 unless `--ansi`/`FORCE_COLOR`; `unicode` is false on `TERM=linux` or a non-UTF-8 `LANG`, which
switches symbols and box lines to ASCII. Every component reads only this object, so plain output is one code path.

**Colour without a dependency.** `styleText` covers the 16 named colours and modifiers; 256 and 24-bit are two escape
helpers (`\x1b[38;5;Nm`, `\x1b[38;2;R;G;Bm`). The gradient interpolates in OKLab between the stops (≈20 lines),
quantises per depth, and colours each column of the logo the same across lines (the Laravel installer look).

**Themes.** `ConsoleTheme = { name, logo: string[], gradient: string[], accent: string, glyph: string,
asciiGlyph: string }`. `STACKRA_THEME` uses the steel ramp of `brands/stackra/tokens/color.json`. `themeFromBrandTokens`
reads `palette.*.$value` from a DTCG colour file, so `runway` and `figentra` build theirs from the brand package the
product already pulls (`figentra brand pull`); `@stackra/console` never depends on a `@figentra/brand-*` package.

**Layout, the same for all.** Two-space gutter; the symbol column (`●` info, `✓` success, `▲` warn, `✕` error, ASCII
`*`,`+`,`!`,`x`); task lines fill with dim dots to the terminal width minus the status (`DONE`, `FAIL`, `SKIP`); boxes
rounded (`╭╮╰╯`) with a coloured title; the error screen is a red-labelled block with message, hint and, under `-v`, the
stack and `cause` chain. Width is `min(columns, 100)`.

**Width and bidi.** `displayWidth` segments graphemes with `Intl.Segmenter`, counts wide East Asian and emoji as 2 and
combining and isolate marks as 0, and strips escape sequences first. `isolateBidi(text)` (opt-in; the components
do not call it, since many terminals draw FSI/PDI as boxes) wraps strong-RTL runs. Padding and truncation use `displayWidth`, never `.length`.

**Prompts.** `ReadlinePrompter` uses `readline.emitKeypressEvents` and raw mode, renders a frame (accent bar, message,
hint line, error line) and redraws in place; it restores the terminal on every exit path (finally, signal, cancel).
Under non-interactive mode the `DefaultsPrompter` answers with defaults or throws `NonInteractivePromptError` naming the
option. `password` writes no character of the answer; the answer never reaches the output service or an error.

**JSON.** `--json` swaps the output service for a collector: text components are dropped, `json(value)` and a returned
object become `data`, an error becomes `{ code, message }` (code is the error class's snake case, as refusals are);
the kernel prints the one document at the end.

**Scaffolder.** `CreateCommand` is the first real user of the framework. Templates are typed functions returning file
text (no template engine). `--tarballs <dir>` lets the verification install `@stackra/console` (and its three deps) from
packed tarballs. Install runs `pnpm install` (or `npm install`) with inherited stdio inside a `task()`.

## Verification (SC-001), on stackra-f4

1. In this worktree: `pnpm --filter @stackra/console... build`, then `pnpm pack` the console, container and contracts
   packages into a scratch folder outside the repos.
2. f4: `node packages/developer/console/dist/stackra-console.mjs create /tmp/sta-1730-demo --no-interaction
--tarballs <dir> --pm pnpm`, then in the demo: `pnpm build`, `pnpm typecheck`, `pnpm test`,
   `node dist/main.js --help`, `node dist/main.js greet Ada`, `NO_COLOR=1 ... greet Ada | grep -c $'\x1b'` = 0,
   `... greet Ada --json | node -e 'JSON.parse(...)'`, and `CI=1 ... greet` (no prompt, default used).
3. Report the transcript to the leader. The Mac runs only oxfmt and oxlint.

## Tasks

1. ADR 0506 (docs-adr-steward) and the 0294 amendment note.
2. Scaffold the member; the kind, decorators, `readCommand`, refusals (FR-001 to FR-005).
3. Registry, parse, suggestions, help and list, exit codes, lifecycle, signals (FR-006 to FR-015).
4. Presentation: mode, depth, gradient, width and bidi, components, themes, error screen, JSON (FR-016 to FR-022,
   FR-026).
5. Prompts and the testing harness (FR-023 to FR-025, FR-027, FR-028).
6. `create` and the templates (FR-029 to FR-031).
7. `adoption.md` and `flow-visual-spec.md` (FR-032, FR-033).
8. f4 verification, the PR (stackra-f4 gates and lands), then STA-1731's spec.

## Constitution check

Boundaries: a `tier:lib` package importing only foundation packages; no app, service or `encore.dev`. Versions: no new
catalog entry. Not-built-yet: none touched; no reflect-metadata (types come from decorators, ADR 0227). Naming: `Command` is the word 0294 reserves for a CLI command. Secrets: no
value is read or printed; the scaffolder writes no token.
