---
"@stackra/infra-aws": minor
---

Add `@stackra/infra-aws`, the free AWS foundation as Pulumi programs read from the root runway (ADR 0171): per
environment `awsBaseline` (a provider pinned to the account with cost tags, a rotating data key, the files bucket with
the media CORS rule and replication to the backup account, Postgres point-in-time recovery and 35-day snapshot copies,
the GitHub OIDC infra role, the Encore Cloud role and the budget that stops non-production spend), `stateBackend` and
`backupAccount` for the account-wide stacks, the config readers `awsBaselineConfig` and `awsAccounts`, `resolveRef`,
and `./testing` with `mockPulumi` and `outputOf`.
