---
"@stackra/cli": minor
---

The commands a newcomer runs first (`stackra new`, `gen`, `dev`, `test`, `check`, `verify`, `console`, `db seed`,
`db diff` and the rest that still parsed their own line) are now `@stackra/console` command classes, so no command is
left on the console's passthrough (STA-2883, ADR 0500 decision 7).

- `stackra <command> --help` lists every argument and option with a description and examples; an unknown option or a
  bad choice (`gen --backend tsc`) exits 2 before anything runs.
- `stackra new` in a terminal asks what the line left out: the kind, the name, a service's API area, a package's
  category, and a template kind's description and summary. Without a terminal it asks nothing and exits 2 naming the
  flag; a template kind without `--description` or `--summary` now exits 2 (it exited 1).
- `--json` works on every command. `stackra gen --json` reports each member's outcome and every refusal and warning
  with its code, file, line, column, subject, message and fix; `stackra check --json` (and `validate`, `verify`,
  `code:check`, `code:fix`) reports `{ phases, findings }`; a command with no data of its own reports its exit code
  and output lines, and its text moves to standard error.
- Text output is unchanged. `legacyCommand` and `CliCommand.group` / `hidden` are gone: a command's group and hidden
  flag live on its class.

`stackra dev --infra <name>[,<name>]` is now `stackra dev --opt-in <name>[,<name>]`: a command no longer declares both a
flag and its `--no-` form, and `--no-infra` stays. `check`, `validate`, `verify`, `code:check` and `code:fix` take
their shared flags from one option set (`@Options`), with the same names and help.
