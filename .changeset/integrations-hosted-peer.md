---
"@stackra/achievements": patch
"@stackra/loyalty-kit": patch
"@stackra/payments": patch
"@stackra/pricing": patch
"@stackra/notifications": patch
"@stackra/webhooks": patch
"@stackra/documents": patch
"@stackra/repo-checks": patch
---

`@stackra/integrations` is a peer of every library that uses its values (payments, webhooks, documents, notifications,
pricing, achievements, loyalty-kit), no longer a dependency. As a dependency, pnpm resolved a second copy in a product,
so a Connection's base and `makeConnection` came from different copies and every Stripe call failed with "StripeConnection
was not loaded by a ConnectionStore". `stackra validate` refuses the mistake (`hosted-peers`, `HOSTED_PEER_PACKAGES`).
