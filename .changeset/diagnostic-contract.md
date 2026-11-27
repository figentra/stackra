---
"@stackra/console": minor
"@stackra/mcp": minor
---

One `Diagnostic` contract for every local MCP tool result (STA-2886). `@stackra/console/contracts` exports
`Diagnostic` (`phase`, `code`, `severity`, `file`, `line`, `column`, `message`, `fix`, `docsUrl`) and
`DiagnosticReport` (`ok`, `diagnostics`). Every tool of `stackra mcp` now answers `structuredContent`
`{ ok, diagnostics, data?, error? }`: a failed test, a type error, a lint finding, a gen refusal, a `stackra check`
finding and the command's own error (a bad input, an unknown member, `deployed_target`) are each one diagnostic, with
files from the repository root, and a failed run that printed no finding gets `command_failed`. A diagnostic's `code`
is what `stackra explain` takes (a check finding is `<tool>/<rule>`), and its `docsUrl` is the link gen printed or the
one `stackra explain <code> --json` gives, looked up once per code; no link is invented for an unlisted code. The full
plain log of each tool's last run is written to `.stackra/logs/last-<tool>.log` and named in `data.log`.
`@stackra/mcp/node` no longer exports its own `Diagnostic`; the `check` and `verify` tools answer `report` and their
findings as diagnostics instead of `findings`.
