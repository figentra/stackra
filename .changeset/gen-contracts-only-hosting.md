---
"@stackra/gen": minor
---

A dependency a member imports only through its `./contracts` entry is hosted contracts-only: gen carries its
`src/contracts/` integration events (so the outbox and topic emitters know their wire names) and hosts none of its
models, migrations, actions, drivers, roles or permissions. A dependency imported any other way is hosted whole, as
before (STA-2567).
