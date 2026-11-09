---
"@stackra/app": minor
"@stackra/gen": patch
---

`EdgeHeaderGuard` is bound in every generated service and checks edge traffic only. A request that carries any edge
header must verify (fail closed); a request with none is not edge traffic and goes on to authentication or its
endpoint's own signature check, so service calls, cross-app deliveries and webhooks keep working. `publicPaths` is
removed from the guard. New `EdgeConfig` (`app.edge`) chooses the drivers: `keys` is `memory` or `env`, which reads the
`STACKRA_EDGE_SIGNING_KEYS` secret (newest first, comma-separated); `nonces` is `memory`, so a replay is refused per
instance until a shared nonce store ships.
