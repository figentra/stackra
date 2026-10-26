---
"@stackra/actions": minor
---

Add the `memory` AccessControl driver to `@stackra/actions/testing`: it allows every permission unless a test denies one
with `denyPermission(name)`, so a testing module on memory drivers binds AccessControl.
