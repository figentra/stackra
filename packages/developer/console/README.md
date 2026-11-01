# @stackra/console

The Stackra command framework, with the look of a Symfony Console and the Laravel installer. A command is a class with
decorated fields, `createConsole` runs a list of them, and `runCommandForTest` tests one in-process. Every product's CLI
shares one layout; only its theme (name, ASCII logo, gradient, accent, optional dark-ground colours, glyph) changes. The ground comes from `STACKRA_GROUND=dark|light`, then `COLORFGBG`, and is dark otherwise.

**Tier:** `tier:lib` (`packages/developer/console`). Decision: ADR 0506. Spec: `.agents/specs/sta-1730-console`.

## A command

```typescript
import { Argument, Command, Option } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import { Int } from "@stackra/validation";

export class SeedAccountCommand extends Command({
  name: "account:seed",
  description: "Seed an account",
}) {
  @Argument({ description: "The account's slug" })
  account!: string;

  @Option({ short: "c", description: "Rows per table" })
  @Int({ min: 1 })
  count = 10;

  @Option({ description: "Print, do not write" })
  dryRun = false;

  constructor(accounts: AccountService) {
    super();
    this.accounts = accounts;
  }

  async handle(io: CommandIo) {
    const rows = await io.output.task("Seeding", () =>
      this.accounts.seed(this.account, this.count),
    );
    io.output.success(`Seeded ${rows} rows`);
    return { rows }; // the --json data
  }
}
```

The value kind of a field comes from `@Str`, `@Int`, `@Num` or `@List`; an `@Option` with none is a flag
(`--dry-run`, `--no-dry-run`), an `@Argument` with none a string. Initialisers are the defaults. An argument without an
initialiser is required unless it is `@Argument({ optional: true })`.

## A console

```typescript
import { createConsole } from "@stackra/console";
import { nodePorts } from "@stackra/console/node";

process.exitCode = await createConsole({
  name: "acme",
  version: "1.0.0",
  commands: [SeedAccountCommand],
}).run(process.argv.slice(2), nodePorts());
```

Pass `container: () => Container.create(wirings)` to build commands with their collaborators; it is called only to run
a command, never for the list, help or version. A member that runs gen gets its registry from `#stackra/commands`
(STA-1731); a standalone app lists its classes.

Global options on every command: `-h/--help`, `-V/--version`, `-v/--verbose`, `-q/--quiet`, `-n/--no-interaction`,
`--json`, `--ansi`/`--no-ansi`. Exit codes: 0, the handler's own 0 to 255, 1 (error), 2 (usage), 130 (SIGINT or a
cancelled prompt), 143 (SIGTERM).

## Output, prompts, modes

- `io.output`: `line`, `info`, `success`, `warn`, `error`, `title`, `keyValue`, `list`, `table`, `note`, `task`,
  `spinner`, `progress`, `json`, `banner`.
- `io.prompt`: `text`, `password`, `confirm`, `select`, `multiselect`, `search`.
- Plain text (no escape byte, no cursor movement) under `NO_COLOR`, `--no-ansi`, `TERM=dumb` or without a TTY. No
  prompts without a TTY, in CI, with `-n` or with `--json`: a prompt takes its default, or the run exits 2 naming the
  option that answers it. `--json` writes exactly one document, `{ ok, data }` or `{ ok: false, error: { code, message } }`.
- Right-to-left text is measured by grapheme so it lines up; no isolate marks are written. On a terminal without bidi or Arabic shaping (`TERM_PROGRAM` claude-desktop, vscode, iTerm.app, Hyper, Tabby), right-to-left runs are written shaped and in visual order; `STACKRA_BIDI=visual|logical` overrides the choice, and pipes and `--json` always get logical text.

## Themes

`STACKRA_THEME` is the default. Another product builds its own from its brand kit's colour tokens:
`themeFromBrandTokens(colorJson, { name, logo, glyph, asciiGlyph, gradient: ["sky-500", "sky-200"], accent: "sky-500" })`.

## Testing

```typescript
import { runCommandForTest } from "@stackra/console/testing";

const result = await runCommandForTest([SeedAccountCommand], ["account:seed", "acme", "--json"], {
  answers: ["yes"],
});
expect(result.json).toEqual({ ok: true, data: { rows: 10 } });
```

## A new console app

```sh
pnpm dlx @stackra/console create my-cli
```

`stackra-console create <dir>` asks for the name, the binary and the accent (or takes `--name`, `--bin`, `--accent`),
writes a standalone TypeScript app with a `greet` command, its theme and its tests, and installs it (`--no-install`,
`--pm pnpm|npm`; `--tarballs <dir>` installs `@stackra/*` from packed tarballs for verification).

## Entry points

| Import                       | Holds                                                                      |
| ---------------------------- | -------------------------------------------------------------------------- |
| `@stackra/console`           | the Command kind, `@Argument`, `@Option`, `createConsole`, themes, errors  |
| `@stackra/console/contracts` | leaf types: options, theme, prompt request and answer, `Prompter`, streams |
| `@stackra/console/node`      | `nodePorts()`, `terminalPrompter()`                                        |
| `@stackra/console/testing`   | `runCommandForTest`, `scriptedPrompter`, `memoryText`, `manualSignals`     |
| bin `stackra-console`        | `create`                                                                   |

No module's commands live here: every package exposes its own in its `commands/` group (ADR 0506).
