---
"@stackra/platform": minor
---

Add `killSwitchServiceWorker()` to `@stackra/platform/sw`: the source of a self-retiring `sw.js` (ADR 0325 rule 18).
Published at the installed worker's URL, it activates at once, deletes every cache, unregisters itself and reloads the
open tabs (runbook: deploys, "Retire a service worker").
