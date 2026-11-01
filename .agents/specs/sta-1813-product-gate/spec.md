# Specification: a product gate on every core train

**Feature Branch**: `figentra/sta-1813-product-gate`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1813

**Clarifications status**: complete

**Input**: The testing session (stackra-8a) found every product-side defect of the 0.3.x trains by hand-running
figentra billing, pay and invoicing against the core train on testbed boxes: generated code that did not compile in a
consumer (TS6133 unused constants, TS2717 duplicate `[OptionalProps]`, a module class shadowing its import), the database
testing entry pulling the events plugin into webhooks, faker and pglite loaded eagerly, goldens silently gitignored, and
manifests that only exist in another repository. Core's own gate (`ci.yml` Quality Gate, `pnpm verify`) passed all of
them. The hand-run scripts are in the notes handover folders `billing-gates-2026-11-01`, `pay-gates-2026-11-01` and
`tax-move-gates-2026-11-01`.

## Decision

Before a core train (`land/<ver>-stack`) can be released, a small fixed matrix of real product services is generated,
typechecked and tested against it, automatically, on a testbed box. Core is linked into a scratch copy of each pinned
product (the mechanism the hand-run gates used), never published for the purpose. The runner is a command of the `stackra` CLI,
`stackra consumer-gate` in `@stackra/cli` (ADR 0500 decision 3: no new `tools/scripts` commands; the command is generic,
so it sits next to `stackra testbed`); the matrix and the allow-list are the repository's own data,
`tools/consumer-gate/matrix.yaml` and `allow.yaml`. Cloning stays
outside the script. A known product-side failure is excused only by an allow-list entry that names an STA issue and
expires within 30 days, so the gate cannot be argued green and left that way.

## Impact

- **Apps touched**: `apps/docs` (a section in `runbooks/release.mdx`, plan step 5)
- **Services touched**: none (the gate reads product services in other repositories)
- **Packages touched**: `packages/developer/cli` (the `consumer-gate` command, `src/node/consumer-gate/`; changeset)
- **Workflows touched**: plan step 4 only: a new manual-trigger `.github/workflows/product-gate.yml`, sketched in
  plan.md, not written yet; `release.yml` is not edited
- **Tools touched**: `tools/consumer-gate/matrix.yaml` and `allow.yaml` (data only; nothing new in `tools/scripts`)
- **Cross-service events**: none
- **Tenancy and data**: none (no tenant data; the product test suites use their own Docker Postgres)
- **Secrets**: none in files or argv. Product repository read access uses the existing `stackra-bot` GitHub App token
  (repository secrets `STACKRA_BOT_APP_ID` and `STACKRA_BOT_PRIVATE_KEY`, as `release.yml`) or, on a testbed box, the
  Infisical path `/ci` through the shared gate identity (`INFISICAL_GATE_IDENTITY_ID`, ADR 0484 decision 7). The
  licence tokens a product install needs (`UNIWIND_AUTH_TOKEN`) come the same way. Names only; no value in git.
- **ADR needed**: no (amends the use of ADR 0484 and ADR 0166 CI2; if the leader wants the Version Packages block as a
  required check, a short ADR amendment of 0166 follows, see Open questions)
- **New dependencies**: none (`yaml` is already a dependency of `@stackra/cli`)
- **Deploy modes**: internal CI tooling only; not shipped to tenants
- **Licence tier**: free (internal tooling, MIT like the rest)
- **Docs to update**: `runbooks/release.mdx`, `packages/developer/cli/README.md`, `.agents/skills/test-infra/SKILL.md` (one row)
- **Lane**: full
- **Change risk**: R2 (CI policy; a gate that can block a release; no cloud resource, no credential path of its own)

## Requirements

- **FR-001** A matrix file pins each product: repository, a ref (a commit SHA), the services to gate, the services whose
  manifests are overlaid, and optionally a narrower step list. A product has one `ref`, or `pins`, a commit per
  service, when its services sit on separate pull requests; services with different pins are gated one pin at a time
  with `--services`, and a run whose services disagree is a setup error. The seed matrix is billing (services billing,
  entitlements, usage; pins `1139925`, `c605e78`, `aacd450`; overlays tenancy, invoicing, payments, entitlements), pay (payments,
  payments-ledger; pin `58528f4`; overlays tenancy, integrations), invoicing (invoicing; pin `30310f9`; overlay
  tenancy), tamo (tamo; pin `0c52fd6`; overlay identity) and `scaffold` (FR-013).
- **FR-002** The runner works only on a scratch copy of the product checkout: it drops the copy's `pnpm-lock.yaml`,
  links every `@stackra/*` package of the core tree through the catalog and `overrides:` of `pnpm-workspace.yaml`, and
  copies an overlay `stackra.manifest.json` for each listed service the product does not hold. The checkout and the
  core tree are never written.
- **FR-003** The steps are, in order: `install`, `leak` (pack mode, FR-010), `build-deps` (then a commit of the
  scratch repository), `gen` (`stackra gen --manifests && stackra gen`, per service, then a gen-drift record: `git
status --porcelain` into `gen-drift-<key>.txt`, listed in the summary, not a failure), `typecheck`, `lint`, `build`
  (when a service has the script), `test`, `test:int` (per service that has the script) and the repo-own `format`
  (`format:check`), `spell` and `validate` (each when the product has the script). The repo-own steps judge the
  product's own repository: they run with the checkout's `pnpm-workspace.yaml` and `pnpm-lock.yaml` copied back in and
  the overlay-only `services/<x>` folders moved aside, and the linked workspace and overlays are restored in a
  `finally`. The core tree must be built already (`<core>/packages/*/*/dist`): the command never installs, builds or
  writes in it, and a core without a build is a setup error naming the build command. A failed install, core pack or
  leak check skips the rest; any other failure lets later steps run, as the hand-run gates did.
- **FR-004** A product run is GREEN when every step passed or is excused, and RED otherwise. `stackra consumer-gate` exits 0, 1 or
  2 (setup error: unknown product or service, unbuilt core, checkout not at the pinned SHA (a hex SHA, always
  compared), missing overlay manifest or `--overlays`, missing workspace file or service at the pin, a refused
  allow-list, `--out` inside the checkout or core tree, a failed copy or scratch-git command, an empty step plan).
- **FR-005** The allow-list excuses a failing step only when every failure line of that step matches a live entry. An
  entry names product, step, a `class`, a `match` substring (at least 12 characters, or holding a `TS` code or an
  `ERR_` token), an STA issue, `added` (not in the future), `expires` and a reason; `expires` is 1 to 30 days after
  `added`, dates are `YYYY-MM-DD`. The class is `product`, `flaky`, `environment` or `known-core`; a failure of class
  `security`, `tenant-isolation`, `data-integrity` or `leak`, and the `leak` step, can never be allow-listed: an entry
  with one of those classes, or with none, is refused as malformed (exit 2). An expired entry excuses nothing and is
  named in the summary; another malformed entry, or an entry for an unknown product or step, makes the run RED.
  Failure lines are read after turbo's `pkg:task: ` prefix is stripped.
- **FR-006** The runner writes `summary-<key>.json`, `summary-<key>.md` and one log per step under `--out`, where the
  key is `<product>@<pin>` (plus `~<services>` when narrowed), so per-pin runs never overwrite each other, and prints
  the markdown. The summary carries the core SHA, the product SHA and each step's status.
- **FR-007** The command never fetches, clones or reads a secret; the caller provides the two trees and the environment.
  A pinned SHA the checkout is not at is a setup error, not a silent run.
- **FR-008** A manual-trigger workflow and a testbed invocation run the matrix for a pushed train ref and report one
  commit status, `product-gate`, on its head. (Plan steps 3 and 4; the script alone does not satisfy it.)
- **FR-009** The `product-gate` status is a required check on the `chore(release): version packages` pull request and on
  a train's pull request into main. (Plan step 5; needs the leader's answer on how the PR is gated.)

- **FR-010** `--mode link|pack` (default `link`). In `pack` mode core is not linked: every publishable core package
  (non-private `@stackra/*` under `packages/`, the set `release.yml` builds and publishes) is packed with `pnpm pack
--pack-destination <out>/tarballs` from its own folder, and the product's `@stackra/*` catalog rows and `overrides:`
  become `file:<out>/tarballs/<name>-<version>.tgz`. After install a `leak` step fails (never allow-listed) when a
  file under the copy's `node_modules/@stackra/*` resolves (realpath) into the core tree, or an installed
  `exports` holds an `@stackra/source` condition naming a `./src/` file the tarball does not contain.
- **FR-011** The `leak` step and failures of class `security`, `tenant-isolation` or `data-integrity` are core-side or
  never-negotiable findings: they fix the train and no allow entry can excuse them (FR-005).
- **FR-012** The summary carries an environment record: core commit, product ref, mode, Node version, pnpm version,
  the product lockfile's sha256 before the run and the copy's after install, the `@stackra/gen` version of the core
  tree, the sha256 of each overlay manifest, and a one-line `reproduce` command that re-runs the exact invocation;
  the markdown has a short block of the same.
- **FR-013** A matrix entry `kind: scaffold` (the `scaffold` consumer) is a reference app made from core's own
  scaffold, not a product repository: a service from `stackra new service`, plus the fixture folder
  `tools/consumer-gate/scaffold-fixture/` (one action, one model with a migration, one test), gated in `pack` mode.
  The matrix schema and the fixture exist; the temp-workspace runner does not yet (`stackra new` writes only into a
  pnpm workspace root), so the command exits 2 with "not yet supported" for it.

## Open questions for the leader

Each has a proposed answer; the plan assumes the proposal until told otherwise.

1. **Matrix size and runtime.** Proposal: four products, nine services (billing, entitlements, usage, payments, payments-ledger, invoicing, tamo).
   The hand-run rounds took about 25 minutes per product on a warm box, so the budget is 90 minutes for the matrix, one
   product per box in parallel (about 35 minutes wall time), against the 3-hour testbed timeout.
2. **Where it runs.** Proposal: the testbed (`stackra testbed run`), because the product tests need Docker (`test:int`,
   Testcontainers) and the linked-core install is heavy; a manual `workflow_dispatch` GitHub workflow is the
   fallback, as `testbed-fallback.yml` is for the presets. Not on every pull request: on the train ref, once per
   release candidate.
3. **Link or prerelease.** Proposal: link, because it needs no publish and tests the exact train commit. A published
   prerelease (`0.3.1-next.n` to the Stackra registry, `release.yml` prerelease path) is a better final check of what
   consumers install, but that path is limited to five config presets and runs only on main. Both: link on the train,
   a prerelease run once after the version PR merges is a later step, not this one.
4. **Overlay manifests.** Billing needs manifests of services it does not hold (tenancy, invoicing, payments) from the
   private notes `os-manifests/`. Proposal: the caller copies them into one directory (`--overlays`); the repository
   never holds them. Alternative: commit generated copies as test fixtures in each product repository.
5. **How the result blocks the version PR.** Proposal: the gate posts the `product-gate` commit status on the train
   head, and the leader adds it to the required checks for the train's PR to main (the `figentra-flow/gate` or CI
   rule, STA-1729). The Version Packages PR is created by `release.yml` on main from that merged code, so the status is
   also re-posted on its head by one more dispatch before the owner merges it.
6. **Pin bumps.** Proposal: the pins move only by a reviewed pull request to `tools/consumer-gate/matrix.yaml`, opened by the
   testing session when a product merges to its main; a stale pin more than 14 days behind the product's main is
   reported, not enforced.
7. **Who owns the products' red steps.** Proposal: the product's own team fixes it, an allow entry is added by the
   testing session with an STA issue in that product's Linear project, and core never edits a product to pass.
8. **`<MODULE>_ENTITIES` overlay** and the product's `validate` findings (seed `.json` files, spell) were gate-local and
   product-side. Proposal: `validate` is a step but every known finding goes in the allow-list; the entitlements overlay is
   not reproduced, because it is still open on core main and belongs in core.

## Status history

- 2026-11-01 → Clarified (leader brief; open questions carry proposed answers)
- 2026-11-01 → Pack mode, leak check, environment record, scaffold consumer, class-based allow-list, repo-own window and a never-write-core rule added (FR-002 to FR-013)
- 2026-11-01 → Placement changed: the runner is `stackra consumer-gate` (ADR 0500 decision 3), the matrix is corrected from the hand-run gates (per-service pins; usage, payments-ledger, tamo added)
