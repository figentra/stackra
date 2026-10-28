---
"@stackra/database": minor
"@stackra/model": minor
---

Add native time partitioning: the `Partitioned({ by, interval, premake, retain })` trait, the blueprint's
`t.partitionBy(column)` (range partitioning, a default partition, the column in the primary key, a BRIN index),
`maintainPartitions`, and the daily `MaintainPartitionsAction` job that creates partitions ahead and drops expired
ones unless a legal hold covers a row.
