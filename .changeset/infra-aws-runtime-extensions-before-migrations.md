---
"@stackra/infra-aws-runtime": minor
---

A Postgres resource whose member consumers name `environments.<env>.database.extensions` now gets a one-shot Fargate
task that creates them with the admin login in `template1` and every database, once per revision inside the apply, and
every workload migration and service using that resource waits for it. A migration that needs an extension no longer
fails on a fresh RDS or Aurora server. The task runs in its own outbound-only security group that the database admits,
reads the password from the RDS Proxy secret (never from its definition or the state), and a failure stops the apply.
`awsDatabases` takes an optional `ready` map that receives each run, and `awsWorkloads` an optional map it waits on.
