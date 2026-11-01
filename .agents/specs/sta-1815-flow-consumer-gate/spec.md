# Specification: Figentra Flow orchestrates the consumer gate on every core train

**Feature Branch**: `figentra/sta-1815-flow-consumer-gate`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1815

**Clarifications status**: complete

**Input**: The product-gate split proposed to the leader by core-3b. `stackra consumer-gate` (STA-1813, branch
`figentra/sta-1813-product-gate`, commits `32abf666` and `97ab70b8`) is the per-product check: it links (later, with
`--mode pack`, installs) one product against one core tree, runs install, build-deps, gen, typecheck, test, test:int and
validate per service, judges failures against `tools/consumer-gate/allow.yaml`, writes `summary-<product>.json` and
`.md`, and exits 0, 1 or 2. It never fetches, never reads a secret and decides nothing about when it runs or what it
blocks. This spec is the layer above it: **when** it runs, **where**, and **who it blocks**. Runway's deployment
readiness (tier 3) is a separate spec.

**Cross-repository.** This spec is written in core because core owns the inputs (the matrix, the allow-list, the
trains, the release workflow and branch protection), but nearly all of the work is in **figentra/flow**
(`@figentra-oss/flow`, MIT, published to the `@figentra-oss` scope by figentra/flow's release workflow, ADR 0453). The
leader routes it to Flow's owner, who decides the Flow-side names and shapes; core accepts the result through
`figentra-flow.config.json`.

## Context

- **What Flow owns today** (commit `b369e362`, STA-1729 A6): `figentra-flow.config.json` at the core root names the
  Linear tracker (team `STA`, `figentra/` and `delegate/` branches, token names), the wrapper credentials
  (`pnpm bot:gh --`, `pnpm bot:git --`), the testbed as a command runner
  (`stackra testbed run {label} {dir} {command} {flags}`), the gate secrets (Infisical project `figentra-flow-gate`,
  `prod` `/ci/gate`, universal auth; ids and paths only), the `figentra-gate` and `stackra-reviewer` Apps, the owner,
  `gate.check` (`pnpm verify`) and `clean.keep`. The file is strict JSON (`MUST_STAY_JSON`) validated by Flow's own
  schema, and is **inert until core runs Flow (W2)**. `ci.yml` already records the plan: every pull request into main
  is checked by `CI` until core switches to the required `figentra-flow/gate` (STA-1729 phase 6).
- **ADR 0166 CI2** says the ci-box is advisory and never a required check; ADR 0484 made the ci-box the testbed and
  kept CI2. **CI8** says required checks name one gate job with a 20-minute timeout. A product gate needs Docker,
  Testcontainers and roughly 25 minutes per product, so it runs on the testbed, and making its result block a merge
  contradicts CI2 as written.
- **Trains** are `land/<ver>-stack` branches (today `land/031-stack`) that collect landed work and merge into main by
  one pull request. On main, `release.yml` opens the `chore(release): version packages` pull request (the Version
  Packages PR) as `stackra-bot` and publishes on its merge. The tree that Version Packages PR publishes is the train's
  merged code plus version bumps.

## Decision

Flow gains a **consumer-gate orchestrator**. On every train it reads core's matrix, dispatches one testbed box per
product through its configured `runner` to run `stackra consumer-gate`, collects each product's summary with an
environment record, and posts one aggregate commit status, `product-gate`, from the `figentra-gate` App. Two lanes:

| Lane          | Product side                                                           | Core side      | When                                             | Blocks                            |
| ------------- | ---------------------------------------------------------------------- | -------------- | ------------------------------------------------ | --------------------------------- |
| **certified** | the commit pinned in `tools/consumer-gate/matrix.yaml`, and a lockfile | the train head | every train PR head, every Version Packages head | yes: the train PR, the version PR |
| **latest**    | the product's `main`                                                   | core `main`    | nightly                                          | never; it files Linear issues     |

Flow also owns the **lifecycle** of the two data files core keeps: it opens the pin-bump pull requests to the matrix,
and it enforces, reminds and expires allow-list entries. `stackra consumer-gate` stays the only thing that judges a
step; Flow never re-judges a log.

## Impact

- **Apps touched**: none in core; figentra/flow (the orchestrator, its config schema, its docs)
- **Services touched**: none in core; none in the products (Flow reads figentra/billing, figentra/pay,
  figentra/invoicing and figentra/tamo at their pins and their `main`, and never writes them)
- **Packages touched**: none in core by this spec; figentra/flow (`@figentra-oss/flow`). One request to core,
  carried on STA-1813 and not built here: the environment fields of FR-012 in the `stackra consumer-gate` summary
  (`packages/developer/cli/src/node/consumer-gate/`)
- **Workflows touched**: none in core by this spec; if open question 1 is answered "a core workflow", one
  `.github/workflows/product-gate.yml` (STA-1813 plan step 4) gains the train and schedule triggers. `release.yml` and
  `ci.yml` are not edited
- **Tools touched**: core data only, written by Flow's pull requests and never by Flow directly:
  `tools/consumer-gate/matrix.yaml` (pins) and `allow.yaml` (entries, plus the `class` field of FR-009);
  `figentra-flow.config.json` gains a `consumerGate` section once Flow's schema has it (FR-001)
- **Cross-service events**: none
- **Tenancy and data**: no tenant data. Tenant isolation matters only as a failure class that can never be
  allow-listed (FR-009). The environment records hold SHAs, versions and hashes, never test data or a secret
- **Secrets**: no new secret. Names only: Flow posts through the existing `figentra-gate` App key in Infisical
  `figentra-flow-gate` `prod` `/ci/gate`, read only by the `figentra-flow-box` identity (ADR 0484 decision 7); product
  read access on a box is the `stackra-bot` token (`STACKRA_BOT_APP_ID`, `STACKRA_BOT_PRIVATE_KEY`) or the gate
  identity (`INFISICAL_GATE_IDENTITY_ID`) as in STA-1813; licence tokens (`UNIWIND_AUTH_TOKEN`) from `/ci`. Linear
  writes use the tracker tokens already named in the config (`LINEAR_AGENT_TOKEN`, `LINEAR_API_KEY`). No value in
  git, argv, logs, summaries or environment records
- **ADR needed**: yes, an owner decision: an amendment of ADR 0166 CI2 (and the matching sentence of ADR 0484) so that
  one testbed-run status, `product-gate`, may be required on the two release-path pull requests only (a train into
  main, the Version Packages PR), with the fallback of FR-016. Flow's own design record, if its owner keeps one, lives
  in figentra/flow
- **New dependencies**: none in core; Flow-side choices belong to Flow's owner
- **Deploy modes**: internal release tooling only; nothing ships to a tenant in saas, on-prem or air-gapped
- **Licence tier**: free (`@figentra-oss/flow` is MIT; `stackra consumer-gate` is MIT)
- **Docs to update**: core `runbooks/release.mdx` (the product-gate section STA-1813 adds gains the lanes, the status
  and the reproduce line); core `runbooks/test-infrastructure.mdx` (one row: the product gate boxes); figentra/flow's
  README and config reference
- **Lane**: full (cross-repository, CI policy, branch protection)
- **Change risk**: R2 (a status that blocks a release; no cloud resource; no new credential path, since Flow reuses
  its gate App). Raise to R3 if Flow's poster gains write access beyond commit statuses and pull requests

## Dependencies

- **W2**: core adopts Flow (`figentra-flow.config.json` stops being inert, STA-1729 phase 6). Nothing here runs before
  W2; the certified lane's required status needs it.
- **STA-1813**: `stackra consumer-gate`, the matrix and the allow-list on core main (or the train). The certified
  lane's lockfile pin (FR-005) wants its planned `--mode pack`; FR-012 asks it for the environment fields.
- **Owner**: the ADR 0166 amendment and the branch protection rows (FR-015).

## Requirements

### Configuration

- **FR-001** Core's `figentra-flow.config.json` gains a `consumerGate` section, defined by Flow's schema, naming: the
  matrix and allow-list paths (default `tools/consumer-gate/matrix.yaml` and `allow.yaml`), the train branch pattern
  (default `^land/[0-9a-z.-]+-stack$`), the status context (`product-gate`), the latest-lane schedule, the
  per-product timeout (90 minutes), the overlay source (a path on the box, never in git), and the Linear project for
  latest-lane issues per product. Flow reads the matrix itself; nothing about products is duplicated into the config.

### When it runs (trains and lanes)

- **FR-002** Certified lane triggers: a pull request from a branch matching the train pattern into `main` is opened,
  synchronised or reopened; the Version Packages PR is opened or synchronised; and a manual run
  (`flow consumer-gate run <ref> [--product p]`, name Flow's). Runs for the same pull request are serialised, and a
  newer head cancels a superseded run.
- **FR-003** Version Packages carry-over: when the Version Packages PR's tree differs from the last train merge commit
  that passed the certified lane only in `package.json` `version` fields, `CHANGELOG.md` files and `.changeset/`,
  Flow re-posts that result on the version PR head (the description names the source SHA) instead of running again.
  Any other difference runs the lane.
- **FR-004** Latest lane: on the configured schedule (default nightly), each product's `main` head against core
  `main`'s head. It posts no required status and never blocks. A red product files, or comments on, one Linear issue per
  product and failure signature (open question 8), and a green product feeds the pin bump of FR-011.
- **FR-005** Certified-lane inputs are fixed: the product commit is the matrix pin, and the install is reproducible.
  Until `--mode pack` ships, the box runs link mode and Flow stores the resolved scratch lockfile with the result; a
  reproduce run passes it back. With `--mode pack`, the product's committed lockfile is used and its hash recorded.

### Where it runs

- **FR-006** One testbed box per product, in parallel, through the config's `runner`
  (`stackra testbed run "<label>" <dir> "<command>"`), the label naming the train, the product and the lane. The box
  clones core at the gated SHA and the product at its pin (the command never clones, STA-1813 FR-007), copies the
  overlays, runs `timeout <per-product> stackra consumer-gate ... --out <dir>`, and returns the `--out` folder. A
  product whose services carry different pins is one box per pin group (`--services`).

### Who blocks

- **FR-007** Flow posts `product-gate` on the gated head from the `figentra-gate` App: `pending` when dispatched;
  `success` when every product exited 0; `failure` when any product exited 1; `error` when any product exited 2, a box
  failed, timed out or never started. The description names the red products (within GitHub's 140 characters) and the
  target URL points at the aggregate summary (FR-010).
- **FR-008** Only the certified lane posts `product-gate`. No one but the owner can turn a red certified result
  green without a new run; the owner's override is a Flow command that requires a reason and an STA key, posts
  `success` with "override" in the description, and comments on the issue. An agent never overrides.

### Allow-list lifecycle

- **FR-009** Every allow entry carries a `class`: `product-defect`, `core-tracked`, `tooling` or `flake`. The classes
  `security`, `tenant-isolation` and `data-integrity` can never be allow-listed: Flow refuses an entry that names one,
  and refuses an entry whose `match` hits a failure from a product test file the product marks critical (open
  question 5). Flow's check on a pull request that changes `allow.yaml` also refuses: an `issue` that does not exist
  or is closed in Linear, `expires` more than 30 days after `added`, a missing `reason`, or an entry added by an
  agent without a human review on the pull request.
- **FR-010** Flow keeps the list honest: it comments on the entry's Linear issue seven days before `expires`; on the
  day after expiry it opens a pull request removing the entry (and the gate already stops excusing it, STA-1813
  FR-005); and when a certified run excuses nothing with an entry for a week of runs, or the entry's issue is Done, it
  opens a pull request removing it. Flow never edits `allow.yaml` on a branch it did not create.

### Pins

- **FR-011** When a product's `main` passes the latest lane, Flow opens (or updates) one pull request per product to
  `tools/consumer-gate/matrix.yaml`, moving that product's `ref` or `pins` to the green SHA, with the latest-lane
  summary in the body. It is reviewed like any change; Flow never merges it. A pin more than 14 days behind its
  product's `main` is reported on the train pull request, not enforced.

### Results

- **FR-012** Every per-product result carries an environment record: core SHA, product SHA (per pin group), Node and
  pnpm versions, the product lockfile hash and the resolved scratch lockfile hash, the service image versions the
  tests started (Postgres and any Testcontainers image, by digest), the `@stackra/gen` version and the core SHA it was
  built from, the gate's mode (link or pack), and an overlay snapshot (file name and SHA-256 of each overlay
  manifest). The command writes the fields it can see on the box (asked of STA-1813); Flow adds the box and runner
  fields.
- **FR-013** Flow aggregates the per-product summaries into one `product-gate` summary (JSON and markdown) per gated
  SHA and lane, stores it with the per-product summaries, step logs and environment records, and writes the markdown
  as one comment on the gated pull request, updated in place.
- **FR-014** Each product line of the aggregate carries a one-command reproduce line that re-runs that product with
  the same inputs on a fresh box: the runner command with the core SHA, the product pin, the stored lockfile (FR-005),
  the overlay snapshot and the step list. Running it twice on an unchanged record gives the same verdict, flakes
  aside.

### Required check

- **FR-015** After the ADR 0166 amendment, branch protection on `main` requires `product-gate` from the
  `figentra-gate` App for pull requests whose head matches the train pattern and for the Version Packages PR. It is
  never required on other pull requests. (Owner action; GitHub rulesets scoped by head branch, or Flow posting a
  neutral `success` with "not a release path" on other pull requests if rulesets cannot scope it: open question 4.)
- **FR-016** Fallback: when no testbed box is healthy (ADR 0484 decision 10), the certified lane runs on the
  GitHub-hosted `product-gate.yml` dispatch of STA-1813 plan step 4, and the result is posted by the same rules.

## Acceptance criteria

- **SC-001** A push to a train pull request produces one `product-gate` status on its head within the per-product
  timeout plus 15 minutes, and one aggregate comment listing every matrix product with its verdict and reproduce line.
- **SC-002** A product that exits 1 turns the status `failure` and the train pull request cannot merge; a box that
  dies turns it `error`, distinguishable from a product failure.
- **SC-003** An allow-list pull request that names a `security`, `tenant-isolation` or `data-integrity` class, an
  unknown or closed issue, or an expiry beyond 30 days is refused by Flow's check.
- **SC-004** A Version Packages PR that only bumps versions shows the train's carried result without a new run; one
  that changes code runs the lane.
- **SC-005** A latest-lane red files one Linear issue per product and failure signature, never two for the same
  signature, and never changes a required status.
- **SC-006** A reproduce line copied from an aggregate re-runs that product on a fresh box with the same environment
  record (same SHAs, lockfile hash, overlay hashes, image digests).
- **SC-007** No secret value appears in any config, summary, comment, log or environment record (gitleaks and a
  canary test in Flow).

## Open questions for the leader and Flow's owner

Each has a proposed answer; the plan assumes the proposal until told otherwise.

1. **Where Flow's trigger loop runs.** Proposal: on the `figentra-flow-box`, where Flow's gate poster already runs
   (ADR 0484 decision 7), reacting to GitHub webhooks for the train and version pull requests and to its own schedule
   for the latest lane. Alternative: a core workflow (`product-gate.yml`) that calls `flow` on `pull_request` and
   `schedule`; it needs the testbed reachable from a GitHub runner, which it is not today.
2. **Status name and poster.** Proposal: keep `product-gate` (STA-1813 FR-008, FR-009) and require it from the
   `figentra-gate` App only, so no other identity can satisfy it. Alternative: `figentra-flow/product-gate`, beside
   `figentra-flow/gate`, with STA-1813's wording changed to match.
3. **The ADR 0166 amendment** (owner). Proposal: CI2 gains one exception: a testbed-run status may be required on the
   two release-path pull requests only, with the GitHub-hosted fallback of FR-016 so a testbed outage never freezes a
   release; CI8's "one gate job" stays for the per-PR gate, and `product-gate` is a release-tier check under CI9.
4. **Scoping the required check.** Proposal: a GitHub ruleset on `main` targeting the train pattern and the version PR
   branch (`changeset-release/main`), if rulesets can require a status by head branch; otherwise Flow posts
   `success` "not a release path" on every other pull request into main, so the check can be required repo-wide.
5. **How "never allow-listed" is detected.** A class field is self-declared. Proposal: the class is mandatory and
   reviewed by a human (FR-009); in addition, each product names its critical test files (tenant isolation, security,
   data integrity) in a small list in its own repository, and Flow refuses an entry whose `match` hits a failure from
   one of those files. Alternative: a fixed path convention in products; rejected for now because it would rename
   product tests.
6. **The certified lockfile.** Proposal: until `--mode pack` (STA-1813), certify against the resolved scratch lockfile
   stored with the first green run of a pin, and reuse it for every later run of that pin; with pack mode, use the
   product's committed lockfile, with only the `@stackra/*` tarballs substituted.
7. **Where results are stored and for how long.** Proposal: Flow's own result store (the box's artifact bucket, Flow's
   owner to name it), 90 days for train runs and kept for good for the run that certified a published version, linked
   from the release notes.
8. **Latest-lane issue routing.** Proposal: one issue per product and failure signature (the `consumerGateSignatures`
   line of STA-1813), in the product's Linear project with the labels `consumer-gate` and `agent`; a core-side
   signature (the failure also appears in core's own gate, or the product SHA is unchanged since the last green) goes
   to core's project instead. Flow comments on new nights and closes the issue after three consecutive green nights.
9. **Pin bump cadence.** Proposal: at most one open bump pull request per product, refreshed nightly; a bump is never
   opened from a red latest run.
10. **Owner override** (FR-008). Proposal: kept, owner-only, reason and STA key mandatory. Alternative: no override at
    all, the allow-list being the only path; safer but a stuck box could hold a security release.

## Status history

- 2026-11-01 → Clarified (leader brief; the open questions carry proposed answers; routed to Flow's owner)
