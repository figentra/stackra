---
"@stackra/sandbox": minor
---

Add the `./node` entry: `SandboxPool` runs code steps in a fixed pool of child processes with fetches relayed to the
host's proxy and a watchdog, and `compileTypeScriptStep` compiles a TypeScript step with Node's type stripping
(STA-720, ADR 0434).
