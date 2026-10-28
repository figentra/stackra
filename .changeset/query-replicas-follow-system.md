---
"@stackra/query": minor
---

Replicas follow the phone's power and data saving (STA-1536): while `SystemSettings` reports Low Power Mode or an
expensive connection, `ReplicaStore`'s background refreshes wait and run once it stops; an explicit `refresh` still runs.
