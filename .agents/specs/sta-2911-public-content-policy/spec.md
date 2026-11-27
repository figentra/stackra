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
- **Public contract change**: none in a package. Repository tooling: `tools/scripts/public-content.allow.yaml` becomes `tools/scripts/public-content.policy.yaml` (`allow` only; a `deny` key is refused); the hashed deny list is a private policy read from `--private-policy <file>` or the file `PUBLIC_CONTENT_PRIVATE_POLICY_FILE` names; `guard-public-content.mjs` gains `--policy`, `--private-policy` and `--files`, `--hash` prints a private `deny` entry, and an invalid policy or a named private policy that cannot be read exits 2; the root script `pnpm public-content`; the Quality Gate decrypts `PUBLIC_CONTENT_PRIVATE_POLICY` (sops scope ci/build) when the repository variable `PUBLIC_CONTENT_PRIVATE_POLICY` is `sops`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: keeps personal data (team members' names, home folders) and internal infrastructure names out of public files, now before each commit as well; no public file holds a denied term or its hash (a hash of a short name is recovered by hashing guesses): the hashed list is a private policy
- **Secrets**: one name, `PUBLIC_CONTENT_PRIVATE_POLICY` in the sops scope ci/build (the private policy's text, declared in `runway.yaml`); the owner creates its value
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
- **SRC-002**: the root `package.json` (`verify`, `validate`), `.flow/overrides/hooks/lefthook.yml.txt`, `lefthook.yml` and `.github/workflows/release.yml` on that branch (FR-007, FR-008, FR-010)
- **SRC-003**: the item text (batch 23, item 23.3) and the STA-2876 review amendment (FR-009)

## Glossary

- **Public policy**: `tools/scripts/public-content.policy.yaml`: `allow` only.
- **Private policy**: the hashed `deny` list, outside this repository, read from `--private-policy <file>` or `PUBLIC_CONTENT_PRIVATE_POLICY_FILE`.
- **Approval line**: a spec line that says `Approved by …` or `**Approver**:`; only the approver writes it.

## User Scenarios & Testing

### User Story 1 - A repository says what it denies and what it exempts (Priority: P1)

A maintainer adds a denied term to the private policy, or exempts a path, a line or a package in the public policy
with a reason and an issue, without editing the guard.

**Why this priority**: the item asks for a policy file; a hard-coded list cannot differ per repository.

**Independent Test**: `guard-public-content.test.mjs` (policy cases).

**Acceptance Scenarios**:

1. **Given** a private policy with a `deny` entry for a term, **When** a file or tarball names that term, **Then** the guard reports it.
2. **Given** no private policy, **When** the guard runs, **Then** it says the denied terms were not checked and still checks home folders.
3. **Given** a policy entry without a reason or issue, an unknown key, a `deny` key in the public policy, or a named private policy that cannot be read, **When** the guard runs, **Then** it exits 2, names each problem and checks nothing.

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
- **EC-04**: a `deny` entry that repeats another is a problem; a `deny` key in the public policy is a problem.
- **EC-05**: a repository `path` allow entry never exempts a file inside a tarball; only a `package` entry does.

## Requirements

### Functional Requirements

- **FR-001**: THE guard SHALL deny exactly the private policy's `deny` entries; WHEN no private policy is named THE guard SHALL deny no term and SHALL say on stderr that denied terms are not checked. Sources: SRC-001, SRC-003
- **FR-002**: THE private policy SHALL give each `deny` entry its `sha256` (of the lower-case term), `length` and `reason`; THE public policy SHALL give each `allow` entry exactly one of `path` and `package` (a `lineSha256` only with one exact path), a `reason` and an `issue`, and SHALL hold no `deny` key. Sources: SRC-001, SRC-003
- **FR-003**: IF a policy has an unknown key, an entry that breaks FR-002, or a duplicate, or a named private policy cannot be read, THEN THE guard SHALL print each problem as `<policy>: <problem>`, check nothing and exit 2. Sources: SRC-001
- **FR-004**: THE guard SHALL read the public policy `tools/scripts/public-content.policy.yaml` by default (`--policy <file>` otherwise) and the private policy from `--private-policy <file>` or the file `PUBLIC_CONTENT_PRIVATE_POLICY_FILE` names, in every scanning mode. Sources: SRC-001
- **FR-005**: WHEN `--files <path>…` is given THE guard SHALL read only those files (their paths relative to the repository), skipping one that no longer exists. Sources: SRC-002
- **FR-006**: `--hash <term>` SHALL print a private `deny` entry as one JSON line, without the term. Sources: SRC-001
- **FR-007**: THE root script `pnpm public-content` SHALL run the guard over the tracked files and `pnpm validate` (so `pnpm verify` and the Quality Gate) SHALL run it. Sources: SRC-002
- **FR-008**: THE pre-commit hook SHALL run `guard-public-content.mjs --files` on the staged files, and both release pack steps SHALL keep running `--pack`. Sources: SRC-002
- **FR-009**: THE guard SHALL exempt no line by its wording; the approval-line format names a role and a date and passes on its own. Sources: SRC-003
- **FR-010**: WHEN the repository variable `PUBLIC_CONTENT_PRIVATE_POLICY` is `sops` THE Quality Gate SHALL decrypt `PUBLIC_CONTENT_PRIVATE_POLICY` from the sops scope ci/build and write it where `pnpm validate` reads it (`PUBLIC_CONTENT_PRIVATE_POLICY_FILE`). Sources: SRC-002

### Non-functional Requirements

- **NFR-001**: neither the guard nor the public policy SHALL hold a denied term or a hash of one (a hash of a short name is recovered by hashing guesses). Sources: SRC-001
- **NFR-002**: the pre-commit job SHALL skip with a message, not fail, when node or the workspace install is missing (CI still checks). Sources: SRC-002

### Key Entities

- **Deny entry** (private policy): `{ sha256, length, reason }`. **Allow entry** (public policy): `{ path | package, reason, issue }` or `{ path, lineSha256, reason, issue }`.

## Acceptance criteria

- **AC-001**: WHEN a private policy denies a term THE guard SHALL report it in a file (`--files`) and in a tarball (`--pack`), whether the policy is named by flag or by `PUBLIC_CONTENT_PRIVATE_POLICY_FILE`.
- **AC-002**: WHEN no private policy is named THE guard SHALL deny no term, SHALL say so on stderr and in its result line, and SHALL still report home folders.
- **AC-003**: IF a policy is invalid, the public policy has a `deny` key, or a named private policy cannot be read, THEN THE guard SHALL exit 2 in every scanning mode and name each problem.
- **AC-004**: WHEN a staged file names a personal home folder THE pre-commit hook SHALL fail and name the file and line.
- **AC-005**: WHEN `pnpm validate` runs THE guard SHALL read every tracked file; this branch's report SHALL be clean.
- **AC-006**: WHEN a spec carries the role-only approval format THE guard SHALL report nothing for it.
- **AC-007**: THE scripts README (`tools/scripts/README.md`) and the release runbook SHALL say where the guard runs, that the denied terms are a private policy, and how to allow an entry in the public policy.
- **AC-008**: WHEN the repository variable `PUBLIC_CONTENT_PRIVATE_POLICY` is `sops` THE Quality Gate SHALL write the decrypted private policy where `pnpm validate` reads it, before `pnpm validate` runs; no public file SHALL hold a denied term's hash.

## Success Criteria

- **SC-001**: the guard's tests fail when the private policy's deny is ignored, a named private policy that is missing is ignored, the public policy's `deny` refusal is removed, a hash is put back in the guard, its problems are not reported, an invalid policy does not stop the scan, `--files` is removed, or the guard leaves validate or the pre-commit hook — verified by: unit (`guard-public-content.test.mjs`, revert check)
- **SC-002**: a staged file with a home folder is refused by lefthook's pre-commit run — verified by: e2e (lefthook on a clean checkout)

## Out of scope

- The template repository and stackra-pro: they get the same guard once it ships from a package (a follow-up issue); their policy file is this one's shape.
- New denied terms: a maintainer adds one to the private policy with `--hash`.
- Creating `PUBLIC_CONTENT_PRIVATE_POLICY` in the sops scope ci/build and setting the repository variable: owner steps.
- The release pack steps reading the private policy: STA-2923.
- The approval lines that name a person today: line entries under STA-2905, unchanged.

## Assumptions

- PR #1197 (STA-2876) merges first; this branch is stacked on it and retargets `main` after.

## Amendments

- 2026-11-27 · CTO ruling on PR #1198: the hashed deny list did not hide short names (a product's or a person's name is
  recovered from a short guess, so a hash of a name in a public file publishes the name). The recommended list and
  `waive` are removed; the denied terms move to a private policy the guard reads when one is named, and the public
  policy refuses a `deny` key. The Quality Gate reads the private policy once the owner turns it on. The claim that
  the files publish nothing they forbid now holds: no public file carries a denied term or its hash.

## Status history

- 2026-11-27 · — → Draft · spec author · written from the branch's diff and the audit item
- 2026-11-27 · Draft → Clarified · spec author · scope fixed by the item text and the STA-2876 review
- 2026-11-27 → Planned (plan.md)
- 2026-11-27 → Tasked (tasks.md)
- 2026-11-27 → Implementing (built on the branch, tasks ticked)
