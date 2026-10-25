# Feature Specification: `@stackra/infra-gcp`, the free GCP foundation as Pulumi programs

**Feature Branch**: `figentra/sta-348-complete`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Wave R: Runway and distribution track (STA-72)

**Clarifications status**: complete

**Input**: Package-needs row `infra-gcp` (approved, not on disk): "GCP Dammam for KSA in-country environments", for
the OS (every service in KSA) and Juristra (matters that must stay in KSA). Sources: Stackra ADR 0354, OS-3, JUR-215.
Build it beside `@stackra/infra-aws`, in the same shape: Pulumi component definitions only, never applied.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/infrastructure/infra-gcp` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none in code. The files bucket holds every scope's data at rest in the environment's region,
  on the environment's key
- **Secrets**: none. Project ids and numbers, the billing account and budget amounts are stack config values read by
  `ref:<path>`; no secret value is read; no service account key or HMAC key is created
- **ADR needed**: no (ADR 0354 decides it; 0171 and 0172 apply per project)
- **New dependencies**: `@pulumi/gcp` in the `infra` catalog (not yet listed there; the owner pins the version)
- **Deploy modes**: SaaS only
- **Licence tier**: free (MIT; ADR 0354 decision 3 and ADR 0171 decision 5)
- **Docs to update**: `packages/infrastructure/infra-gcp/README.md`, `packages/infrastructure/infra-gcp/AGENTS.md`
- **Lane**: full (a new package)
- **Change risk**: R3 (IAM bindings, Workload Identity trust, cost controls)

## Clarifications

### Session 2026-10-25

Owner mode (develop now, test later). The choices recorded when it was specified:

- Configuration, not code: no region, project, billing account, currency or amount is in code. "GCP Dammam for KSA" is
  Figentra's runway data (`providers.gcp.region`), not this package's.
- The Runway schema has no cloud field per environment yet (ADR 0354 decision 4 leaves the names to it, and the root
  environment block is strict), so the environment-to-project map is `providers.gcp.environments` inside the open
  provider block.
- A project is given by id and number: the storage service agent, the Workload Identity principal and the budget
  filter need the number, and the program calls no data source.
- Services reach GCS through its S3-compatible endpoint with the existing `s3` disk, so the files bucket is created
  when a disk is `s3`, as in infra-aws, and the CORS rule allows `x-amz-meta-*`.
- Each environment has its own Workload Identity pool (`<env>-github`), so environments sharing a project need no
  owner of a shared pool; the budget belongs to the project's first environment in promotion order.
- Pulumi state stays in the AWS state backend (ADR 0354 consequences: `figentra/infra` holds GCP stack state too).

## User Scenarios & Testing

### User Story 1 - Gen derives and the stack applies an environment's GCP foundation (Priority: P1)

Gen calls `gcpBaselineConfig(root, env, origins)` and writes the result; the generated program calls
`gcpBaseline(config)`. `stackra runway infra` applies it for the owner or the deploy job; an agent previews it only.

**Independent Test**: `src/core/functions/__tests__/gcp-baseline-config.function.test.ts`,
`src/node/functions/__tests__/gcp-baseline.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a root runway with staging and production on GCP, **When** staging's config is derived, **Then** it
   carries its project, the cost labels, a budget in the runway's currency, the files bucket with the upload origins
   and the repository.
2. **Given** that config, **When** the program runs under the mocks, **Then** it creates a provider pinned to the
   resolved project and region, a rotating key, a private CMEK bucket with the media CORS rule and expiry rules, a
   Workload Identity provider admitting only `repo:<org>/<repo>:environment:staging`, the infra service account and a
   project-scoped budget notifying a topic.
3. **Given** a root that lacks an input the environment needs, **Then** `RunwayInvalidError` names each missing path.

## Requirements

- **FR-001**: Entries `.`, `./node` and `./testing`; `.` imports no `@pulumi/*`.
- **FR-002**: `gcpBaselineConfig` derives plain-JSON config from a parsed root runway; a project number is a quoted
  string or `ref:<path>`; the region, project, billing account, currency and amounts are runway data; every missing
  input fails as `RunwayInvalidError` naming its path; an upload origin must be `https://<host>[:port]`.
- **FR-003**: `gcpBaseline` builds a GCP provider pinned to the environment's project and region with the cost labels
  as default labels, and a key ring and key rotating yearly.
- **FR-004**: The files bucket has uniform access, enforced public access prevention, the data key as default key
  (the storage service agent granted first), the media CORS rule, `uploads/` deleted after a day and replaced versions
  after the runway's days.
- **FR-005**: The infra service account may be impersonated only by the subject `repo:<org>/<repo>:environment:<env>`
  through the environment's Workload Identity provider, and owns the project; no key is created.
- **FR-006**: The project's monthly budget is scoped to the project, in the runway's currency, with a rule at each
  threshold, notifying a topic the billing service may publish to, created once per project.
- **FR-007**: `resolveRef` reads `ref:<path>` from the stack config and nothing else; no data source is called, so the
  program runs under `mockPulumi` and no agent applies it.

## Success Criteria

- **SC-001**: Every public symbol has a test in a `__tests__/` folder beside it.
- **SC-002**: `pnpm verify` is green for the member (run in the separate testing workflow).

## Out of scope

- The network, database server and backups, caches and queues: the runtime stack's; the GCP runtime is ADR 0354 open
  question 1.
- A GCP state backend (state stays in the AWS backend) and creating projects (ADR 0354 open question 2).
- Copies to a backup project (Storage Transfer Service), and stopping spend at a threshold (GCP budgets only alert;
  a stop needs a function that detaches billing): open owner items.
- Writing the config file and `stackra runway infra preview|up` (gen and cli, Track R).

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec written with the package (owner mode).
