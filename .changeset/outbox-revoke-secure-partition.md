---
"@stackra/outbox": patch
---

Migration `outbox.0007_revoke_secure_change_partition` revokes `outbox.secure_change_partition(text)` from `PUBLIC`
(defence in depth: it has invoker rights, and its owner, the migrating role, still runs it on each new partition).
