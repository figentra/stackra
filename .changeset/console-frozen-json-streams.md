---
"@stackra/console": minor
---

Engine additions for CLIs moving onto the console engine (ADR 0506 amendment of 2026-11-03, STA-2093). Three are
opt-in: `createConsole({ json: "bare" })` makes `--json` write the command's data alone as one line, with stdout empty
on an error and human output, the problem screen and the `-v` echo on stderr (only for JSON an ADR froze, as
testbed's); `io.process.run(..., { inherit: true })` lets a child share the standard streams without a terminal
(stderr only under `--json`); and `requireCommand: true` makes an invocation that names no command exit 2.

Changes for every console: a registry value option may come before the command name (`testbed --box 2 ssh`), so the
token after such a flag is now its value, not the name (`cli --out deploy ./dist` used to run `deploy` with
`--out=./dist`); `io.process` refuses an `inherit` or `interactive` child while the run holds a secret value, list and
number values included; the output listener receives redacted chunks; and an explicit `secret: false` overrides the
secret-like name guess.
