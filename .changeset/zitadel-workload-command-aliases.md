---
"@stackra/runway": minor
"@stackra/infra-aws-runtime": minor
---

A runway workload takes `command`, the container's arguments in place of the image's default, and `aliases`, which
hand the image a variable of a Postgres resource it uses under the name it reads
(`ZITADEL_DATABASE_POSTGRES_DSN: MAIN_DB_URL`). `runtimePlan` refuses an alias of a variable no used Postgres resource
publishes, and `awsWorkloads` puts the arguments and each alias's SSM parameter in the task definition. Self-hosted
ZITADEL, the first workload user, now plans in dev, staging and production (STA-1649).
