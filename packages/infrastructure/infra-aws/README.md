# @stackra/infra-aws

The free AWS foundation of a Stackra product as Pulumi TypeScript (ADR 0171): for each environment the data key, the
files bucket, the Postgres backups, the GitHub OIDC deploy role, the Encore Cloud access role and the budget; and for
the product as a whole the Pulumi state backend and the backup account. Everything is read from the root
`runway.yaml`. Agents only preview these programs or run them under Pulumi's mocks; `pulumi up` belongs to the owner
or the environment's deploy job.

**Tier:** `tier:lib` (`packages/infrastructure/infra-aws`). Entries `.`, `./node` and `./testing`. Depends on
`@stackra/contracts`, `@stackra/runway`, zod and `@pulumi/aws`; `@pulumi/pulumi` is a peer.

## What is here

| Entry       | Symbol                                       | Use                                                                                               |
| ----------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `.`         | `awsBaselineConfig(root, env, origins)`      | one environment's typed config, plain JSON (gen writes it to a file)                              |
| `.`         | `awsAccounts(root)`                          | the shared, backup and environment accounts for the account-wide stacks                           |
| `.`         | `AwsHealthIndicatorDriver`, `InfraAwsConfig` | the `HealthIndicator` driver: the region's STS endpoint answers; its target is `config.infra_aws` |
| `./node`    | `awsBaseline(config)`                        | the environment stack                                                                             |
| `./node`    | `stateBackend(accounts)`                     | the Pulumi state bucket and key in the shared tooling account                                     |
| `./node`    | `backupAccount(accounts)`                    | the vault and replica bucket in the backup account                                                |
| `./node`    | `resolveRef(value)`                          | a `ref:<path>` value read from the stack config                                                   |
| `./testing` | `mockPulumi(config?)`, `outputOf(output)`    | Pulumi's mocks and an output reader, for tests of a composed program                              |

`.` never loads Pulumi, so gen can derive the config without it.

## The three stacks

```ts
// .stackra/infra/index.ts (generated), one stack per environment
import { awsBaselineConfig } from "@stackra/infra-aws";
import { awsBaseline } from "@stackra/infra-aws/node";

const config = awsBaselineConfig(root, "staging", ["https://console.staging.acme.example"]);
export const foundation = awsBaseline(config);

// the stacks repository's core stack (shared tooling account) and backup stack (backup account)
export const state = stateBackend(awsAccounts(root));
export const backups = backupAccount(awsAccounts(root));
```

Each program builds an AWS provider pinned to its one account (`allowedAccountIds`) and region, with the cost tags as
default tags (`project`, `env`, `service: infra-aws` and every `providers.aws.requiredTags` key). Credentials come from
where the program runs: the owner's SSO session, or the deploy job's OIDC role. There are no IAM users (ADR 0172).

| Stack           | Creates                                                                                                                                                                                                                                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `awsBaseline`   | the data key (rotating; the backup account may use it for copies)                                                                                                                                                                                                                                                                                    |
|                 | the files bucket when a service default puts `filesystem.disk` or `media.disk` on `s3`: private, SSE-KMS, the media CORS rule (`PUT` from the app origins with `content-type` and `x-amz-meta-*`), `uploads/` expired after a day, replaced versions expired after `shared.buckets.lifecycle.expireNoncurrentDays`, replicated to the backup account |
|                 | Postgres backups when `shared.database.backups` is set: point-in-time recovery for 14 days (`pitr: true`), a daily snapshot copied to the backup account for `retentionDays` (35 by default), ADR 0186                                                                                                                                               |
|                 | the infra role `<project>-<env>-infra`, trusted only by `repo:<org>/<repo>:environment:<env>` over GitHub OIDC                                                                                                                                                                                                                                       |
|                 | from the account's first environment: the GitHub OIDC provider, the Encore Cloud role (external id) and the monthly budget, alerting at each threshold and, outside production, denying new spend to the infra and Encore roles at `stopNonProdAt`                                                                                                   |
| `stateBackend`  | a KMS key and a versioned bucket that refuses plain HTTP and any other server-side encryption; each environment's infra role may read and write                                                                                                                                                                                                      |
| `backupAccount` | a KMS key, the vault `<project>-backup` (copies in from the environment accounts, early deletion denied to everyone) and the replica bucket `<project>-backup-<account>`                                                                                                                                                                             |

Roles that another stack trusts have fixed names (`<project>-<env>-infra`, `-replication`), and policies name them in
an `aws:PrincipalArn` condition, so the stacks can be applied in any order.

## What the root runway must hold

```yaml
providers:
  aws:
    region: me-central-1
    accounts:
      shared: ref:aws.accounts.shared # the Pulumi state
      backup: ref:aws.accounts.backup # snapshot copies and replicas (ADR 0186)
      nonprod: ref:aws.accounts.nonprod
      prod: ref:aws.accounts.prod
    budgets:
      thresholds: [50, 80, 100]
      stopNonProdAt: 100
      monthlyUsd:
        nonprod: ref:aws.budgets.nonprod
        prod: ref:aws.budgets.prod
    requiredTags: [env, service, tenant]
  encore:
    awsAccountId: ref:encore.awsAccountId # from Encore Cloud's AWS connection
    externalId: ref:encore.externalId
  github:
    org: acme
    repo: acme-platform
environments:
  production:
    encore:
      account: prod # the key above
    regions: [uae] # optional; each AWS region must be providers.aws.region, so backups stay in its jurisdiction
    shared:
      database:
        backups:
          retentionDays: 35
          pitr: true
      network:
        egress:
          staticIps: 2 # Elastic IPs partners allow-list (ADR 0402)
regions:
  uae: { cloud: aws, location: me-central-1, jurisdiction: ae }
```

`awsBaselineConfig` refuses an environment with backups or replicated files whose AWS regions are not
`providers.aws.region`: a region in another jurisdiction gets its own account and stack. The stack exports `egressIps`
(for partner allow-lists, and the webhooks member's `webhooks.egress.addresses` with the account's region as
`webhooks.egress.region`) and `egressAllocationIds` (for the network's NAT gateways); the addresses are retained when the
stack drops them. `@stackra/infra-gcp` reserves its twin, regional external addresses for a Cloud NAT.

An account id is a quoted string or a `ref:`: YAML reads an unquoted one as a number and drops its leading zeros.
`ref:aws.accounts.prod` reads the stack config key `aws` and walks `accounts.prod` (ADR 0171 decision 4).

## Owner steps

- Apply `stateBackend` first, then record its outputs as `aws.state.bucket` and `aws.state.kmsKey`.
- Switch on cross-account backup in the organisation's management account, and keep the backup account in the same
  organisation.
- Paste each account's `encoreRoleArn` output into Encore Cloud's AWS connection.
- Encrypt each environment's database with its data key: an AWS-managed key cannot be shared, so the snapshot copy
  would fail.
- Subscribe the budget topic (`budgetTopicArn`) to the alerting channel.
- Send `egressIps` to each partner that allow-lists our calls, and attach `egressAllocationIds` to the NAT gateways.

## Not here

The VPC, the database server, caches and queues are Encore Cloud's or the runtime stack's (ADR 0171 decision 5). Serving
`public/` media through a CDN, a pull-request preview role, organisation service control policies and the Bedrock
budget are open (see the spec).
