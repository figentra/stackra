---
"@stackra/actions": minor
"@stackra/database": minor
"@stackra/gen": minor
---

Replica reads by declaration, set by configuration, with a lag guard (STA-1464). A query may declare `maxLag` (`"2s"`), the most replica lag it tolerates. The `ReplicaReads` port gains `reads(query)`, which places a query on the primary or a replica (it defaults to the query's `reads`), and `onReplica` now receives the replica visit (key, area, declaration, `maxLag`, writer, time and the carried last write); the pipeline asks only for a query, never an action. `DatabaseConfig.replicaReads` (`maxLag` 5 seconds, `probeEvery` 1 second, `queries` and `areas` overrides) places queries by key or API area without a code change. `Database.onReplica(work, { maxLag, after })` measures the replica it is about to use and runs `work` on the primary when it lags more than `maxLag` or has not replayed the caller's last write; `DatabaseReplicaReadsDriver` always demands the query's `maxLag` (else the configured one). gen writes a query's `maxLag` into the manifest, wires `ReplicaReads` for a service that declares `@stackra/database` and has a query, and the boot passes `replicaReads.probeEvery` to `connect` as `replicaProbe`.
