---
"@stackra/cli": minor
---

Add `stackra consumer-gate --core <dir> --checkout <dir> --product <name> --out <dir> [--mode link|pack]` (STA-1813,
ADR 0500), the product gate on every core train, moved from `tools/scripts/product-gate.mjs`: it points core at a
scratch copy of a pinned consumer product (`link:` rows, or `--mode pack` with `file:` tarballs of every publishable
package and a `leak` check that is never allow-listed), runs gen, typecheck, lint, build, test, `test:int` and the
repo-own format, spell and validate steps, and writes JSON and markdown summaries keyed by product and pin, with an
environment record and a `reproduce` command. The core tree must be built first and is never written. The matrix
(`tools/consumer-gate/matrix.yaml`, a `pins` commit per service allowed, a `kind: scaffold` entry not yet run) and the
allow-list (each entry has a `class`; `security`, `tenant-isolation`, `data-integrity` and `leak` are refused) are the
repository's data. Exit 0 green, 1 red, 2 setup error.
