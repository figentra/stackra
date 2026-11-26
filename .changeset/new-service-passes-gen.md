---
"@stackra/cli": patch
---

`stackra new service` writes a service that `stackra gen` accepts and Encore runs (STA-2794): no empty root module
(gen writes `#stackra/module`, and the test boots that one), `encore.dev` pinned to the workspace's reference version
(root package.json `stackra.encore`, else the default catalog, else the CLI's own), `@stackra/console` and zod with
`--data` (the console entry and schemas gen writes import them), no `"sideEffects": false`, and a `.gitignore` with the
lines `encore run` would otherwise add, so `git status` stays clean after `stackra dev`.
