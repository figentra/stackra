---
"@stackra/outbox": patch
---

The relay and the inbox run each consumer delivery and each receipt through the bound `CallIsolation` as the actor
stored with the message, change or envelope, in its scope; one stored with none runs as a platform call (STA-1699, ADR
0495). A run of changes now splits where the actor changes. With none bound they run in `Database.withScope` as before.
