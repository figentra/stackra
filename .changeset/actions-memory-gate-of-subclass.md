---
"@stackra/actions": patch
---

`MemoryApprovalGateDriver.of` builds the class it is called on, so a test's subclass keeps its overrides.
