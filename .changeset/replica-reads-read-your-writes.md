---
"@stackra/actions": minor
"@stackra/database": minor
---

Add `Query({ reads: "replica" })`: the pipeline runs the query's `handle` on a read replica through the new
`ReplicaReads` port, except inside the caller's read-your-writes window after its own committed action (recorded per
instance, or carried by the transport as `CallOptions.lastWriteAt`). `@stackra/database` ships
`DatabaseReplicaReadsDriver` over `Database.onReplica` and `DatabaseConfig.readYourWrites` (5 seconds by default)
(stackra-402, STA-1504).
