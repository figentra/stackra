---
"@stackra/gen": patch
"@stackra/container": patch
---

gen binds Menu, Shortcut, Store, Bridge (request-scoped) and ExtensionPoint classes; a config override keeps its base's key. The container's binding kinds gain `shortcut` and `extension_point`.
