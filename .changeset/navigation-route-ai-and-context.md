---
"@stackra/navigation": minor
---

Add `ai?: false` and `context?` to `RouteOptions` (STA-1631, ADR 0490): `ai: false` keeps a route out of the agent's
client tools, and `context` names the page context a route publishes with each AI turn (the record its `:param` holds,
and whether it publishes a selection, filters, a view and a modal).
