# @stackra/infra-aws-runtime

## 0.17.1

### Patch Changes

- @stackra/runway@0.17.1
  - @stackra/infra-tools@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [4c6bf13]
  - @stackra/runway@0.17.0
  - @stackra/infra-tools@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/validation@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [89d4633]
- Updated dependencies [08be546]
- Updated dependencies [5bf8ad3]
  - @stackra/runway@0.16.0
  - @stackra/validation@0.16.0
  - @stackra/infra-tools@0.16.0
  - @stackra/config@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/runway@0.15.0
  - @stackra/infra-tools@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- Updated dependencies [fda1d53]
  - @stackra/runway@0.14.4
  - @stackra/infra-tools@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- Updated dependencies [3ccf74a]
- Updated dependencies [64e4840]
  - @stackra/runway@0.14.3
  - @stackra/infra-tools@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/validation@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/runway@0.14.2
  - @stackra/config@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/infra-tools@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- Updated dependencies [857a7fb]
  - @stackra/runway@0.14.1
  - @stackra/infra-tools@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/validation@0.14.1

## 0.14.0

### Patch Changes

- Updated dependencies [54e05c6]
  - @stackra/runway@0.14.0
  - @stackra/infra-tools@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/validation@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [dc4b3f0]
- Updated dependencies [5d10209]
- Updated dependencies [6e61084]
  - @stackra/runway@0.13.0
  - @stackra/infra-tools@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/validation@0.13.0

## 0.12.0

### Patch Changes

- Updated dependencies [e36505c]
  - @stackra/runway@0.12.0
  - @stackra/infra-tools@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/validation@0.12.0

## 0.11.1

### Patch Changes

- @stackra/runway@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/infra-tools@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [46951df]
  - @stackra/runway@0.11.0
  - @stackra/infra-tools@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/validation@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [a15cacf]
- Updated dependencies [4c0eead]
- Updated dependencies [4749967]
- Updated dependencies [f511762]
- Updated dependencies [e57b9a1]
- Updated dependencies [ea40871]
- Updated dependencies [0d65e3f]
- Updated dependencies [242ebe4]
- Updated dependencies [242ebe4]
- Updated dependencies [0d65e3f]
- Updated dependencies [c4348cd]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
- Updated dependencies [0d65e3f]
  - @stackra/runway@0.10.0
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/infra-tools@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Minor Changes

- bd3f314: A runway workload takes `command`, the container's arguments in place of the image's default, and `aliases`, which
  hand the image a variable of a Postgres resource it uses under the name it reads
  (`ZITADEL_DATABASE_POSTGRES_DSN: MAIN_DB_URL`). `runtimePlan` refuses an alias of a variable no used Postgres resource
  publishes, and `awsWorkloads` puts the arguments and each alias's SSM parameter in the task definition. Self-hosted
  ZITADEL, the first workload user, now plans in dev, staging and production (STA-1649).

### Patch Changes

- Updated dependencies [2aeaec8]
- Updated dependencies [5030040]
- Updated dependencies [e80a99b]
- Updated dependencies [93bb1e7]
- Updated dependencies [b0d6fcc]
- Updated dependencies [2e43c48]
- Updated dependencies [2e43c48]
- Updated dependencies [ca1614e]
- Updated dependencies [f9c825d]
- Updated dependencies [bd3f314]
  - @stackra/runway@0.9.0
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/container@0.9.0
  - @stackra/infra-tools@0.9.0
  - @stackra/config@0.9.0

## 0.8.0

### Minor Changes

- 7776fbb: `runtimePlan` counts the tools stack's GPU tools in the monthly cost estimate: one `tools.<tool>` item each (hourly
  price x 730 hours x max replicas), so a dev plan with a GPU tool enabled is checked against its $150 cap.

### Patch Changes

- Updated dependencies [7dd35b3]
- Updated dependencies [02c47c3]
- Updated dependencies [67e7e8f]
  - @stackra/container@0.8.0
  - @stackra/runway@0.8.0
  - @stackra/config@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/infra-tools@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/runway@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Patch Changes

- @stackra/runway@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/runway@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/validation@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [67dac91]
- Updated dependencies [0183006]
- Updated dependencies [a736fb5]
- Updated dependencies [b74c373]
- Updated dependencies [2ed03e2]
  - @stackra/runway@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- @stackra/runway@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [f7321ea]
  - @stackra/runway@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Patch Changes

- eaf4c2b: Postgres 18 is the production major (STA-1691, ADR 0238 amendment of 2026-10-31): a `resources.postgres` without a
  `version` plans 18, the GCP examples and messages name `POSTGRES_18`, and the tools stack's database task runs the pinned
  `postgres:18.6-alpine` client.
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [1a09488]
- Updated dependencies [d065062]
- Updated dependencies [d63eb09]
- Updated dependencies [2e94f1e]
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/runway@0.4.0
  - @stackra/config@0.4.0

## 0.3.0

### Minor Changes

- 67a3f52: Declare the runway's Postgres resources (STA-1643, ADR 0493). `awsRuntime` now calls `awsDatabases`: one subnet
  group, then per database a security group admitting port 5432 only from the runtime's security groups, the RDS
  instance or Aurora cluster (encrypted, private, 14-day backups; dev and preview without deletion protection or a final
  snapshot), and RDS Proxy with TLS required, logging in through a Secrets Manager secret. The admin password arrives
  per database as a Pulumi secret input (`databasePasswords`), and `network.vpcId` is required once a database exists.
  `AwsRuntime.databases` returns each proxy endpoint and port.
- 1c75be6: Plan the runway's `resources` and `workloads` (STA-1642, ADR 0493). `runtimePlan` now adds each Postgres resource
  (`databases`: RDS or Aurora, the size's instance class, Multi-AZ and storage, 14 backup days, the members and workloads
  that use it), queue, topic, cache and bucket resources beside the member-derived ones, and each container workload
  (`workloads`: Fargate task size and count, exposure, env, secret names, uses), sized per environment from new catalogues
  (`small` where unsized; dev Postgres is `db.t4g.micro`, single-AZ). The plan carries a monthly `cost` estimate and is
  refused when it passes the environment's cap: `limits.monthly`, else $150 in dev and $500 in staging; production only
  warns until it has a cap. A member that uses an undeclared resource is refused. `planForMembers` leaves the shared
  resources and workloads to the environment's whole stack.
- d2cd103: Resource secrets (STA-1645, ADR 0493 decision 4). `resourceVariables(resource)` names a resource's connection
  details (`MAIN_DB_URL`, `_HOST`, `_PORT`, `_USER`, `_PASSWORD`), and `consumerVariables(plan)` lists the names each
  member or workload gets from the resources it uses. In the deploy job, `ensureDatabasePasswords` reuses each database
  password the job already has, or generates one and writes it blind to Infisical at `<env>:/runtime/<resource>` before
  the program uses it; `publishResourceSecrets` writes the applied host, port, user and TLS URL there after `pulumi up`.
  No value is logged or returned in a name.
- af9ecb1: Declare the runway's container workloads (STA-1646, ADR 0493). `awsRuntime` now calls `awsWorkloads`: one ECS
  cluster, private DNS namespace and log group per environment, a task execution role reading only the environment's SSM
  parameters, and per workload a Fargate task definition (its own secrets and the variables of the resources it uses as
  SSM references, never values), a service registered in the namespace, and CPU autoscaling between its bounds. A public
  workload gets an ALB in the public subnets admitting HTTPS from Cloudflare's ranges only, a TLS 1.3 listener on the given
  certificate and a target group checking its health path. One shared workload security group is created first, and the
  databases admit it. New options `workloads.publicSubnetIds`, `workloads.certificateArn` and `workloads.logRetentionDays`;
  `AwsRuntime.workloads` returns each service, internal host and public host.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [ae08e09]
- Updated dependencies [4ed7315]
- Updated dependencies [d53babc]
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/runway@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [9085c41]
- Updated dependencies [3e4c408]
- Updated dependencies [a4b8844]
- Updated dependencies [d37c08f]
  - @stackra/contracts@0.2.0
  - @stackra/runway@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 58d9f32: Add `@stackra/infra-aws-runtime`, the Pulumi program part for the AWS runtime resources members declare in runway
  (ADR 0296, 0171): `runtimePlan` derives one environment's SQS queues (dead-letter queues, an SNS topic each on the
  `sns-sqs` provider), the shared and dedicated Valkey caches and the S3 buckets from the root and service runways, and
  `./node` adds `readRuntimePlan` (reads `runway.yaml` and `services/*/runway.yaml`) and `awsRuntime`, which declares
  them encrypted, private and tagged by environment, member and topology group.
- 26abe13: Add `awsRuntimeStack`, the runtime stack one service deploys through (`planForMembers`, the cache network from
  `shared.network` through `runtimeNetwork`), and the `AwsRuntimeHealthIndicatorDriver` (ADR 0402).

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [62c7ae1]
- Updated dependencies [37e1aa8]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [a1eb70f]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [3ccd0ab]
- Updated dependencies [769adee]
- Updated dependencies [4135a5a]
- Updated dependencies [c927e35]
- Updated dependencies [29c2d3e]
- Updated dependencies [2787c1e]
- Updated dependencies [8d304d6]
- Updated dependencies [e344058]
- Updated dependencies [a183131]
- Updated dependencies [fbf8fa4]
- Updated dependencies [4ea8dd0]
- Updated dependencies [3a5d71d]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/runway@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
