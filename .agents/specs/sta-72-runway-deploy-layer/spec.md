# Feature Specification: Runway deploy layer (wave R): runway checks, the reusable provider workflows and the deploy command

**Feature Branch**: `figentra/sta-72-runway-deploy-layer`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-72

**Linear project**: Runway CI/CD

**Clarifications status**: complete

**Input**: Build the Runway deploy layer that does not depend on `stackra gen` output: `pnpm validate` checks every
runway file against its v3 schema plus `checkPlacement`; a root `runway.yaml` in core; the public reusable
`workflow_call` workflows tagged `runway-v<n>` (the `cloudflare-workers` provider first, then npm publish and docs);
the secrets and vars sync design; release hardening (cosign, Trivy, OSV-Scanner, zizmor); the one deploy and
promote command shape. The Encore deploy spike (STA-136), generated CI pipelines and everything that needs gen to
emit the Encore app wait for gen and are recorded as blocked. Source: the SDLC and Runway audit of 2026-10-25
(private notes) and the owner brief of the same day.

## Impact

- **Apps touched**: `apps/docs` (its member `runway.yaml`; the new Runway runbook and the deploys runbook)
- **Services touched**: none
- **Packages touched**: none. The check reads the built `@stackra/runway` entry; `packages/developer/runway`,
  `packages/developer/cli` and `packages/developer/gen` are frozen until the STA-348 completion branch lands
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: names only. `CLOUDFLARE_API_TOKEN`, `MINTLIFY_ADMIN_KEY` and the one-time `NPM_BOOTSTRAP_TOKEN` live in
  Infisical `/ci` (environment `prod`) and reach exactly one step each over GitHub OIDC; no value is in git, a
  workflow input, an artifact or a log
- **ADR needed**: no. Implements ADR 0168, 0170, 0173, 0177, 0284, 0289, 0296 and 0299 as they stand
- **New dependencies**: none in any `package.json`. CI tools are pinned once each: actionlint, zizmor and OSV-Scanner
  in `mise.toml`; Trivy and cosign in the reusable workflows (`mise exec <tool>@<version>`)
- **Deploy modes**: CI and release only; nothing changes at runtime in SaaS, on-prem or air-gapped
- **Licence tier**: free (MIT); the reusable workflows are public, as ADR 0168 decision 1 requires
- **Docs to update**: `apps/docs/src/docs/runbooks/runway.mdx` (new), `apps/docs/src/docs/runbooks/deploys.mdx`,
  `apps/docs/src/docs.json`, `.github/workflows/README.md`
- **Lane**: full
- **Change risk**: R3 (CI permissions, OIDC trust and the release workflow)

## Clarifications

### Session 2026-10-25

- Owner brief, 2026-10-25: build in this order, only what does not depend on gen output; agents never run
  `pulumi up`, `encore deploy` or anything that touches a cloud account; checks are format, lint and
  `tools/scripts/validate-repository.mjs` only (owner mode, testing deferred to STA-597).
- Owner question, 2026-10-25: use `figentra/platform` (the private Runway platform) or build from Stackra's rules?
  Decision: **reference only.** Stackra's Runway is written fresh against its ADRs (ADR 0291 action R: rewrite with
  the old code as reference). The platform is a per-deployable manifest (v2.2), a policy engine, 162 providers,
  Terraform, signed S3 records and `@figentra/*` packages under a proprietary licence. Stackra decided runway v3
  member and root files (ADR 0296), Pulumi (ADR 0171), public MIT reusable workflows in `figentra/stackra` (ADR 0168
  decision 1), sync of Infisical values on deploy (ADR 0173) and records in GitHub Deployments, a Linear release and
  Slack (ADR 0170 decision 10). Taken from it as reference: one masked credential per step and a skip when no
  identity is set; values piped on stdin only, never in argv or `GITHUB_ENV`; one Infisical CI identity per
  environment (its review found that a shared identity let staging read production); a failing deploy step fails
  the job; cosign verification pins the caller repository. Porting any file verbatim needs `figentra/platform` on the
  owner's assigned-sources list (ADR 0291 decision 1) and an `ORIGIN.md` line; nothing here is ported verbatim.
- The core root `runway.yaml` is wanted (the audit listed it as unclear; the owner brief asks for it). Core deploys
  only its own infrastructure (ADR 0170 decision 1): the static Worker, the docs and the npm packages, so its root
  declares `dev` and `production` only and no topology groups.
- `workers/static` gets no member runway yet: ADR 0284 decision 8 gives it one in the change that deletes its
  hand-written `wrangler.jsonc`, which needs gen. The docs member gets its runway now (ADR 0299 decision 6).
- The check runs in `validate-repository.mjs` and imports the built `@stackra/runway` entry, because the package
  sources use extensionless `#core/*` imports that Node cannot load, and the package is frozen. In CI the Quality
  Gate builds before it validates; locally, an unbuilt package prints a notice instead of a finding.
- npm trusted publishing checks the calling workflow, so the trusted publisher of every package keeps naming
  `release.yml` when the publish moves into the reusable workflow. Snapshot `next` releases stay in STA-209, which
  waits for the first publish.
- Tools come from mise, not from setup actions (ADR 0027 decision 2), so no new third-party action is pinned. Trivy is
  pinned past the March 2026 compromise of its release tags (CVE-2026-33634).

- Owner, 2026-10-25 (later the same day): **one deployment tool** (ADR 0352). `@stackra/runway` plus `stackra runway
<command>` in the CLI is the single source of deployment; Pulumi runs inside it through the Automation API over the
  infra-* components; gen is the build step and holds no deploy logic; CI keeps one generic thin caller per action.
  The wave 1 workflows (FR-005 to FR-007) stay until the CLI ships, then shrink to callers (FR-016). The code of
  FR-013 to FR-018 waits for the STA-348 completion branch, because runway, cli, gen and infra are frozen until it
  lands.

## User Scenarios & Testing

### User Story 1 - A runway file is checked before anything deploys (Priority: P1)

Every `runway.yaml` in the repository is read for its kind and checked against the version 3 schema, and the root
topology against the service members, in `pnpm validate`.

**Independent Test**: `tools/scripts/__tests__/validate-repository.test.mjs` (runway file cases).

**Acceptance Scenarios**:

1. **Given** a member runway holding a root key, **When** `pnpm validate` runs, **Then** it fails naming the file,
   the path and the reason.
2. **Given** a grouped environment that leaves a service member unplaced, **Then** it fails naming the environment,
   the member and the code `member_unplaced`.
3. **Given** a `runway.yaml` outside a member root, **Then** it fails saying no runway kind applies there.

### User Story 2 - One reusable workflow deploys a Worker from a pushed commit (Priority: P1)

A repository calls `runway-cloudflare-workers.yml` with its member, environment and Infisical identity; the workflow
tests, builds and deploys that member at a commit on main and reports readiness.

**Independent Test**: `actionlint` and `zizmor` in the Quality Gate; `deploy-static.yml` is the first caller.

**Acceptance Scenarios**:

1. **Given** no Infisical identity, **When** the workflow runs, **Then** it builds, tests, prints a notice and
   deploys nothing.
2. **Given** an explicit SHA that is not on main, **Then** the job fails before any credential is read.
3. **Given** a deployed Worker that answers 5xx for a minute after deploy, **Then** the smoke step reports "not
   serving yet" per attempt and fails only after its budget.

### User Story 3 - Releases are scanned, signed and published from one workflow (Priority: P1)

`release.yml` calls `runway-npm.yml`: the version PR or the publish with provenance, an opt-in bootstrap token for
the first publish, a Trivy scan that blocks a fixable critical, and a signed SBOM attached to every release it
published.

**Independent Test**: `actionlint` and `zizmor` in the Quality Gate.

### User Story 4 - The docs deploy from CI after their checks (Priority: P2)

A merge to main that touches `apps/docs` runs `mint validate`, `broken-links` and `a11y`, triggers a Mintlify update,
waits for it, checks the deployed commit and smoke-tests the pages.

**Independent Test**: `actionlint` and `zizmor` in the Quality Gate.

### User Story 5 - One command plans, deploys and promotes (Priority: P2)

`pnpm runway plan production` prints the build order, the targets with their caller workflows and the secret names a
deploy syncs; `pnpm runway deploy <target>` and `pnpm runway promote <sha>` refuse a dirty or unpushed tree and
dispatch the same CI workflow a merge runs.

**Independent Test**: `tools/scripts/__tests__/runway.test.mjs`.

### Edge Cases

- **EC-001**: A runway file that is not valid YAML (or repeats a key) is one finding naming the file, not a crash.
- **EC-002**: `promote <sha>` with a SHA that is not on `origin/main` is refused before anything is dispatched.
- **EC-003**: Mintlify deploys its configured branch head, which may be newer than the triggering SHA; the deploy job
  warns with both SHAs instead of failing.

## Requirements

- **FR-001**: `pnpm validate` reads every `runway.yaml`: the repository root as `root`; `apps/<name>/` and
  `workers/<name>/` (and the scaffold app templates) as `app`; `services/<name>/` (and the scaffold service templates)
  as `service`. Each is parsed as YAML (duplicate keys refused) and checked with `parseRunway`; every issue is a
  finding naming the file, the dotted path and the message. A `runway.yaml` anywhere else is a finding.
- **FR-002**: The root runway's topology is checked with `checkPlacement` against the service members
  (`services/<name>`); each issue is a finding naming the environment, the code and the message.
- **FR-003**: The check loads the built `@stackra/runway` entry. When it is not built, the check is a finding in CI
  (`CI` set) and a notice on stderr locally.
- **FR-004**: Core has a root `runway.yaml` (version 3, block style) declaring its providers, the `dev` and
  `production` environments, the `cloudflare-workers`, `mintlify` and `npm` targets each with the caller workflow that
  deploys it, the CI secret names and the release policy; and `apps/docs/runway.yaml` (ADR 0299 decision 6). No value
  is a secret.
- **FR-005**: `.github/workflows/runway-cloudflare-workers.yml` is a public `workflow_call` workflow: it checks out
  the given SHA (default the triggering commit), refuses one that is not on main when the ref is a tag or the SHA is
  explicit, prints the SHA, tests and builds the member, reads `CLOUDFLARE_API_TOKEN` from Infisical over OIDC for
  the deploy step only, runs `wrangler deploy` in the member folder, then smoke-tests a URL and reports readiness per
  attempt. With no identity it builds, tests, prints a notice and deploys nothing. `deploy-static.yml` is its caller.
- **FR-006**: `.github/workflows/runway-npm.yml` is a public `workflow_call` workflow: the changesets version PR or
  the publish to npmjs with provenance through trusted publishing, an opt-in OP2 bootstrap token read from Infisical
  `/ci` for a first publish (ADR 0289 decision 11), a Trivy filesystem scan that blocks the publish on a fixable
  critical vulnerability, and a CycloneDX SBOM signed keylessly with cosign and attached to each GitHub release the run
  created. `release.yml` is its caller.
- **FR-007**: `.github/workflows/runway-mintlify.yml` is a public `workflow_call` workflow: `mint validate`,
  `mint broken-links` and `mint a11y`, then a Mintlify update triggered with `MINTLIFY_ADMIN_KEY` from Infisical `/ci`,
  polled to `success` or `failure`, a warning when the deployed commit is not the triggering SHA, and a smoke test of
  the given pages. With no identity or project id it checks, prints a notice and deploys nothing.
  `deploy-docs.yml` is its caller; the Quality Gate runs `mint a11y` (ADR 0299 decision 2).
- **FR-008**: The Quality Gate lints every workflow with actionlint and zizmor (`.github/zizmor.yml`: every `uses:` is
  pinned to a full commit SHA) and scans `pnpm-lock.yaml` with OSV-Scanner. The three tools are pinned in `mise.toml`.
- **FR-009**: `.github/rulesets/release-tags.json` protects `runway-v*`, `schemas@*` and the changesets package tags
  from update and deletion, for the owner to apply (it replaces the live `v*` pattern, which matches no tag the
  repository makes).
- **FR-010**: `tools/scripts/runway.mjs` (`pnpm runway`) is the one deploy command shape. `plan <env>` prints, from
  the root runway, the build order, each target with its caller workflow, and the secret names to sync with their
  Infisical paths (names only). `deploy <target>` and `promote <sha>` refuse a dirty tree, an unpushed commit or a
  commit not on `origin/main`, print the SHA, and dispatch the target's caller workflow on `main` (with the SHA for a
  promote), so every deploy runs in CI from a pushed commit. The guard asks the owner before an agent runs either.
- **FR-011**: The secrets and vars sync is designed in `apps/docs/src/docs/runbooks/runway.mdx`: Infisical as the source
  (ADR 0173), one CI identity per environment, the per-target write path (Encore, Workers, EAS) fed on stdin, a
  names-only plan before every sync, and which parts wait for gen, STA-136 and STA-17.
- **FR-012**: The reusable workflows are released as the tag `runway-v<n>` on a main commit; an external caller pins
  the commit SHA with the tag in a comment, and core's own callers use the local path. Documented in the runbook.

- **FR-013**: `@stackra/runway` with `stackra runway validate|plan|infra preview|infra up|deploy|promote|rollback|secrets
sync|status` in `@stackra/cli` is the one deployment tool (ADR 0352 decision 1); `tools/scripts/runway.mjs` folds into
  it.
- **FR-014**: Every target is a provider in `@stackra/runway/node` behind one port (plan, apply, verify, rollback), in
  the build order npm and Keygen, Cloudflare Workers, Encore Cloud, EAS, AWS or Compose, Mintlify (ADR 0352 decision 3).
- **FR-015**: `stackra runway infra preview|up` drives the `@stackra/infra-*` components through the Pulumi Automation
  API from `runway.yaml`, with state and config in `figentra/infra`; agents run `preview` only (ADR 0352 decision 4).
- **FR-016**: CI holds one public reusable `runway.yml` and one `runway-promote.yml` that run the CLI; the per-provider
  workflows of FR-005 to FR-007 shrink to callers of them (ADR 0352 decision 6).
- **FR-017**: Every deploy, promote and rollback writes one record to GitHub Deployments, a Linear release and Slack
  (ADR 0352 decision 7, ADR 0170 decision 10).
- **FR-018**: `deploy` runs gen first for the members it ships; gen holds no deploy, promote, secret or infrastructure
  logic (ADR 0352 decision 5).

- **FR-019**: Runway is AI-operable: `validate`, `plan`, `status` and `infra preview` are MCP tools any agent may call;
  `deploy`, `promote`, `rollback` and `infra up` are MCP tools that need the owner's approval; a `runway` skill is the
  agents' blueprint for writing `runway.yaml`, reading a plan and repairing a failed deploy (ADR 0155, ADR 0352). The
  logic stays in the package; the skill never re-implements it.

## Success Criteria

- **SC-001**: `node tools/scripts/spec-gate.mjs check .agents/specs/sta-72-runway-deploy-layer` passes and
  `node tools/scripts/validate-repository.mjs` reports no finding from this change.
- **SC-002**: Every buildable deliverable is committed with its code and tests; every blocked one is a Linear issue
  under STA-72 naming its blocker.
- **SC-003**: The tests, the workflow lint and a first live run of each workflow pass in the testing pass (STA-597).

## Blocked (recorded, not built here)

| Item                                                                                                                       | Blocked on                                     |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Encore deploy spike (STA-136) and its ADR replacing ADR 0170 decision 2                                                    | gen emitting the Encore app (STA-339, STA-594) |
| `encore-cloud` provider workflow and the staging deploy on merge (replaces `deploy-staging`)                               | STA-136                                        |
| Images: `encore build docker` in deploy and release jobs, Trivy image scan, syft SBOM, cosign image signing, Compose smoke | gen (deployables), STA-136                     |
| Generated CI pipelines (STA-256)                                                                                           | gen pipeline emitter                           |
| Sync execution into Encore, Workers and EAS                                                                                | gen, STA-136, STA-17                           |
| `stackra validate`, `stackra deploy`, `stackra promote` in the CLI                                                         | the STA-348 completion branch (CLI frozen)     |
| EAS provider (STA-17)                                                                                                      | the owner's EAS project                        |
| Snapshot `next` releases (STA-209)                                                                                         | the first publish (OP2) and public packages    |

## Out of scope

- The R2 Turbo remote-cache Worker (ADR 0289 decision 2): its own issue; it uses the provider built here.
- Figentra OS previews and its router Worker (figentra/os, STA-546).
- The `@stackra/infra-*` Pulumi packages and `stackra infra` (STA-590, being built on the completion branch).
- Runways for `apps/console`, `apps/mobile`, `apps/playground` and the reference services: their hosting is not decided.
- `dependency-review` on pull requests (the rest of STA-310).

## Status history

- 2026-10-25 · — → Draft · Claude (spec-writer) · from the 2026-10-25 audit and the owner brief
- 2026-10-25 · Draft → Clarified · Claude (spec-writer) · decisions recorded above, including the figentra/platform answer
- 2026-10-25 · Clarified → Planned · Claude (spec-writer)
- 2026-10-25 · Planned → Tasked · Claude (spec-writer)
- 2026-10-25 · Tasked → Implementing · Claude (infra-engineer) · T001 to T013 written; T014 waits for the testing pass (STA-597)
