---
"@stackra/infra-aws-runtime": minor
---

Declare the runway's Postgres resources (STA-1643, ADR 0493). `awsRuntime` now calls `awsDatabases`: one subnet
group, then per database a security group admitting port 5432 only from the runtime's security groups, the RDS
instance or Aurora cluster (encrypted, private, 14-day backups; dev and preview without deletion protection or a final
snapshot), and RDS Proxy with TLS required, logging in through a Secrets Manager secret. The admin password arrives
per database as a Pulumi secret input (`databasePasswords`), and `network.vpcId` is required once a database exists.
`AwsRuntime.databases` returns each proxy endpoint and port.
