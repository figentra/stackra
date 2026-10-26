---
"@stackra/infra-cloudflare": minor
---

Add the storefront edge (ADR 0402): `parseStorefront` for a tenant's campaign settings, a waiting room and event per
campaign toggled by its `enabled` setting (`storefrontEdge`), per-shopper limits on hot items (`shopperLimitRules`)
in the zone's rate-limit entry point, the `storefront` input of `cloudflareCoreStack`, and the
`CloudflareHealthIndicatorDriver`.
