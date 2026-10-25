# Feature Specification: `@stackra/infra-aws`, the free AWS foundation as Pulumi programs

**Feature Branch**: `figentra/sta-348-complete`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-590

**Linear project**: Wave R: Runway and distribution track (STA-72)

**Clarifications status**: complete

**Input**: Build `@stackra/infra-aws` (infrastructure category, Track R) from nothing: the free AWS foundation of ADR
0171 per environment, read from the root runway, as Pulumi TypeScript programs with unit tests under Pulumi's mocks.
Agents never run Pulumi or call a cloud.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/infrastructure/infra-aws` (new member; the `infrastructure` category folder already
  exists, and `tools/scripts/structure.mjs` lists the category)
- **Cross-service events**: none
- **Tenancy and data**: none in code. The files bucket and the backups hold every scope's data at rest, encrypted with
  the environment's key and kept inside the region (ADR 0186 as amended 2026-10-24)
- **Secrets**: none. Account ids, budget amounts and the Encore Cloud external id are stack config values read by
  `ref:<path>`; no secret value is read. No IAM user or access key is created (ADR 0172)
- **ADR needed**: no (ADR 0171, 0172, 0186, 0289 decide it; open owner items are listed below)
- **New dependencies**: `@pulumi/pulumi` 3.268.0 (peer and dev) and `@pulumi/aws` 7.50.0, in a new `infra` catalog
  (pending the owner's catalog review, AGENTS.md "Versions" rule 4)
- **Deploy modes**: SaaS only. On-prem and air-gapped installs run on the customer's infrastructure and use none of it
- **Licence tier**: free (MIT; ADR 0171 decision 5: the AWS foundation is free, the own-cloud runtime stack is not)
- **Docs to update**: `packages/infrastructure/infra-aws/README.md`, `packages/infrastructure/infra-aws/AGENTS.md`
- **Lane**: full (a new package)
- **Change risk**: R3 (IAM trust policies, cross-account key and bucket policies, cost controls)

## Clarifications

### Session 2026-10-25

Owner mode (develop now, test later). The choices recorded when it was specified:

- The VPC, the database server, caches and queues are not built here: ADR 0171 decision 5 puts the own-cloud runtime
  stack outside the free packages, and with the `encore-cloud` destination Encore Cloud provisions them. "Postgres with
  backups and point-in-time recovery" is therefore the AWS Backup policy over whatever database the account holds.
- The backup account (ADR 0186 decision 2) is `providers.aws.accounts.backup`; copies and replicas stay in the one
  region (ADR 0186 as amended 2026-10-24).
- The stop at `stopNonProdAt` (ADR 0172 decision 5) is an `APPLY_IAM_POLICY` budget action on the roles that add spend
  unattended (the infra and Encore Cloud roles), so it runs inside the account; a service control policy would need the
  organisation's management account, which no runway names.
- The OIDC role is the environment's infra role, trusted only by the GitHub job bound to that environment
  (`repo:<org>/<repo>:environment:<env>`), which applies the environment's program (ADR 0170 decision 6).
- Budget alerts go to an SNS topic; the subscription belongs to the observability stack, so no address is held here.
- Account-wide resources (the GitHub OIDC provider, the Encore Cloud role, the budget) belong to the first environment,
  in promotion order, that names the account; an environment that shares the account selects its database by tag.

## User Scenarios & Testing

### User Story 1 - Gen derives and the stack applies an environment's foundation (Priority: P1)

`stackra infra gen` calls `awsBaselineConfig(root, env, origins)` and writes the result; the generated program calls
`awsBaseline(config)`. The owner (or the environment's deploy job) applies it; an agent previews it only.

**Independent Test**: `src/core/functions/__tests__/aws-baseline-config.function.test.ts`,
`src/node/functions/__tests__/aws-baseline.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the template's root runway with a backup account and budget amounts, **When** staging's config is
   derived, **Then** it carries the `nonprod` account, the cost tags, a budget that stops at 100%, no database backups,
   the files bucket with the upload origins, the repository and the Encore Cloud link.
2. **Given** production's config, **When** the program runs under the mocks, **Then** it creates a provider pinned to
   the production account, a rotating data key the backup account may use, a files bucket with the media CORS rule and
   replication, a backup plan with 14 days of point-in-time recovery and 35-day snapshot copies in the backup account,
   and an infra role only `repo:<org>/<repo>:environment:production` may assume.
3. **Given** a root that lacks an input the environment needs, **Then** `RunwayInvalidError` names each missing path.

### User Story 2 - The owner sets up the state backend and the backup account (Priority: P1)

The stacks repository applies `stateBackend(awsAccounts(root))` in the shared tooling account and
`backupAccount(awsAccounts(root))` in the backup account.

**Independent Test**: `src/node/functions/__tests__/state-backend.function.test.ts`,
`src/node/functions/__tests__/backup-account.function.test.ts`, `src/core/functions/__tests__/aws-accounts.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** two environment accounts, **When** `stateBackend` runs, **Then** the state bucket is versioned, encrypted
   with its own key, refuses plain HTTP and any other server-side encryption, and lets in each environment's infra role.
2. **Given** environments that share an account, **When** `backupAccount` runs, **Then** the vault takes copies from
   that account, denies early deletion to everyone, and the replica bucket lets both replication roles write.

## Requirements

- **FR-001**: Entries `.`, `./node` and `./testing` (ADR 0127 2026-10-24 note); `.` imports no `@pulumi/*`.
- **FR-002**: `awsBaselineConfig(root, environment, origins)` and `awsAccounts(root)` derive plain-JSON config from a
  parsed root runway; an account id is a quoted 12-digit string or `ref:<path>`; every missing input fails as
  `RunwayInvalidError` naming its path; an upload origin must be `https://<host>[:port]`.
- **FR-003**: `awsBaseline` builds an AWS provider pinned to the environment's account (`allowedAccountIds`) and region
  with the cost tags as default tags (ADR 0172 decision 5), and a rotating data key.
- **FR-004**: The files bucket is private and SSE-KMS encrypted, carries the media CORS rule (`PUT` from the app origins
  with `content-type` and `x-amz-meta-*`), expires `uploads/` after a day and replaced versions after the runway's days,
  and replicates to the backup account's replica bucket in the same region, delete markers excluded.
- **FR-005**: Postgres backups: continuous backup for 14 days when `pitr` is on, and a daily snapshot copied to the
  backup account's vault for `retentionDays` (35 by default) (ADR 0186 decisions 1 to 3).
- **FR-006**: The environment's infra role is trusted only by GitHub OIDC with audience `sts.amazonaws.com` and subject
  `repo:<org>/<repo>:environment:<env>`; the account's OIDC provider is created once, by its first environment.
- **FR-007**: The Encore Cloud role is trusted by Encore's AWS account with the connection's external id, once per
  account.
- **FR-008**: The account's monthly budget alerts an SNS topic only AWS Budgets of that account may publish to, at each
  threshold; outside production it denies new spend to the infra and Encore Cloud roles at `stopNonProdAt`.
- **FR-009**: `stateBackend` creates the state key and a versioned bucket that refuses plain HTTP and any other
  server-side encryption and lets each environment's infra role read and write (ADR 0171 decision 4 and enforcement).
- **FR-010**: `backupAccount` creates the backup key, the vault (copies in from the environment accounts, early
  deletion denied) and the versioned replica bucket under fixed names.
- **FR-011**: `resolveRef` reads `ref:<path>` from the stack config and nothing else; no program calls an AWS data
  source, so every program runs under `mockPulumi` and no agent applies it.

## Success Criteria

- **SC-001**: Every public symbol has a test in a `__tests__/` folder beside it.
- **SC-002**: `pnpm verify` is green for the member (run in the separate testing workflow).

## Out of scope

- The VPC, database server, caches and queues (Encore Cloud, or `@stackra/infra-aws-runtime`, ADR 0171 decision 5).
- Writing `.stackra/infra/` and `<env>.infra.config.json`, and `stackra infra preview` (gen and cli, Track R).
- Serving `public/` media through a CDN (owner: S3 or R2 for public media, and how the CDN reads it).
- Open owner items: a pull-request preview role (a read-only role trusted by `pull_request` could read bucket data);
  organisation service control policies (no IAM users, allowed regions), which need the management account; the
  Bedrock budget ADR 0172 decision 5 keeps (its amount and accounts); the second hosting region of the ADR 0186
  amendment (the runway has one `providers.aws.region`); a residency-compliant standby (ADR 0186 open question 2).

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec written with the package (owner mode 2026-10-24:
  develop now, test later)
