---
"@stackra/runway": minor
"@stackra/cli": minor
"@stackra/mcp": minor
"@stackra/vite-plugin": minor
---

`stackra dev` now keeps a dev log, and the local developer MCP reads it (STA-2889). A member's `stackra dev` copies
every line its dev tool prints into `.stackra/logs/dev.ndjson` at the repository root, still printing everything (in
colour on a terminal), with one line when the tool starts and one when it ends. Expo (`expo start`) and Wrangler
(`wrangler dev`) keep the terminal's stdout, so their QR code, key menu and hotkeys still work, and only their stderr
reaches the dev log; `stackra dev --no-log` runs any dev tool with the terminal alone and writes no dev log. Each line becomes an entry with its
level (read from a JSON line, a level word such as `ERR` or `WARN`, or a JavaScript error line; a stack frame takes the
level of the line above it). The Stackra Vite preset adds `stackra:browser-logs` to the dev server only: the pages it
serves report uncaught errors, unhandled promise rejections and `console.error` / `console.warn` to
`/__stackra/browser-log`, which takes only same-origin JSON posts carrying the client's header, within size limits; a
console call's arguments are sent structured and masked by field name before they become text.
Every entry is redacted with the logger's `redact` before it is written, text past 8000 characters is cut, and the file
rotates at 5 MiB (one older file kept). `@stackra/runway` exports `DEV_LOG_PATH` and `DevLogEntry` (`.`) and
`devLogFile`, `appendDevLog` and `readDevLog` (`./node`). `@stackra/mcp` adds three read-only tools: `logs` (filter by
source, level, member, time and text), `last_error` (the latest error with its whole stack and the lines around it)
and `browser_logs` (what the pages reported, with the page and stack).
