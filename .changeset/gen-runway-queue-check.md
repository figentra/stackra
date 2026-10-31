---
"@stackra/gen": patch
---

A service's full run refuses `queue_unprovisioned` when an environment in its `runway.yaml` has no `queues.<name>`
entry for a queue its job actions run on, `default` aside (STA-1727). A member with no runway file or no environment
is not refused.
