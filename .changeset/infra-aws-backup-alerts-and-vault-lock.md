---
"@stackra/infra-aws": minor
---

Alert on AWS Backup failures and lock the backup account's vault (STA-1581). Every backup vault (each environment's and
the backup account's) now notifies an SNS topic of its own account, which only that account's AWS Backup may publish
to, of failed backup, copy and restore jobs, expired backup jobs and interrupted continuous backup; the stacks export
it as `backupAlertTopicArn` and `alertTopicArn` for the alerting channel to subscribe. The backup account's vault gets
an AWS Backup Vault Lock in governance mode, its bounds read from the new `providers.aws.backupLock` (defaulting to the
environments' snapshot retention, refused when they would block a copy or pass the ADR 0188 ceiling). Compliance mode,
which is irreversible after its cooling-off days, needs both `compliance: true` and `changeableForDays` and is off by
default. `AwsAccounts` gains `backupLock`.
