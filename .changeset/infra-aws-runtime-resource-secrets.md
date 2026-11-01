---
"@stackra/infra-aws-runtime": minor
---

Resource secrets (STA-1645, ADR 0493 decision 4). `resourceVariables(resource)` names a resource's connection
details (`MAIN_DB_URL`, `_HOST`, `_PORT`, `_USER`, `_PASSWORD`), and `consumerVariables(plan)` lists the names each
member or workload gets from the resources it uses. In the deploy job, `ensureDatabasePasswords` reuses each database
password the job already has, or generates one and writes it blind to Infisical at `<env>:/runtime/<resource>` before
the program uses it; `publishResourceSecrets` writes the applied host, port, user and TLS URL there after `pulumi up`.
No value is logged or returned in a name.
