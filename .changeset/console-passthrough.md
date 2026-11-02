---
"@stackra/console": minor
---

`Command({ passthrough: true })` is for migration only (ADR 0500 decision 7, STA-1966).

- **Raw tokens:** a ported command that still parses its own flags gets every token after its name in `io.rest`,
  `-n` and `--json` included.
- **Still the kernel's:** routing, `--help`, `help <cmd>` and the error screen.
- **No fields:** a passthrough command declares no fields.
- **Tracking:** `passthroughCommands(commands)` in `@stackra/console/testing` lists the commands still in this
  state, so a CLI's test pins the list until it is empty.

`io.stdout` and `io.stderr`, also migration only, are the run's raw streams, for a ported command whose output must
stay byte for byte as it was.
