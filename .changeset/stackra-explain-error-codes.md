---
"@stackra/gen": minor
"@stackra/cli": minor
"@stackra/console": minor
---

`stackra explain <code>` explains any code gen, `stackra check` or Runway prints: its cause, its fix, a link to its section of the error-code reference and the command that shows the finding again (`--json` for the data). A `stackra check` finding pasted as printed, `<tool>/<rule>` (`repo-checks/imports`), explains its rule. A mistyped code exits 2 with the closest codes. The local developer MCP serves the same command as its read-only `explain` tool (STA-2891).

Every gen finding now prints a third line, `  docs: <link> (stackra explain <code>)`, linking the code's section of the reference. `@stackra/gen` exports the catalogue behind it: `ERROR_CODES` (copied from the reference page by apps/docs `pnpm error-codes:write`, and checked against it), `ERROR_CODES_PAGE`, `errorCodeEntry`, `errorCodeDocs` and the type `ErrorCodeEntry`.

`@stackra/console`'s `ConsoleConfig` takes an optional `docs`: the link an error screen (and `--json` error) shows when neither the error nor its command names one. `stackra` sets it to the troubleshooting page, so every `stackra` command error carries a docs link.
