---
"@stackra/runway": minor
"@stackra/infra-cloudflare": minor
---

A root runway's `providers.cloudflare.zones.<zone>` takes the zone policy (ADR 0519, STA-1993): besides a plain id it
takes `{ id, owner, plan, policy }`, closed, where `policy` is `baseline` or `strict` (Pro only), only the `owner` sets
it, and an owner states its `plan`. `checkZoneOwners(runways)` reports a zone two root runways own. `zoneEdge` takes a
`policy` and adds SSL Full (strict), TLS 1.3, Automatic HTTPS Rewrites, HSTS, DNSSEC and CAA records for Cloudflare's
CAs; `strict` also turns bot protection on and throws on the Free plan. `cloudflareCoreStack` passes the zone's plan and
policy through. A zone without a policy keeps today's settings. The DS record at the registrar stays the owner's.
