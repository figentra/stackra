---
"@stackra/gen": patch
---

A service now registers its hosted packages' permission sets and module roles at boot, not only its own. Manifest permission entries carry `module`, `member` and `file`, and a new `roles` section lists each module role with its key, so the host can import and register them. Regenerate committed manifests.
