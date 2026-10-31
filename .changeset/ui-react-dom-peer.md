---
"@stackra/ui": patch
"@stackra/tsdown-config": patch
---

<!-- Purpose: release note for the ui require-shim fix: react-dom stays external and no dist may carry rolldown's __require shim. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0025; STA-1722. -->

`@stackra/ui` declares `react-dom` as an optional peer, so it is no longer bundled: 0.2.0 inlined CommonJS react-dom,
whose `require("react")` became rolldown's `__require` shim and threw for every ESM consumer. `library()` in
`@stackra/tsdown-config` now fails a build whose output calls `__require(...)`, naming the chunk and the module.
