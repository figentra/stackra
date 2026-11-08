---
"@stackra/gen": patch
---

A dependency imported only through its `./contracts` entry stays fully hosted when it drives a port gen binds without
injection: the action pipeline's own (`EventOutbox` for `ctx.publish`, `IdempotencyStore`, the offline, review and
step-up stores, `ReplicaReads`), the follow-the-system defaults and the server contributions' tokens. Before, such a
package was hosted contracts-only and the port was left unbound ("EventOutbox is not bound").
