---
"@stackra/console": minor
---

Four opt-in additions for CLIs moving onto the console engine (ADR 0506 amendment of 2026-11-03, STA-2093):
`createConsole({ json: "bare" })` makes `--json` write the command's data alone as one line, with stdout empty on an
error and human output and the problem screen on stderr (only for JSON an ADR froze, as testbed's); `io.process.run(...,
{ inherit: true })` lets a child share the standard streams without a terminal (stderr only under `--json`, refused
while the run holds a secret value); `requireCommand: true` makes an invocation that names no command exit 2; and a
value option may come before the command name (`testbed --box 2 ssh`). The output listener now receives redacted
chunks, and an explicit `secret: false` overrides the secret-like name guess.
