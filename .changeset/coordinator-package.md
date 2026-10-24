---
"@stackra/coordinator": minor
---

Add `@stackra/coordinator`, tab coordination on one device: `electLeader(name, options)` joins a named leader election
and returns its `LeaderElection` (`isLeader` as a read-only `@stackra/state` signal, `whenLeader()`, `resign()`,
`method`); the method is Web Locks, else a BroadcastChannel heartbeat (takeover after three missed beats or at once on
a resignation; `heartbeat` option), else an in-memory queue (`ElectionMethod`); and `withTabLock(name, task)` runs one
task at a time across tabs and releases when it settles.
