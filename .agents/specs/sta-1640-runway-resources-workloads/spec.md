# Feature Specification: Runway resources and workloads

**Feature Branch**: `figentra/sta-1640-runway-resources-workloads`

**Created**: 2026-10-30

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1640

**Clarifications status**: complete (owner answers 2026-10-30)

**Input**: the owner's decision, relayed by the leader on 2026-10-30. One runway.yaml declares everything a product
needs, and Runway provisions it per environment in the product's AWS account. `resources:` are managed kinds that
extend `@stackra/infra-aws-runtime`: postgres (RDS or Aurora) first; kafka, opensearch, ses and others later. `workloads:` is a generic ECS Fargate container kind, only for servers with no managed option; the first
planned user is self-hosted ZITADEL. Connection strings and secrets go to Infisical and are injected into the
consumer. Sizes and cost limits per environment come from the root runway (dev small). The ADR rule is managed first,
a workload only when nothing managed fits or residency forces it. The owner approves before any code; no
`pulumi up` or AWS change without the owner.

## What exists (and is kept)

| Piece                                                                                                                          | Where                                                      |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Member `requires.<x>.engine` (postgres, valkey, s3, sns-sqs), root `environments.<env>.shared.{database,cache,queues,buckets}` | `@stackra/runway`, ADR 0296                                |
| SQS, SNS, Valkey, S3 planned and declared from those                                                                           | `@stackra/infra-aws-runtime` (`runtimePlan`, `awsRuntime`) |
| The Postgres server, created by Encore Cloud through `encoreAccess`                                                            | `@stackra/infra-aws`, ADR 0238, 0170                       |
| An ECS Fargate stack with service discovery, EFS and SSM secrets, from a fixed catalogue                                       | `@stackra/infra-tools`, ADR 0444                           |
| `VaultWriter` port and the Infisical driver (blind writes)                                                                     | `@stackra/runway`, ADR 0482 decision 7                     |
| AWS Budgets per account, cost tags                                                                                             | `@stackra/infra-aws`, ADR 0172                             |

## Impact _(mandatory)_

- **Apps touched**: `apps/docs` (ADR 0493, runbook)
- **Services touched**: none
- **Packages touched**: `@stackra/runway` (root schema `resources`, `workloads`, `environments.<env>.limits`; member
  `uses`; the canonical schema), `@stackra/infra-aws-runtime` (kinds, catalogue, cost cap, workload construct, Pulumi),
  `@stackra/infra-tools` (moves onto the shared workload construct), `@stackra/cli` only if `stackra infra plan` needs
  the estimate printed
- **Cross-service events**: none
- **Tenancy and data**: none. Infrastructure only; tenant data stays in its region (ADR 0172 decision 3)
- **Secrets** (names only): per resource under `<env>:/runtime/<resource>/` (`<RESOURCE>_URL`, `<RESOURCE>_PASSWORD`,
  `<RESOURCE>_HOST`, …); workload secrets by the names the workload declares. Generated in CI and written blind
- **ADR needed**: yes, ADR 0493 (draft beside this spec)
- **New dependencies**: none expected (`@pulumi/aws` is already the infra packages' catalog entry); confirm in L3
- **Deploy modes**: SaaS (the product's AWS account). On-prem and GCP are out of scope (the GCP program of 0444 stays
  open)
- **Lane**: full
- **Change risk**: R3 (infrastructure, secrets, IAM, cost)
- **Licence tier**: free
- **Docs to update**: `runbooks/runway`, infra-aws-runtime and infra-tools READMEs and AGENTS.md, ADR 0227 rows

## The runway shape (proposal)

```yaml
resources:
  main-db:
    kind: postgres
    engine: rds # rds (default) | aurora
    version: "17"
    size:
      production: large
      staging: medium # dev and preview fall back to small
workloads:
  zitadel:
    image: ghcr.io/zitadel/zitadel@sha256:…
    port: 8080
    health: /debug/healthz
    expose: public
    uses: [main-db]
    env:
      ZITADEL_EXTERNALSECURE: "true"
    secrets: [ZITADEL_MASTERKEY]
    size:
      production: medium
    scale:
      production: { min: 2, max: 4 }
    reason: "Residency: KSA in-country tenants cannot use ZITADEL Cloud"
environments:
  dev:
    limits:
      monthly: 150 # USD, the plan's estimate cap
```

A service member's runway names the resources it uses: `uses: [main-db]`. Member `requires` and root
`shared` keep working as implicit resources.

## User Scenarios & Testing _(mandatory)_

### User Story 1: Declare a managed resource (P1)

A product adds `resources.main-db` (postgres) and a service `uses` it. In each environment, Runway's plan holds the
RDS instance (or Aurora cluster), its RDS Proxy, a security group open to the consumers only, and backups per ADR 0186. The consumer gets `MAIN_DB_URL` and `MAIN_DB_PASSWORD` by name.

1. **Given** no size for dev, **Then** dev plans `small`.
2. **Given** a `uses` that names no resource, **Then** the runway is refused, naming the path.
3. **Given** the Pulumi mocks, **Then** the declared RDS, proxy and secret parameters match the plan.

### User Story 2: Declare a workload (P1)

A product adds `workloads.zitadel`. The plan holds a Fargate task and service, service discovery, an ALB for
`public`, the health check, autoscaling, and SSM parameters for its secrets and the resources it uses.

1. **Given** no `reason`, **Then** the runway is refused.
2. **Given** an image without a digest, **Then** the runway is refused (a tag can change under us).
3. **Given** `expose: internal`, **Then** no load balancer is planned.

### User Story 3: Cost cap (P1)

1. **Given** dev's `limits.monthly: 150` and a plan whose catalogue estimate is 180, **Then** the plan is refused
   before anything is created, listing each item's estimate.
2. **Given** no limit, **Then** the plan prints the estimate and goes on.

### User Story 4: The tools stack on the shared construct (P2)

0444's tools run through the same workload construct, with an unchanged plan.

## Requirements _(mandatory)_

- **FR-001**: The root runway shall accept `resources.<name>` with `kind` in `postgres | queue | topic | cache | bucket`, kind options, a `size` per environment and an optional `reason`; `kafka`, `opensearch` and `ses` are
  reserved kinds, refused until built.
- **FR-002**: The root runway shall accept `workloads.<name>` with `image` (pinned by digest), `port`, `health`,
  `expose`, `uses`, `env`, `secrets` (names), `size` and `scale` per environment, and a required `reason`.
- **FR-003**: A member runway and a workload shall name the resources they use (`uses`); an unknown name is refused.
- **FR-004**: Member `requires` and root `shared` shall map to implicit resources, so every existing product plans
  exactly as before.
- **FR-005**: Each kind shall have a size catalogue (`small`, `medium`, `large`) mapping to AWS classes and a monthly
  estimate; an environment a resource does not size runs `small`.
- **FR-006**: `environments.<env>.limits.monthly` (default $150 dev, $500 staging) shall cap the plan's estimate; with
  no cap the plan only warns. A plan over a cap is refused before
  any declaration.
- **FR-007**: Postgres shall plan RDS (default) or Aurora, RDS Proxy (ADR 0473), encryption, backups (ADR 0186) and
  a security group open only to its consumers.
- **FR-008**: Kafka is reserved (owner, 2026-10-30): no consumer needs it, and ADR 0227 keeps it deferred until the
  event bus (0142) meets its measured limit.
- **FR-009**: A workload shall plan on one Fargate cluster per environment, with service discovery, an ALB when
  public, the health check, autoscaling and SSM secret references.
- **FR-010**: Generated credentials shall be created in the CI job and written blind to Infisical under
  `<env>:/runtime/<resource>/`; each consumer's variable names shall be derived (`<RESOURCE>_URL`, …).
- **FR-011**: Nothing shall create or change an AWS resource outside the product's protected deploy job; tests use
  Pulumi mocks only.
- **FR-012**: Every resource and workload shall carry the cost tags (ADR 0172).

## Success Criteria _(mandatory)_

- **SC-001**: Plan and Pulumi-mock tests cover every kind, size, the cost refusal, the `uses` refusal and the secret
  names.
- **SC-002**: academorix's current runway plans the same queues, caches and buckets as before (FR-004).
- **SC-003**: `pnpm verify` green on the tester's box.

## Owner questions

- **Q1: Kafka.** Answered 2026-10-30: not now. It stays a reserved kind, and ADR 0227's deferral stands.
- **Q2: Postgres and Encore.** Answered: `resources.postgres` serves workloads and non-Encore consumers now; Encore
  services keep Encore's own until STA-136 settles.
- **Q3: ZITADEL.** Answered: amend ADR 0206 decision 4 so in-country (residency) regions self-host ZITADEL as a
  workload; ZITADEL Cloud stays the default elsewhere.
- **Q4: Cost cap.** Answered: default caps of $150 a month in dev and $500 in staging, overridable in the runway; a plan
  over its cap is refused. An environment with no cap (production, until the owner sets a number) only warns.
- **Q5: Public workloads.** Answered: an ALB with an ACM certificate, behind Cloudflare-proxied DNS.
- **Q6: Runtime secrets for workloads.** Answered: SSM parameters filled by the Infisical sync.
- **Q7: Postgres in dev.** Answered: the smallest Graviton class (`db.t4g.micro`), single-AZ.

## Lanes (after approval)

| Lane | Content                                                                                                                                      | Depends    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| L1   | Runway schema: `resources`, `workloads`, `limits`, member `uses`, refines; canonical schema; implicit resources from `requires` and `shared` | —          |
| L2   | Size catalogue and monthly estimate per kind; the cost cap check in the plan                                                                 | L1         |
| L3   | Postgres kind: plan and Pulumi (RDS or Aurora, RDS Proxy, security group, backups), mock tests                                               | L1, L2     |
| L4   | (cancelled: Kafka not needed now, Q1) Kafka kind: plan and Pulumi (MSK Serverless or provisioned, IAM auth), mock tests                      | L1, L2     |
| L5   | Secrets: generated credentials written blind to Infisical, consumer variable names, Encore sync list and SSM parameters                      | L3         |
| L6   | Workload construct: Fargate cluster, task, service, discovery, ALB, autoscaling, health, extracted from infra-tools into infra-aws-runtime   | L1, L2, L5 |
| L7   | (held, see status) infra-tools onto the workload construct, with an unchanged plan                                                           | L6         |
| L8   | Docs: runbook, READMEs, AGENTS.md, ADR 0227 rows, schema docs                                                                                | L1–L6      |
| L9   | (held, see status) First user, after Q3: the ZITADEL workload in the product runway it serves                                                | L4, L6     |

## Linear

Epic STA-1640; lanes L1 to L9 are STA-1641 to STA-1649.

## Status history

- 2026-10-30 Draft, waiting for the owner on Q1 to Q7.
- 2026-10-30 Q1 answered: no Kafka now; L4 cancelled.
- 2026-10-30 Clarified: owner approved Q2 to Q7 as recommended (via the leader), with caps dev $150 and staging $500,
  production warn-only. ADR 0493 Accepted.
- 2026-10-30 Implementing: L1, L2, L3, L5, L6 and L8 built and handed to stackra-f4. L7 held: moving the tools stack
  renames its Pulumi resources (replaced on the next apply) for no gain now; it needs the owner's yes. L9 held: the
  ZITADEL workload needs its runway (the OS repository or the in-country environment) and a pinned image digest; the
  runbook shows the declaration.
