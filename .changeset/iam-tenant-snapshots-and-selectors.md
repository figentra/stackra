---
"@stackra/iam": minor
---

Policy snapshots are tenant-scoped: `PolicySnapshotStore.read` and `write` take the tenant, and
`StorePolicySourceDriver` reads under the actor's tenant. Add the durable `PostgresPolicySnapshotStoreDriver` in
`./node` with its `iam.policy_snapshots` migration (forced tenant equality policy), and `PolicySnapshotIntakeService`,
the body of the listener that decodes and stores the IAM service's snapshot event (STA-815). Roles may hold permission
selectors: `@read` and `@risk:<level>`, optionally behind a prefix, never picking a system or restricted permission for
a grant (STA-818, ADR 0407).
