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

| Entry       | Symbol                                                                                    | Use                                                                       |
| ----------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `.`         | `gcpBaselineConfig(root, env, origins)`                                                   | one environment's typed config, plain JSON (gen writes it to a file)      |
| `.`         | `gcpRuntimeConfig(root, env, dedicated?)`, `serviceAccountId`, `GcpHealthIndicatorDriver` | the runtime config (Cloud SQL); the 30-character guard; the health driver |
| `./node`    | `gcpBaseline(config)`                                                                     | the environment stack                                                     |
| `./node`    | `gcpRuntime(config, { keyId? })`                                                          | the runtime stack: Cloud SQL Postgres with backups and recovery           |
| `./node`    | `resolveRef(value)`                                                                       | a `ref:<path>` value read from the stack config                           |
| `./testing` | `mockPulumi(config?)`, `outputOf(output)`                                                 | Pulumi's mocks and an output reader, for tests of a composed program      |

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
not. Cloud SQL backups are always on and stored in the server's region; the runway sizes them.

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
- Point the deploy job's auth step at `workloadIdentityProvider` and `infraServiceAccount`.
- Enable the Compute Engine API where `egress` is set, send `egressIps` to each partner that allow-lists our calls, and
  give `egressAddresses` to the network's Cloud NAT. Release an address by hand only once no partner lists it.

## Not here

The network (the Cloud Router and Cloud NAT that send egress from the reserved addresses), caches and queues belong to
the runtime stack, and the GCP compute runtime is not decided (ADR 0354 open question 1); the database server is
`gcpRuntime`'s. There is no GCP state backend: the stack state stays in the AWS state backend of `figentra/infra` (ADR 0354 consequences). Copies to a backup project and a project per product and
region created by the program (ADR 0354 open question 2) are owner decisions (see the spec).
