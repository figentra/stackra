# Feature Specification: a public-content guard driven by a policy file

**Feature Branch**: `figentra/sta-2911-public-content-policy`

**Created**: 2026-11-27

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (change risk R1: repository tooling and hooks, no package or service)

**Linear**: STA-2911

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: the production-readiness audit (batch 23, item 23.3): without a guard the scrub decays within days, because
agents keep writing internal names into specs and docs. The item asks for a guard driven by a deny-list policy file
(for example `public-content.policy.yaml`) with the recommended deny list as default, where a repository can add or
waive entries with a reason, run in verify and in the pack step, with the spec approval-line format exempt. STA-2876
(PR #1197, open) built the guard with its deny list hard-coded in the script and an allow list beside it; this change
stacks on that branch and moves what is denied and what is exempt into one policy file.

## Impact

- **Apps touched**: apps/docs (the release runbook: prose only)
- **Services touched**: none
- **Packages touched**: none (tools/scripts, the root `package.json` scripts, the lefthook hooks)
- **Public contract change**: none in a package. Repository tooling: `tools/scripts/public-content.allow.yaml` becomes `tools/scripts/public-content.policy.yaml` with `deny`, `waive` and `allow`; `guard-public-content.mjs` gains `--policy`, `--files` and `--recommended`, `--hash` prints a `deny` entry, and an invalid policy exits 2; the root script `pnpm public-content`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: keeps personal data (team members' names, home folders) and internal infrastructure names out of public files, now before each commit as well; denied terms stay SHA-256 hashes in the policy as in the guard
- **Secrets**: none
- **ADR needed**: no (ADR 0291 and ADR 0453 as for STA-2876; a repository check, not a decision)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: tools/scripts/README.md, apps/docs/src/docs/runbooks/release.mdx
- **Lane**: full
- **Change risk**: R1 (repository tooling: a new pre-commit job and a validate step)

## Discovery

- **Current behaviour**: on `figentra/sta-2876-scrub-internal-content` (4a4b65b8e) the guard's deny list is a `DENIED`
  map in `guard-public-content.mjs`; a repository cannot add a term or drop one without editing the script, and the
  allow list `public-content.allow.yaml` is read without any check of its entries (only the test reads them). The guard
  runs in `pnpm validate` through its test's whole-repository case and in both release pack steps; nothing runs before
  a commit, so an agent's internal name is found only at the Quality Gate (SRC-001, SRC-002).
- **Topology**: `pnpm verify` runs `pnpm validate`; the Quality Gate runs `pnpm validate`; lefthook's pre-commit jobs
  come from `.flow/overrides/hooks/lefthook.yml.txt`, rendered by `fflow sync` into `lefthook.yml` (SRC-002).
- **Dependencies**: gitleaks keeps the secret-shaped strings (`.gitleaks.toml`), unchanged (SRC-002).
- **Ownership**: approval lines belong to the approver; STA-2905 asks for role-only approvals (SRC-003).
- **Constraints already decided**: no line is exempt by its wording (the STA-2876 review removed that exemption); the
  denied terms are never written in plain text (SRC-001, SRC-003).

### Sources

- **SRC-001**: `tools/scripts/guard-public-content.mjs`, `public-content.allow.yaml` and their test on `figentra/sta-2876-scrub-internal-content` 4a4b65b8e (FR-001 to FR-006)
- **SRC-002**: the root `package.json` (`verify`, `validate`), `.flow/overrides/hooks/lefthook.yml.txt`, `lefthook.yml` and `.github/workflows/release.yml` on that branch (FR-007, FR-008)
- **SRC-003**: the item text (batch 23, item 23.3) and the STA-2876 review amendment (FR-009)

## Glossary

- **Policy**: `tools/scripts/public-content.policy.yaml`: `deny`, `waive` and `allow`.
- **Recommended deny list**: the hashed terms built into the guard (`RECOMMENDED_DENY`), every repository's default.
- **Approval line**: a spec line that says `Approved by …` or `**Approver**:`; only the approver writes it.

## User Scenarios & Testing

### User Story 1 - A repository says what it denies and waives (Priority: P1)

A maintainer adds a term the recommended list does not have, or waives a recommended one this repository may name,
in the policy file with a reason, without editing the guard.

**Why this priority**: the item asks for a policy file; a hard-coded list cannot differ per repository.

**Independent Test**: `guard-public-content.test.mjs` (policy cases).

**Acceptance Scenarios**:

1. **Given** a policy with a `deny` entry for a term, **When** a file or tarball names that term, **Then** the guard reports it.
2. **Given** a policy that waives a recommended entry with its issue, **When** the guard runs, **Then** that term is not denied and every other recommended term is.
3. **Given** a policy entry without a reason or issue, an unknown key, or a waive of a term the recommended list lacks, **When** the guard runs, **Then** it exits 2, names each problem and checks nothing.

### User Story 2 - An internal name is stopped before it is committed (Priority: P1)

An agent or contributor who stages a file that names an internal product, person, host or home folder is stopped by
the pre-commit hook, and again by `pnpm verify` and the Quality Gate.

**Why this priority**: agents keep writing internal names into specs and docs; the Quality Gate alone finds them late.

**Independent Test**: `guard-public-content.test.mjs` (`--files`, wiring) and a staged file under lefthook.

**Acceptance Scenarios**:

1. **Given** a staged file with a personal home folder, **When** the pre-commit hook runs, **Then** it fails and names the file and line.
2. **Given** a tracked file with a denied term, **When** `pnpm validate` runs, **Then** `pnpm public-content` fails and names it.

### Edge Cases

- **EC-01**: a staged file deleted in the working tree is not read (it is not committed).
- **EC-02**: a policy file that cannot be read or parsed is one problem, exit 2.
- **EC-03**: a role-only approval line (`Approved by CTO <date>`, `**Approver**: CTO`) passes; one that names a person is a finding.
- **EC-04**: a `deny` entry that repeats an unwaived recommended entry, or another `deny` entry, is a problem.
- **EC-05**: a repository `path` allow entry never exempts a file inside a tarball; only a `package` entry does.

## Requirements

### Functional Requirements

- **FR-001**: THE guard SHALL deny the recommended deny list, less the policy's `waive` entries, plus its `deny` entries. Sources: SRC-001, SRC-003
- **FR-002**: THE policy SHALL give each `deny` entry its `sha256` (of the lower-case term), `length` and `reason`; each `waive` entry its `sha256` (an entry of the recommended list), `reason` and `issue`; each `allow` entry exactly one of `path` and `package` (a `lineSha256` only with one exact path), a `reason` and an `issue`. Sources: SRC-001, SRC-003
- **FR-003**: IF the policy has an unknown key, an entry that breaks FR-002, or a duplicate THEN THE guard SHALL print each problem as `<policy>: <problem>`, check nothing and exit 2. Sources: SRC-001
- **FR-004**: THE guard SHALL read `tools/scripts/public-content.policy.yaml` by default and the file `--policy <file>` names otherwise, in every scanning mode. Sources: SRC-001
- **FR-005**: WHEN `--files <path>…` is given THE guard SHALL read only those files (their paths relative to the repository), skipping one that no longer exists. Sources: SRC-002
- **FR-006**: `--hash <term>` SHALL print a `deny` entry and `--recommended` each recommended entry as one JSON line, both without the term. Sources: SRC-001
- **FR-007**: THE root script `pnpm public-content` SHALL run the guard over the tracked files and `pnpm validate` (so `pnpm verify` and the Quality Gate) SHALL run it. Sources: SRC-002
- **FR-008**: THE pre-commit hook SHALL run `guard-public-content.mjs --files` on the staged files, and both release pack steps SHALL keep running `--pack`. Sources: SRC-002
- **FR-009**: THE guard SHALL exempt no line by its wording; the approval-line format names a role and a date and passes on its own. Sources: SRC-003

### Non-functional Requirements

- **NFR-001**: neither the guard nor the policy SHALL hold a denied term in plain text. Sources: SRC-001
- **NFR-002**: the pre-commit job SHALL skip with a message, not fail, when node or the workspace install is missing (CI still checks). Sources: SRC-002

### Key Entities

- **Deny entry**: `{ sha256, length, reason }`. **Waive entry**: `{ sha256, reason, issue }`. **Allow entry**: `{ path | package, reason, issue }` or `{ path, lineSha256, reason, issue }`.

## Acceptance criteria

- **AC-001**: WHEN a policy denies a term THE guard SHALL report it in a file (`--files`) and in a tarball (`--pack`).
- **AC-002**: WHEN a policy waives a recommended entry THE guard SHALL not deny that term and SHALL deny every other recommended term.
- **AC-003**: IF the policy is invalid THEN THE guard SHALL exit 2 in every scanning mode and name each problem.
- **AC-004**: WHEN a staged file names a personal home folder THE pre-commit hook SHALL fail and name the file and line.
- **AC-005**: WHEN `pnpm validate` runs THE guard SHALL read every tracked file; this branch's report SHALL be clean.
- **AC-006**: WHEN a spec carries the role-only approval format THE guard SHALL report nothing for it.

## Success Criteria

- **SC-001**: the guard's tests fail when the policy's deny or waive is ignored, its problems are not reported, an invalid policy does not stop the scan, `--files` is removed, or the guard leaves validate or the pre-commit hook — verified by: unit (`guard-public-content.test.mjs`, revert check)
- **SC-002**: a staged file with a home folder is refused by lefthook's pre-commit run — verified by: e2e (lefthook on the build box)

## Out of scope

- The template repository and stackra-pro: they get the same guard once it ships from a package (a follow-up issue); their policy file is this one's shape.
- New denied terms: a maintainer adds one with `--hash`.
- The approval lines that name a person today: line entries under STA-2905, unchanged.

## Assumptions

- PR #1197 (STA-2876) merges first; this branch is stacked on it and retargets `main` after.

## Status history

- 2026-11-27 · — → Draft · spec author · written from the branch's diff and the audit item
- 2026-11-27 · Draft → Clarified · spec author · scope fixed by the item text and the STA-2876 review
- 2026-11-27 → Planned (plan.md)
- 2026-11-27 → Tasked (tasks.md)
- 2026-11-27 → Implementing (built on the branch, tasks ticked)
