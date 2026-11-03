---
"@stackra/runway": minor
"@stackra/infra-cloudflare": minor
"@stackra/cli": minor
---

The runway host map now generates the edge Worker's routes (`surfaceHosts`, `edgeRoutes`): one `<host>/*` per surface host under a runway zone, beside the stack's own patterns. A bare `*/*` route is refused unless the zone lists `exclusions`, which become script-less routes. The CLI's runway ship probes every host of the map after a product publish and fails when one does not serve TLS.
