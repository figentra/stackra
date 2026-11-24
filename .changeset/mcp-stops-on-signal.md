---
"@stackra/cli": patch
"@stackra/mcp": patch
---

`stackra mcp` ends on SIGTERM and SIGINT. A client stops a stdio MCP server with a signal, but the server kept reading standard input after the console kernel had already answered the signal, so the process stayed running (it left a process behind on every client shutdown) until stdin closed. `CliContext` now carries the run's abort `signal`, `serveLocalMcp` takes it and closes its input on abort (resolving and closing the Encore proxy as a disconnect does), and `stackra mcp` exits 143 on SIGTERM and 130 on SIGINT within milliseconds.
