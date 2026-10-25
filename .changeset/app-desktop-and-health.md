---
"@stackra/app": minor
---

Rename the `./electron` entry to `./desktop` (ADR 0345 decision 9; `createApp`, `BRIDGE_CHANNEL` and `DesktopApp` keep
their names), and add the health probe to `./server`: `ServerAppOptions.health` takes `HealthIndicator`s, and
`ServerApp.probe(method, path)` answers `GET /healthz` (200 until a drain) and `GET /readyz` (every indicator, each
with a timeout; 200 when none is down, 503 otherwise; a status per name, no detail).
