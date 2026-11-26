# Feature Specification: ci: a SAST and DAST baseline with the Stackra Semgrep rules and a nightly ZAP scan

**Feature Branch**: `figentra/sta-2821-sast-dast-baseline`

**Created**: 2026-11-26

**Status**: Tasked

**Tier**: feature

**Approver**: leader

**Linear**: STA-2821

**Clarifications status**: complete

**Input**: Linear STA-2821. GitHub's CodeQL default setup scans every pull request, but nothing scans for the patterns
this framework forbids (SQL built by string interpolation, shell commands with interpolation, TLS verification turned
off, a caller's URL reaching `fetch` without `checkEgress`, dynamic code, an insecure random secret, an unsanitised HTML
sink), and nothing scans a running site. ADR 0187 decision 3 promises a nightly ZAP scan.

### Sources

- ADR 0187 decision 3 (testing: a nightly ZAP scan) — FR-001 to FR-010
- ADR 0019 (tools pinned; workflow permissions empty by default) — FR-004, FR-009
- ADR 0450 decision 3 (egress: `checkEgress` before a caller's URL is fetched) — FR-001, FR-006, FR-007
- the diff of stackra#1112 against main (`tools/scripts/security-scan.mjs`, `tools/security/`,
  `.github/workflows/security-scan.yml`, the Security testing runbook)

## Problem

Stackra's own rules (no interpolated SQL or shell, egress checked, TLS verification on) live only in review and in
CodeQL's general queries, which do not know `checkEgress` or the framework's drivers. A rule that is not scanned
regresses silently. ADR 0187's nightly dynamic scan does not exist, so a missing security header or an injectable
endpoint on a deployed host is found only by a person.

## Contract

The change adds a repository tooling contract; it publishes no package and changes no runtime port.

- **Commands** (root `package.json`): `pnpm security:sast` and `pnpm security:dast`, both
  `node tools/scripts/security-scan.mjs <sast|dast>`.
  - `sast [--test] [--local] [--sarif <file>]` and `sast --update-baseline --reason <text> --issue STA-n [--local]`.
  - `dast --target <name|url> [--mode baseline|full|api] [--api <spec url>] [--minutes <n>] [--out <dir>] [--sarif <file>]`.
  - Exit codes: 0 clean (known findings and warnings only), 1 a new finding or a FAIL alert, 2 usage, a refused target
    or a tool failure.
- **Module exports** of `tools/scripts/security-scan.mjs` (read by its test only): the pinned image constants, the data
  paths, `parseArgs`, `UsageError`, the SAST functions (`fingerprintResults`, `readBaseline`, `gateSemgrep`,
  `writeBaselineText`, `semgrepSarif`, `semgrepCommand`, `runSast`) and the DAST functions (`parseZapPolicy`,
  `defaultLevel`, `gateZap`, `zapSarif`, `readTargets`, `isLocalHost`, `resolveTarget`, `resolveApiSpec`, `zapCommand`).
- **Data files** under `tools/security/`: one Semgrep rule per file in `semgrep/rules/` (`stackra.<name>`) with its
  fixture; `semgrep/baseline.yaml` (rule, path, fingerprint, reason, STA key per accepted finding); `zap/policy.tsv`
  (ZAP's rules format: plugin id, IGNORE, INFO, WARN, FAIL or OUTOFSCOPE, note); `zap/targets.yaml` (name, https url,
  note, optional `active`).
- **CI**: `.github/workflows/security-scan.yml`, with SARIF uploaded to code scanning under the categories
  `semgrep-stackra` and `zap-<target>`.

Who sees it: contributors (a new SAST job on pull requests that touch code), the release-operations owner (the nightly
DAST results in code scanning), and anyone running the scans on the box. Nothing outside this repository calls it.

**Compatibility**: additive. No existing command, workflow, export or required check changes; the SAST job is not a
required check. The 59 findings in existing code are accepted in the baseline (tracked in STA-2823), so no current pull
request turns red. Migration: none.

## Impact

- **Apps touched**: apps/docs (the Security testing runbook, the CI runbook's enforcement row, ADR 0187's Enforcement
  line, the docs sidebar entry)
- **Services touched**: none
- **Packages touched**: none
- **Public contract change**: additive: `pnpm security:sast`, `pnpm security:dast` and the `tools/security/` file formats
- **Cross-service events**: none
- **Tenancy and data**: none; the scans read the checkout and send requests only to the target they were given
- **Security and privacy**: new scanning only; active scans are refused for any host Stackra does not own; no credential
  is passed to ZAP
- **Secrets**: none (the job token uploads SARIF only)
- **ADR needed**: no; it implements ADR 0187 decision 3 under ADR 0019 and ADR 0450 decision 3
- **New dependencies**: none in the workspace; two Docker images pinned by digest (Semgrep CE 1.184.0, ZAP 2.17.0)
- **Deploy modes**: same in all three (repository tooling; nothing ships)
- **Licence tier**: free
- **UI surfaces**: none
- **Docs to update**: runbooks/security-testing (new), runbooks/ci, ADR 0187 Enforcement, tools/README.md,
  tools/scripts/README.md, tools/security/README.md
- **Lane**: full
- **Change risk**: R2 (a new workflow with a `security-events: write` job token; scanning only, no runtime code)

## Requirements

### Functional Requirements

- **FR-001**: THE SAST scan SHALL run the seven Stackra Semgrep rules over `apps`, `packages`, `services` and `workers`,
  excluding tests, fixtures, dependencies and generated output.
- **FR-002**: WHEN a finding's fingerprint (rule, path, matched text) is in `tools/security/semgrep/baseline.yaml` THE
  SAST scan SHALL count it as known; IF a finding is not in the baseline THEN THE SAST scan SHALL exit 1.
- **FR-003**: WHEN run with `--update-baseline --reason <text> --issue STA-n` THE SAST scan SHALL write every current
  finding to the baseline, keeping an accepted entry's reason and dropping a fixed one.
- **FR-004**: THE scans SHALL run Semgrep and ZAP from Docker images pinned by digest, Semgrep with the checkout mounted
  read-only and no network.
- **FR-005**: THE DAST scan SHALL gate ZAP's JSON report with `tools/security/zap/policy.tsv`: a FAIL alert exits 1, a
  WARN is reported, an IGNORE or an out-of-scope URL is dropped, and an unlisted High fails.
- **FR-006**: IF the target is neither a local or private host nor listed in `tools/security/zap/targets.yaml` THEN THE
  DAST scan SHALL refuse it with exit 2 before Docker starts; an active `full` or `api` scan SHALL be allowed only for a
  local or private host or a target marked `active: true`.
- **FR-007**: WHEN the mode is `api` THE DAST scan SHALL accept a spec URL only on the target's origin or a local host,
  with no credentials, and SHALL pin ZAP's attack to the target's origin (`-O`).
- **FR-008**: WHEN `--sarif <file>` is given THE scans SHALL write SARIF with one rule per Stackra rule or ZAP plugin
  and a stable fingerprint per result.
- **FR-009**: THE workflow SHALL run the rule fixtures and the SAST scan on pull requests that touch code or the scan's
  own files and nightly, and a passive ZAP baseline nightly per listed target, each job with only `contents: read` and
  `security-events: write`.
- **FR-010**: THE Security testing runbook SHALL say how to run each scan, read a failure, accept a finding, and what a
  green scan does not prove.

## Acceptance criteria

- **AC-001**: WHEN a Semgrep result is not in the baseline THE `sast` command SHALL exit 1 and name the finding.
- **AC-002**: WHEN the baseline is updated with a reason and an STA key THE next `sast` run SHALL exit 0 and write SARIF.
- **AC-003**: WHEN a baseline entry no longer matches any finding THE `sast` command SHALL report it as stale.
- **AC-004**: IF Semgrep reports a rule error or writes no report THEN THE `sast` command SHALL exit 2.
- **AC-005**: WHEN `sast --test` runs THE rule fixtures SHALL pass: every `// ruleid:` line matches and no `// ok:` line
  does.
- **AC-006**: WHEN ZAP reports an alert whose plugin the policy marks FAIL THE `dast` command SHALL exit 1 and write
  SARIF.
- **AC-007**: IF the target is a host Stackra does not own THEN THE `dast` command SHALL exit 2 without starting Docker.
- **AC-008**: IF an `api` scan's spec URL is off the target's origin and not local THEN THE `dast` command SHALL exit 2
  without starting Docker.
- **AC-009**: WHEN an `api` scan runs against a local target THE ZAP command SHALL carry `-O` with the target's origin.
- **AC-010**: IF ZAP exits with its error code 3 THEN THE `dast` command SHALL exit 2, not pass.
- **AC-011**: THE committed `baseline.yaml`, `policy.tsv` and `targets.yaml` SHALL parse, the policy SHALL fail the
  injection classes, and no committed target SHALL be active.
- **AC-012**: THE workflow SHALL declare `permissions: {}` at the top and pin every action by commit SHA.

## Success Criteria

- **SC-001**: `tools/scripts/__tests__/security-scan.test.mjs` passes in the Quality Gate — verified by: unit
- **SC-002**: `pnpm security:sast --test` passes for all seven rules — verified by: the workflow's fixture step
- **SC-003**: the first nightly run uploads `zap-registry`, `zap-static` and `zap-docs` to code scanning — verified by:
  manual (release-operations reads the run)

## Risks

- The workflow has not yet run on hosted runners; its first pull request and nightly runs are the proof (SC-003).
- Semgrep's taint tracking stays inside one function; a URL passed through helpers is CodeQL's job, not this rule's.
- The ZAP scans run unauthenticated and see only what an anonymous caller sees.
- Review left low follow-ups on the SSRF rule's sanitizer precision and the DAST output folder's permissions; they are
  tracked outside this spec.
- The first ZAP run found missing response headers on two hosts (STA-2822); those plugins warn until that lands.

## Out of scope

- Fixing the 59 accepted findings (STA-2823) and the response headers (STA-2822).
- Authenticated scans, the penetration test and the bug bounty of ADR 0187 decision 3.
- Making the SAST job a required check.

## Open questions

None.

## Status history

- 2026-11-26 → Draft (created from STA-2821 and the diff of stackra#1112)
- 2026-11-26 → Clarified (scope fixed by the diff: seven rules, three passive targets, no required check)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
