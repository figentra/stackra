# Feature Specification: public repos and packages carry nothing internal

**Feature Branch**: `figentra/sta-2876-scrub-internal-content`

**Created**: 2026-11-27

**Status**: Implementing

**Tier**: feature

**Approver**: leader (technical stop under the owner's delegation; change risk R2)

**Linear**: STA-2876

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: the production-readiness audit (batch 23, item 23.2) found internal content in the public repository and in
the 0.33.1 tarballs: other Figentra products' names, team members' names, a personal tunnel host, an internal dev
zone, a cloud account id, a vault path and a personal home folder. It was split out of STA-2790, which keeps the CLI,
doctor and starter. This change scrubs everything else and adds a guard so it stays clean.

## Impact

- **Apps touched**: apps/docs (ADRs, runbooks and Arabic pages: prose only; the release and Runway runbooks), apps/mobile and apps/playground (a demo brand theme renamed)
- **Services touched**: none
- **Packages touched**: packages/developer/runway (the pull-request zone), packages/infrastructure/infra-testbed (the key pair option and neutral defaults), packages/infrastructure/infra-cloudflare, packages/infrastructure/infra-aws-runtime, packages/infrastructure/infra-github, packages/developer/gen, packages/developer/vite-plugin, packages/commerce/fiscal, packages/commerce/payments, packages/commerce/pricing, packages/application/achievements, packages/application/ai, packages/design-system/tokens, packages/design-system/ui, packages/experience/native-scale, packages/experience/panel, packages/foundation/support, packages/runtime/app (examples, fixtures, comments, changelogs), workers/registry (README and a test fixture), tools/scripts (two new files, guard-port, linear-reconcile), .github/workflows (release, runway-npm, linear-sync, apply-testbed)
- **Public contract change**: breaking in `@stackra/runway/node`: `pullRequestPreviewHost(product, pullRequest, zone)` takes the zone, `PULL_REQUEST_PREVIEW_SETTINGS` loses `zone`, and a pull-request `publishProduct` refuses a root runway without `environments.preview.domains.pullRequestZone` (new optional field in the root schema, the zod schema and both JSON Schema copies). Additive: `AwsTestbedOptions.keyPair` in `@stackra/infra-testbed` and the stack config `keyPair`; the reusable workflow `runway-npm.yml` gains the input `pack-check`; `linear-reconcile.mjs` gains `--extra-repos`. `TESTBED_DEFAULTS.keyPair`, `keyFile` and `awsProfile` change value.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: removes personal data (team members' names, a personal home folder and tunnel host) and internal infrastructure names (an account id, a dev zone, a vault path) from public files and tarballs; the guard stores the denied terms only as SHA-256 hashes
- **Secrets**: none (no secret is read or named; two repository variables, `TESTBED_KEY_PAIR` and `LINEAR_RECONCILE_EXTRA_REPOS`, hold non-secret names)
- **ADR needed**: no (ADR 0291 keeps a port's reference, not its source's private paths; ADR 0453 ships what the tarball holds; ADR 0289 decision 7 gives the pull-request host's shape)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (a demo theme's id and label in the playground and mobile app)
- **Docs to update**: apps/docs/src/docs/runbooks/release.mdx, apps/docs/src/docs/runbooks/runway.mdx, .github/workflows/README.md, tools/scripts/README.md, packages/developer/runway/README.md
- **Lane**: full
- **Change risk**: R2 (release workflow and a public package contract)

## Discovery

- **Current behaviour**: on `origin/main` (5c174305d) the tracked files name two other Figentra products in about 110
  files, team members in about 30, a personal home folder in ADRs 0097 and 0100 and the roadmap, a personal tunnel host
  in infra-cloudflare, the internal dev zone as the pull-request preview zone in `@stackra/runway`, the testbed's
  cloud account id in a workflow and the Pulumi project, and a vault path in a runway driver. The 0.33.1 tarballs of
  `@stackra/runway`, `@stackra/infra-cloudflare`, `@stackra/infra-testbed` and `@stackra/app` carry the same strings
  in `src/`, `dist/`, the README and the schema (SRC-001, SRC-002).
- **Topology**: published tarballs hold `dist`, `src` (tests included), `schema`, the README and the CHANGELOG of each
  package; `release.yml` publishes through the reusable `runway-npm.yml` (or its own prerelease job) (SRC-003).
- **Dependencies**: gitleaks already scans for secret-shaped strings (`.gitleaks.toml`, lefthook pre-commit, the
  Quality Gate's `pnpm secrets:scan`); nothing checked names, hosts or home folders (SRC-003).
- **Ownership**: STA-2790 owns `packages/developer/cli` (the CLI, doctor and starter) and its branch; approval lines in
  `.agents/specs` belong to the approver (SRC-004).
- **Constraints already decided**: applied D1 migrations are never edited (their file contract); ADR 0291; ADR 0453;
  ADR 0289 decision 7 (SRC-004).

### Sources

- **SRC-001**: `git grep` of the denied terms on `origin/main` 5c174305d (FR-001 to FR-004, FR-010, FR-011)
- **SRC-002**: the 0.33.1 tarballs from the Stackra registry, read with `guard-public-content.mjs --pack` (FR-005, FR-006)
- **SRC-003**: `.github/workflows/release.yml`, `runway-npm.yml`, `ci.yml` and `lefthook.yml` on `origin/main` (FR-005, FR-006)
- **SRC-004**: the item text (batch 23, item 23.2), STA-2876 and STA-2790 (FR-001, FR-007)
- **SRC-005**: `packages/developer/runway/src/node/functions/publish-pull-request.function.ts` and `pull-request-preview-host.function.ts` on `origin/main` (FR-008)
- **SRC-006**: `packages/infrastructure/infra-testbed/src/core/constants/testbed-defaults.constant.ts` and `.github/workflows/apply-testbed.yml` on `origin/main` (FR-009)
- **SRC-007**: `tools/scripts/linear-reconcile.mjs`, `linear-reconcile.repos.yaml`, `.github/workflows/linear-sync.yml` and `tools/scripts/guard-port.mjs` on `origin/main` (FR-010, FR-011)
- **SRC-008**: `fflow gate ci` (ADR 0502) on this branch: it reads every changed spec against today's shape, so the specs older than it stay as they are (STA-2898) (FR-007)

## Glossary

- **Denied term**: an internal product, person, host or cloud account id, kept in the guard as a SHA-256 hash with its length and reason.
- **Personal home folder**: `/Users/<name>/` or `/home/<name>/` where the name is not a placeholder (`me`, `runner`, `ubuntu`, `<you>` …).
- **Approval line**: a line of a spec that says `Approved by …` or `**Approver**:`; only the approver writes it.

## User Scenarios & Testing

### User Story 1 - Nothing internal in what we publish (Priority: P1)

A developer who installs a `@stackra/*` package, or reads the repository or the docs, sees neutral examples (acme,
bistro, `dev.example`, `/Users/me`) and no Figentra person, private product, internal host or account.

**Why this priority**: the packages and the repository are public; the strings expose people and infrastructure.

**Independent Test**: `guard-public-content.mjs` over the tracked files, and `--pack` over every tarball `pnpm pack`
makes after a build.

**Acceptance Scenarios**:

1. **Given** this branch, **When** the guard reads the tracked files, **Then** it reports nothing.
2. **Given** a build of every published package, **When** each is packed and read with `--pack`, **Then** it reports nothing.

### User Story 2 - It stays that way (Priority: P1)

A contributor who adds an internal name, host or home folder to a tracked file, or a build that would put one in a
tarball, is stopped before merge or before publish.

**Why this priority**: a one-off scrub drifts back within days.

**Independent Test**: `tools/scripts/__tests__/guard-public-content.test.mjs`; the release workflows' tarball steps.

**Acceptance Scenarios**:

1. **Given** a tracked file that names a denied term, **When** `pnpm validate` runs, **Then** the Quality Gate fails and names the file and line.
2. **Given** a tarball with a denied term, **When** the release job runs, **Then** it stops before the dry run, the version PR or the publish.

### User Story 3 - A product names its own preview zone (Priority: P2)

A product that publishes pull-request previews names the zone in its root runway; Stackra no longer falls back to
Figentra's internal zone.

**Independent Test**: `publish-pull-request.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a root runway with `environments.preview.domains.pullRequestZone: preview.example`, **When** pull request 412 of `bistro` publishes, **Then** the host is `bistro-pr-412.preview.example`.
2. **Given** a root runway without it, **When** a pull request publishes, **Then** the publish is refused with that path before any upload or write.

### Edge Cases

- **EC-01**: a denied word inside a longer word (`zorblaxing`) is not a finding; a whole word in any case is.
- **EC-02**: a denied host is found as a suffix of a longer host (`console-me.<zone>`).
- **EC-03**: a binary file is read by its path only.
- **EC-04**: a tarball path longer than 100 bytes (a GNU long-name entry) is read under its full path.
- **EC-05**: an approval line is checked like any other line and never edited by the scrub: each of the 12 that name a person today is exempt by its own line entry (STA-2905); a new one that names a person is a finding, and a line entry whose line is gone is reported.
- **EC-06**: the CLI (`packages/developer/cli/**`, `@stackra/cli`'s tarball) and the applied registry migrations are exempt, each with its issue.

## Requirements

### Functional Requirements

- **FR-001**: THE repository's tracked files outside the allow list SHALL name no denied term and no personal home folder, in their paths or their text; no line is exempt by its wording, only by an allow entry. Sources: SRC-001, SRC-004
- **FR-002**: THE guard `tools/scripts/guard-public-content.mjs` SHALL report each finding as `path:line: reason` (line 0 for the path) and exit 1, exit 0 when clean and 2 on bad usage. Sources: SRC-001
- **FR-003**: THE guard SHALL store each denied term only as the SHA-256 of its lower-case spelling, with its length and a reason, and SHALL check words whole and hosts by each suffix of two labels or more. Sources: SRC-001
- **FR-004**: THE allow list `tools/scripts/public-content.allow.yaml` SHALL give each exemption (a `path`, one line of a file by its `lineSha256`, or a tarball `package`) a reason and the issue that removes it, and THE guard SHALL report a line entry whose line is no longer in its file. Sources: SRC-004
- **FR-005**: WHEN `--pack <file.tgz>…` is given THE guard SHALL read every file inside each tarball, and skip a tarball whose package the allow list names. Sources: SRC-002
- **FR-006**: THE release (`runway-npm.yml` with `pack-check`, as `release.yml` passes it) and the prerelease job SHALL pack every package they would publish and run the guard on the tarballs before the dry run, the version PR or the publish. Sources: SRC-003
- **FR-007**: THE scrub SHALL NOT edit an approval line in `.agents/specs`, any file under `packages/developer/cli`, an applied migration, or a spec older than the ADR 0502 shape (each exempt in the allow list with its issue). Sources: SRC-004, SRC-008
- **FR-008**: `pullRequestPreviewHost` SHALL take the zone and refuse one that is not a lowercase host name of two labels or more, and a pull-request `publishProduct` SHALL read the zone from `environments.preview.domains.pullRequestZone` and refuse a root runway without it. Sources: SRC-005
- **FR-009**: THE testbed SHALL take its EC2 key pair from the stack (`AwsTestbedOptions.keyPair`, the Pulumi config `keyPair`, the `TESTBED_KEY_PAIR` variable in `apply-testbed.yml`), the package defaulting to `stackra-testbed`; `apply-testbed.yml` SHALL refuse to apply without `TESTBED_KEY_PAIR` (an `::error` naming it, before AWS) and never fall back to that default, and SHALL derive the state bucket from the assumed account instead of naming it. Sources: SRC-006
- **FR-010**: `linear-reconcile.mjs` SHALL read the private repos it also reconciles from `--extra-repos` (the `LINEAR_RECONCILE_EXTRA_REPOS` variable in CI), not from the public list. Sources: SRC-001, SRC-007
- **FR-011**: `guard-port.mjs` SHALL take the Stackra checkout from `GUARD_PORT_STACKRA` (default `~/Projects/stackra`) and the muslin reference checkout from `GUARD_PORT_MUSLIN_REFERENCE`, refusing a muslin port without it. Sources: SRC-001, SRC-007

### Non-functional Requirements

- **NFR-001**: THE guard SHALL read the whole repository in under 10 seconds on a CI runner (6 s measured on the build box). Sources: SRC-001
- **NFR-002**: THE guard SHALL not publish the terms it forbids (hashes only). Sources: SRC-001

### Key Entities

- **Allow entry**: `{ path | package, reason, issue }`, or `{ path, lineSha256, reason, issue }` for one line, in `tools/scripts/public-content.allow.yaml`.

## Acceptance criteria

- **AC-001**: WHEN the guard reads this branch's tracked files THE guard SHALL report nothing.
- **AC-002**: WHEN every published package is built, packed and read with `--pack` THE guard SHALL report nothing (119 tarballs; `@stackra/cli` exempt under STA-2790).
- **AC-003**: IF a tracked file's path or text names a denied term or a personal home folder THEN THE Quality Gate (`pnpm validate`) SHALL fail and name the file and line.
- **AC-004**: IF a tarball the release would publish names a denied term or a personal home folder THEN THE release job SHALL stop before the dry run, the version PR or the publish.
- **AC-005**: WHEN a pull request publishes without `pullRequestZone` THE publish SHALL be refused before any upload or write.
- **AC-006**: WHEN a stack names `keyPair` THE launch template SHALL name that pair; IF `TESTBED_KEY_PAIR` is unset THEN `apply-testbed.yml` SHALL stop with an error naming it.
- **AC-007**: WHEN `--extra-repos` is given THE reconcile SHALL read the public list plus those repos, each once.
- **AC-008**: IF a muslin port runs without `GUARD_PORT_MUSLIN_REFERENCE` THEN THE `guard-port.mjs` command SHALL exit 2 and write nothing.
- **AC-009**: WHEN the scrub is applied THE approval lines of `.agents/specs`, `packages/developer/cli`, the applied migrations and the specs older than the ADR 0502 shape SHALL be unchanged, each exempt in the allow list with its issue.
- **AC-010**: IF a new approval line names a person THEN THE guard SHALL report it; WHEN an exempt line is rewritten THE guard SHALL report its stale entry.

## Success Criteria

- **SC-001**: the 0.33.1 tarballs of runway, infra-cloudflare, infra-testbed and app give hundreds of findings; this branch's 119 packed tarballs give none — verified by: e2e (`guard-public-content.mjs --pack` on the build box)
- **SC-002**: the guard's tests fail when the path check, the hash check or the tarball reader is removed — verified by: unit (`guard-public-content.test.mjs`, revert check)

## Out of scope

- `packages/developer/cli` (the CLI, doctor and starter): STA-2790's branch scrubs it; its allow entries go then. Handoff: `TESTBED_CLI_DEFAULTS.key` still names the old key file; it must change together with the testbed's key pair (`TESTBED_DEFAULTS.keyPair`, `TESTBED_KEY_PAIR`), never alone.
- The approval lines that name a team member (12 lines in 11 specs): only the approver changes them; each is a line entry of the allow list under STA-2905, which asks for role-only approvals.
- Eleven specs older than the ADR 0502 shape: the spec gate refuses any edit to them, so their few internal lines wait for STA-2898.
- Applied registry migration `0003_figentra_brand.sql`: never edited once applied.
- Republishing or deprecating the 0.33.1 tarballs: the next release ships clean ones; deprecating old versions is a registry decision.
- Other product names that the audit did not list; a new term is one `--hash` line away.

## Assumptions

- The owner sets `TESTBED_KEY_PAIR` to the testbed's existing key pair before the next testbed apply; until then the workflow refuses to apply.
- The owner sets `LINEAR_RECONCILE_EXTRA_REPOS` to the private repos the nightly reconcile should still read.

## Amendments

- 2026-11-27 · review of the branch: (1) `apply-testbed.yml` refused nothing when `TESTBED_KEY_PAIR` was unset and fell back to a default pair nobody had checked exists, so the next apply could rewrite the launch template to a missing pair; it now refuses, and the runbook lists the variable. (2) The runbook's Retire step, after the rename, told operators to delete the live `stackra-testbed` security groups; it now describes the old CI group without naming it, and the mobile-onboarding example no longer claims live store records. (3) The guard's hard-coded approval-line exemption had no issue and grew with each approval; it is removed, today's 12 lines are line entries under STA-2905, and stale line entries are reported.

## Status history

- 2026-11-27 · — → Draft · spec author · written from the branch's diff and the audit item
- 2026-11-27 · Draft → Clarified · spec author · scope fixed by the item text (CLI and approval lines excluded)
- 2026-11-27 → Planned (plan.md)
- 2026-11-27 → Tasked (tasks.md)
- 2026-11-27 → Implementing (built on the branch, tasks ticked)
