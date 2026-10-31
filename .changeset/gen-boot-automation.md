---
"@stackra/gen": patch
---

A service's generated `boot` connects `AutomationService` to the container when the service runs `@stackra/workflow`
(STA-1699, ADR 0495), so publishing an automation checks its principal's scope through `ScopeOwnership`.
