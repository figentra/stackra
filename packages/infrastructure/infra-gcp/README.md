# @stackra/infra-gcp

The free GCP foundation of a Stackra product as Pulumi TypeScript (ADR 0354 decision 3), the GCP twin of
`@stackra/infra-aws`: for each environment that runs on GCP the data key, the files bucket, the GitHub deploy
identity and the budget. It serves jurisdictions that need in-country hosting where AWS has no region (ADR 0354); which
environment runs on GCP, and in which region, is runway data. Everything is read from the root `runway.yaml`. Agents
only preview this program or run it under Pulumi's mocks; `pulumi up` belongs to the owner or the environment's deploy
job, driven by `stackra runway infra` (ADR 0354 decision 5).

**Tier:** `tier:lib` (`packages/infrastructure/infra-gcp`). Entries `.`, `./node` and `./testing`. Depends on
`@stackra/contracts`, `@stackra/runway`, zod and `@pulumi/gcp`; `@pulumi/pulumi` is a peer.

## What is here

| Entry       | Symbol                                    | Use                                                                  |
| ----------- | ----------------------------------------- | -------------------------------------------------------------------- |
| `.`         | `gcpBaselineConfig(root, env, origins)`   | one environment's typed config, plain JSON (gen writes it to a file) |
| `./node`    | `gcpBaseline(config)`                     | the environment stack                                                |
| `./node`    | `resolveRef(value)`                       | a `ref:<path>` value read from the stack config                      |
| `./testing` | `mockPulumi(config?)`, `outputOf(output)` | Pulumi's mocks and an output reader, for tests of a composed program |

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
| deploy identity | the environment's Workload Identity pool `<env>-github` and provider admitting only `repo:<org>/<repo>:environment:<env>`, the service account `<project>-<env>-infra` it may impersonate, owner of the project                                                             |
| budget          | from the project's first environment: a monthly budget on the billing account, scoped to the project, in the runway's currency, a rule at each threshold, notifications to a Pub/Sub topic                                                                                  |

## What the root runway must hold

```yaml
providers:
  gcp:
    region: europe-west3 # any GCP region; Figentra's runway names its own
    projects:
      nonprod: { id: ref:gcp.projects.nonprod.id, number: ref:gcp.projects.nonprod.number }
      prod: { id: ref:gcp.projects.prod.id, number: ref:gcp.projects.prod.number }
    environments: # which environment runs in which project
      staging: nonprod
      production: prod
    requiredLabels: [env, service, tenant]
    billingAccount: ref:gcp.billingAccount
    budgets:
      currency: EUR # the billing account's currency
      thresholds: [50, 80, 100]
      monthly:
        nonprod: ref:gcp.budgets.nonprod
        prod: ref:gcp.budgets.prod
  github:
    org: acme
    repo: acme-platform
```

A project number is a quoted string or a `ref:`. `ref:gcp.projects.prod.id` reads the stack config key `gcp` and walks
`projects.prod.id` (ADR 0171 decision 4). The environment-to-project map sits in `providers.gcp.environments` until
the Runway schema names the cloud of each environment (ADR 0354 decision 4).

## Owner steps

- Create each project, link it to the billing account and enable the KMS, Storage, IAM, IAM Credentials, STS, Pub/Sub
  and Billing Budgets APIs.
- Create the HMAC key the `s3` disk signs with for the infra service account, and store it in the secret store.
- Subscribe the budget topic (`budgetTopic`) to the alerting channel.
- Point the deploy job's auth step at `workloadIdentityProvider` and `infraServiceAccount`.

## Not here

The network, the database server and its backups, caches and queues belong to the runtime stack, and the GCP runtime is
not decided (ADR 0354 open question 1). There is no GCP state backend: the stack state stays in the AWS state backend
of `figentra/infra` (ADR 0354 consequences). Copies to a backup project, a spend stop at a threshold (GCP budgets only
alert) and a project per product and region created by the program (ADR 0354 open question 2) are open (see the spec).
