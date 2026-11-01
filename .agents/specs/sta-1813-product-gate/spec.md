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
product (the mechanism the hand-run gates used), never published for the purpose. The runner is one dependency-free
script, `tools/scripts/product-gate.mjs`; the matrix and the allow-list are two YAML files beside it. Cloning stays
outside the script. A known product-side failure is excused only by an allow-list entry that names an STA issue and
expires within 30 days, so the gate cannot be argued green and left that way.

## Impact

- **Apps touched**: `apps/docs` (a section in `runbooks/release.mdx`, plan step 5)
- **Services touched**: none (the gate reads product services in other repositories)
- **Packages touched**: none
- **Workflows touched**: plan step 4 only: a new manual-trigger `.github/workflows/product-gate.yml`, sketched in
  plan.md, not written yet; `release.yml` is not edited
- **Tools touched**: new `tools/scripts/product-gate.mjs`, `product-gate.matrix.yaml`, `product-gate.allow.yaml` and a
  test in `tools/scripts/__tests__/`
- **Cross-service events**: none
- **Tenancy and data**: none (no tenant data; the product test suites use their own Docker Postgres)
- **Secrets**: none in files or argv. Product repository read access uses the existing `stackra-bot` GitHub App token
  (repository secrets `STACKRA_BOT_APP_ID` and `STACKRA_BOT_PRIVATE_KEY`, as `release.yml`) or, on a testbed box, the
  Infisical path `/ci` through the shared gate identity (`INFISICAL_GATE_IDENTITY_ID`, ADR 0484 decision 7). The
  licence tokens a product install needs (`UNIWIND_AUTH_TOKEN`) come the same way. Names only; no value in git.
- **ADR needed**: no (amends the use of ADR 0484 and ADR 0166 CI2; if the leader wants the Version Packages block as a
  required check, a short ADR amendment of 0166 follows, see Open questions)
- **New dependencies**: none (`yaml` is already a root catalog dependency, used by `adr-reserve.mjs`)
- **Deploy modes**: internal CI tooling only; not shipped to tenants
- **Licence tier**: free (internal tooling, MIT like the rest)
- **Docs to update**: `runbooks/release.mdx`, `tools/scripts/README.md`, `.agents/skills/test-infra/SKILL.md` (one row)
- **Lane**: full
- **Change risk**: R2 (CI policy; a gate that can block a release; no cloud resource, no credential path of its own)

## Requirements

- **FR-001** A matrix file pins each product: repository, a ref (a commit SHA), the services to gate, the services whose
  manifests are overlaid, and optionally a narrower step list. The seed matrix is billing (billing, entitlements), pay
  (payments) and invoicing (invoicing).
- **FR-002** The runner works only on a scratch copy of the product checkout: it drops the copy's `pnpm-lock.yaml`,
  links every `@stackra/*` package of the core tree through the catalog and `overrides:` of `pnpm-workspace.yaml`, and
  copies an overlay `stackra.manifest.json` for each listed service the product does not hold. The checkout and the
  core tree are never written.
- **FR-003** The steps are, in order: `install`, `build-deps`, `gen` (`stackra gen --manifests && stackra gen`, per
  service), `typecheck`, `test`, `test:int` (per service that has the script) and `validate` (when the product has the
  script). Unless the core tree is already built, core is installed and built first. A failed install or core build
  skips the rest; any other failure lets later steps run, as the hand-run gates did.
- **FR-004** A product run is GREEN when every step passed or is excused, and RED otherwise. The runner exits 0, 1 or
  2 (setup error: unknown product, checkout not at the pinned SHA, missing overlay manifest).
- **FR-005** The allow-list excuses a failing step only when every failure line of that step matches a live entry. An
  entry names product, step, a `match` substring, an STA issue, `added`, `expires` and a reason; `expires` is at most
  30 days after `added`. An expired entry excuses nothing and is named in the summary; a malformed entry makes the
  run RED.
- **FR-006** The runner writes `summary-<product>.json`, `summary-<product>.md` and one log per step under `--out`, and
  prints the markdown. The summary carries the core SHA, the product SHA and each step's status.
- **FR-007** The script never fetches, clones or reads a secret; the caller provides the two trees and the environment.
  A pinned SHA the checkout is not at is a setup error, not a silent run.
- **FR-008** A manual-trigger workflow and a testbed invocation run the matrix for a pushed train ref and report one
  commit status, `product-gate`, on its head. (Plan steps 3 and 4; the script alone does not satisfy it.)
- **FR-009** The `product-gate` status is a required check on the `chore(release): version packages` pull request and on
  a train's pull request into main. (Plan step 5; needs the leader's answer on how the PR is gated.)

## Open questions for the leader

Each has a proposed answer; the plan assumes the proposal until told otherwise.

1. **Matrix size and runtime.** Proposal: three products, four services (billing, entitlements, payments, invoicing).
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
6. **Pin bumps.** Proposal: the pins move only by a reviewed pull request to `product-gate.matrix.yaml`, opened by the
   testing session when a product merges to its main; a stale pin more than 14 days behind the product's main is
   reported, not enforced.
7. **Who owns the products' red steps.** Proposal: the product's own team fixes it, an allow entry is added by the
   testing session with an STA issue in that product's Linear project, and core never edits a product to pass.
8. **`<MODULE>_ENTITIES` overlay** and the product's `validate` findings (seed `.json` files, spell) were gate-local and
   product-side. Proposal: `validate` is a step but every known finding goes in the allow-list; the entitlements overlay is
   not reproduced, because it is still open on core main and belongs in core.

## Status history

- 2026-11-01 → Clarified (leader brief; open questions carry proposed answers)
