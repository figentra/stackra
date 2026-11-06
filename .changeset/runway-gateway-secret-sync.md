---
"@stackra/runway": patch
---

`runway secrets sync` now carries the root runway's `secrets.gateway` names, the generated API gateway's
secrets (ADR 0237), into Encore as one more entry, `gateway`, whenever a service member makes an Encore app.
Before, only each member's own `secrets:` reached Encore, so a product whose only runtime secret is
GATEWAY_VISITOR_SIGNING_KEY synced nothing.
