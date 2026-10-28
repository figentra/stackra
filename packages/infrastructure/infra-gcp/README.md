# @stackra/infra-gcp

The free GCP foundation of a Stackra product as Pulumi TypeScript (ADR 0354 decision 3), the GCP twin of
`@stackra/infra-aws`: for each environment that runs on GCP the data key, the files bucket, the GitHub deploy
identity, the budget and the static egress addresses partners allow-list. It serves jurisdictions that need in-country
hosting where AWS has no region (ADR 0354); which environment runs on GCP, and in which region, is runway data. Everything is read from the root `runway.yaml`. Agents
only preview this program or run it under Pulumi's mocks; `pulumi up` belongs to the owner or the environment's deploy
job, driven by `stackra runway infra` (ADR 0354 decision 5).

**Tier:** `tier:lib` (`packages/infrastructure/infra-gcp`). Entries `.`, `./node` and `./testing`. Depends on
`@stackra/contracts`, `@stackra/runway`, zod and `@pulumi/gcp`; `@pulumi/pulumi` is a peer.

## What is here

| Entry       | Symbol                                                                                                      | Use                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `.`         | `gcpBaselineConfig(root, env, origins)`                                                                     | one environment's typed config, plain JSON (gen writes it to a file)                                        |
| `.`         | `gcpRuntimeConfig(root, env, dedicated?)`, `serviceAccountId`, `GcpHealthIndicatorDriver`, `InfraGcpConfig` | the runtime config (Cloud SQL); the 30-character guard; the health driver; its target is `config.infra_gcp` |
| `./node`    | `gcpBaseline(config)`                                                                                       | the environment stack                                                                                       |
| `./node`    | `gcpRuntime(config, { keyId? })`                                                                            | the runtime stack: Cloud SQL Postgres with backups, recovery and pgaudit; the shared Valkey cache           |
| `./node`    | `resolveRef(value)`                                                                                         | a `ref:<path>` value read from the stack config                                                             |
| `./testing` | `mockPulumi(config?)`, `outputOf(output)`                                                                   | Pulumi's mocks and an output reader, for tests of a composed program                                        |

`.` never loads Pulumi, so gen can derive the config without it.

## The stack

```ts
// .stackra/infra/index.ts (generated), one stack per environment on GCP
import { gcpBaselineConfig } from "@stackra/infra-gcp";
import { gcpBaseline } from "@stackra/infra-gcp/node";

const config = gcpBaselineConfig(root, "production", ["https://console.acme.example"]);
export const foundation = gcpBaseline(config);
```

The program builds a GCP provider pinned to the environment's project and region, with the cost labels as default
labels (`project`, `env`, `service: infra-gcp` and every `providers.gcp.requiredLabels` key). Credentials come from
where the program runs: the owner's gcloud session, or the deploy job's Workload Identity token. No service account key
exists.

| Creates         | What                                                                                                                                                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data key        | a key ring `<project>-<env>` in the region and the key `data`, rotating yearly, destroyed versions kept 30 days                                                                                                                                                             |
| files bucket    | when a service default puts `filesystem.disk` or `media.disk` on `s3` (GCS through its S3-compatible endpoint): uniform access, public access prevention, the data key, the media CORS rule, `uploads/` deleted after a day, replaced versions after `expireNoncurrentDays` |
| deploy identity | the environment's Workload Identity pool `<env>-github` and provider admitting only `repo:<org>/<repo>:environment:<env>`, the service account `<project>-<env>-infra` it may impersonate, holding `DEPLOY_ROLES` (never `roles/owner`, ADR 0401)                           |
| Encore roles    | when the environment's `destinations.services` is `encore-cloud` and `providers.gcp.encore.serviceAccount` is set: that service account holds `ENCORE_ROLES` on the project instead of the `roles/owner` Encore's connect flow asks for (ADR 0435)                          |
| spend stop      | outside production, when `budgets.stopNonProdAt` is set: a Cloud Function on the budget topic that detaches the project's billing at that percentage (ADR 0401)                                                                                                             |
| egress          | when `shared.network.egress.staticIps` is set: that many regional external addresses `<prefix>-egress-<n>` in the deployment's region, labelled `purpose: egress`, retained when the stack drops them (ADR 0402 decision 2)                                                 |
| budget          | from the project's first environment: a monthly budget on the billing account, scoped to the project, in the runway's currency, a rule at each threshold, notifications to a Pub/Sub topic                                                                                  |

## What the root runway must hold

```yaml
providers:
  gcp:
    region: europe-west3 # the default; a deployment's GCP region in `regions` wins
    projects:
      nonprod: { id: ref:gcp.projects.nonprod.id, number: ref:gcp.projects.nonprod.number }
      ksa: { id: ref:gcp.projects.ksa.id, number: ref:gcp.projects.ksa.number }
      firm: { id: ref:gcp.projects.firm.id, number: ref:gcp.projects.firm.number }
    requiredLabels: [env, service, tenant]
    encore:
      serviceAccount: ref:encore.serviceAccount # the account Encore Cloud's GCP connect flow shows
    billingAccount: ref:gcp.billingAccount
    budgets:
      currency: EUR # the billing account's currency
      thresholds: [50, 80, 100]
      stopNonProdAt: 100 # detach billing outside production
      monthly:
        { nonprod: ref:gcp.budgets.nonprod, ksa: ref:gcp.budgets.ksa, firm: ref:gcp.budgets.firm }
  github: { org: acme, repo: acme-platform }
regions:
  ksa: { cloud: gcp, location: me-central2, jurisdiction: sa }
environments:
  staging:
    cloud: { name: gcp, account: nonprod }
  production:
    cloud: { name: gcp, account: ksa } # which project: ADR 0400, replacing providers.gcp.environments
    destinations: { services: encore-cloud } # grants the Encore roles (ADR 0435)
    regions: [ksa]
    shared:
      database:
        tier: db-custom-2-7680
        version: POSTGRES_17
        highAvailability: true
        backups: { retentionDays: 35, pitr: true, pitrDays: 7 }
      network:
        vpc: ref:gcp.network.prod
        egress:
          staticIps: 2 # regional addresses partners allow-list (ADR 0402), ten at most
    dedicated:
      firm: { tenant: tenant-1, cloud: { name: gcp, account: firm } }
```

A project number is a quoted string or a `ref:`. `ref:gcp.projects.ksa.id` reads the stack config key `gcp` and walks
`projects.ksa.id` (ADR 0171 decision 4). `gcpBaselineConfig(root, env, origins, "firm")` and
`gcpRuntimeConfig(root, env, "firm")` give the dedicated tenant's stacks, prefixed `<project>-firm`. Every service
account id (`<prefix>-infra`, `<prefix>-stop`) must fit GCP's 30 characters; the config readers refuse a name that would
not. Cloud SQL backups are always on and stored in the server's region; the runway sizes them. `retentionDays` past 35
is refused unless the environment states `cryptoShredded: true` (ADR 0188 decision 3: a backup must not outlive an
erasure, or erasure must destroy the data key that reads it).

pgaudit is on for every server unless `shared.database.pgaudit: false` (ADR 0212 decision 5): the Cloud SQL flags
`cloudsql.enable_pgaudit` and `pgaudit.log` (`ddl,role` by default; set `pgaudit.log` to other classes), and a sink that
routes the server's `PgAuditEntry` logs into the log bucket `<prefix>-pgaudit` in the server's region, kept
`pgaudit.retentionDays` (400 by default, about the thirteen months hot of ADR 0212 decision 6). Switching it on restarts
the server once.

```yaml
database:
  pgaudit: { log: [ddl, role], retentionDays: 400 } # or false
```

Slow statements are logged by the server too, unless `shared.database.slowQueryMs: false`: `log_min_duration_statement`
and `auto_explain` (`cloudsql.enable_auto_explain`, `auto_explain.log_min_duration`) from `slowQueryMs` (1000 by
default, 10 to 600000), so each statement above it lands in Cloud Logging with its plan. The application logs its own
slow statements from `DatabaseConfig.queries.slow` (`@stackra/database`); `pg_stat_statements` (ADR 0160 note of
2026-10-29) is a migration's `schema.createExtension`, not a flag here. AWS is not configured: Encore Cloud owns the RDS
parameter group.

A shared Valkey cache (`shared.cache.engine: valkey`, the same key the AWS runtime reads) becomes a Memorystore for
Valkey instance `<prefix>-cache` in the deployment's region, reached only through Private Service Connect on
`shared.network.vpc` (required; give the network as `projects/<project>/global/networks/<name>`). Transit encryption is
always on; clients sign in with an IAM token unless `auth: none`. One shard runs it with cluster mode off; more turn it
on. A replica spreads the nodes across zones. Name `subnet` to create the VPC's `gcp-memorystore` connection policy in
this stack; leave it out where the VPC already has one (a VPC holds one per region). `gcpRuntime` exports
`cacheInstance` and `cacheEndpoint` (the discovery `host:port`), which the stacks repository turns into the
`CACHE_VALKEY_URL` secret.

```yaml
shared:
  cache:
    engine: valkey
    node: STANDARD_SMALL # SHARED_CORE_NANO (default), STANDARD_SMALL, HIGHMEM_MEDIUM, HIGHMEM_XLARGE
    shards: 1
    replicas: 1
    eviction: allkeys-lru # any Valkey maxmemory-policy; the engine's default when absent
    auth: iam # or none
    subnet: ref:gcp.subnet.prod # creates the gcp-memorystore connection policy
```

The stack exports `egressIps` (for partner allow-lists, and the webhooks member's `webhooks.egress.addresses` with the
deployment's region as `webhooks.egress.region`) and `egressAddresses` (the self links the network's Cloud NAT takes as
`natIps` with `natIpAllocateOption: MANUAL_ONLY`).

## Owner steps

- Create each project, link it to the billing account and enable the KMS, Storage, IAM, IAM Credentials, STS, Pub/Sub,
  Billing Budgets, Cloud Billing, Cloud Functions, Cloud Run, Eventarc, Cloud Build and Cloud SQL Admin APIs.
- Grant the infra service account `roles/billing.costsManager` on the billing account (budgets live there).
- Re-link a project's billing after the spend stop detached it, once the cause is fixed.
- Create the HMAC key the `s3` disk signs with for the infra service account, and store it in the secret store.
- Subscribe the budget topic (`budgetTopic`) to the alerting channel.
- Run `create extension pg_stat_statements` where you want statement statistics (or let a migration do it).
- Run `create extension pgaudit` in each database once the flag is on, and set `pgaudit.log = 'write'` on the roles
  people sign in with (`alter role ... set pgaudit.log`), so their writes are audited and the app's are not.
- Enable the Memorystore and Network Connectivity APIs where a Valkey cache is declared, and grant each service's
  account `roles/memorystore.dbConnectionUser` when the cache signs in with IAM.
- Point the deploy job's auth step at `workloadIdentityProvider` and `infraServiceAccount`.
- Enable the Compute Engine API where `egress` is set, send `egressIps` to each partner that allow-lists our calls, and
  give `egressAddresses` to the network's Cloud NAT. Release an address by hand only once no partner lists it.

## Not here

The `@stackra/cache` `valkey` driver reads a password URL (`CACHE_VALKEY_URL`); it does not yet mint the hourly IAM
token an `auth: iam` instance needs, so a service on it uses `auth: none` until it does. Member-dedicated caches
(`requires.<name>` with `engine: valkey`) are AWS-only so far. The network (the Cloud Router and Cloud NAT that send
egress from the reserved addresses) and queues belong to
the runtime stack, and the GCP compute runtime is not decided (ADR 0354 open question 1); the database server is
`gcpRuntime`'s. Its `databaseConnection` output is what the Cloud SQL connector dials, the GCP connection path of
ADR 0473 decision 1; the connector itself runs in the service process, so nothing more is created here. There is no GCP state backend: the stack state stays in the AWS state backend of `figentra/infra` (ADR 0354 consequences). Copies to a backup project and a project per product and
region created by the program (ADR 0354 open question 2) are owner decisions (see the spec).
