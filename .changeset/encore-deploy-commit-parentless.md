---
"@stackra/runway": patch
---

The Encore deploy commit has no parent: it holds the source tree with the generated app, and its message names the
source commit. Encore's remote refused the earlier deploy commit ("shallow update not allowed") because a CI checkout
at depth 1 ends on a shallow boundary, and the product's history is not Encore's to hold.
