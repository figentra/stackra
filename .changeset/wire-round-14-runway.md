---
"@stackra/runway": minor
---

The `encore-cloud` provider's verify reads `GET <origin>/readyz` after the branch check when the environment's (or
region's) `encore` block names an `origin` (STA-1385): 200 is up, anything else or a failed request is down, never a
throw. Without an origin it checks the branch only, as before. The HTTP client is the driver's `fetch` field.
