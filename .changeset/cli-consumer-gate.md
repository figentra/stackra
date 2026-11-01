---
"@stackra/cli": minor
---

Add `stackra consumer-gate --core <dir> --checkout <dir> --product <name> --out <dir>` (STA-1813, ADR 0500), the product
gate on every core train, moved from `tools/scripts/product-gate.mjs`: it links core into a scratch copy of a pinned
consumer product, runs gen, typecheck, test, `test:int` and validate, and writes JSON and markdown summaries. The matrix
(`tools/consumer-gate/matrix.yaml`, a `pins` commit per service allowed) and the allow-list are the repository's data.
Exit 0 green, 1 red, 2 setup error.
