# Implementation Plan: ci: a SAST and DAST baseline with the Stackra Semgrep rules and a nightly ZAP scan

**Spec**: `.agents/specs/sta-2821-sast-dast-baseline/spec.md` · **Linear**: STA-2821 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2821-sast-dast-baseline/spec.md`

## Summary

One Node script, `tools/scripts/security-scan.mjs`, runs Semgrep with the Stackra rules and OWASP ZAP from images pinned
by digest, gates their reports with committed data (`tools/security/`) and writes SARIF. A workflow runs it on pull
requests and nightly; a runbook says how to read and accept results.

## Technical Context

- **Language**: Node ESM (`.mjs`), YAML, ZAP's tab-separated rules format
- **Members**: the workspace root (`tools/` is not a member)
- **Testing**: `node:test` in `tools/scripts/__tests__/`; `semgrep --test` over the rule fixtures
- **Storage**: none
- **Runtime target**: CI runners and the build box, with Docker

## Constitution Check

| Law                                   | Result | Note                                                                   |
| ------------------------------------- | ------ | ---------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | N/A    | repository tooling; no member imports it                               |
| Secrets (ADR 0009)                    | PASS   | none read or printed; no credential passed to ZAP                      |
| Security                              | PASS   | adds scanning; active scans only against hosts Stackra owns            |
| HTTP and events                       | N/A    | no endpoint or event                                                   |
| Tenancy                               | N/A    | no tenant data                                                         |
| Delegation                            | PASS   | Claude only                                                            |
| Not built yet (ADR 0011)              | PASS   | ADR 0187 Enforcement moves from planned to partial                     |
| Test placement (ADR 0022)             | PASS   | `tools/scripts/__tests__/`; rule fixtures in `__tests__/__fixtures__/` |
| Versions and catalogs                 | PASS   | images and actions pinned by digest or commit SHA (ADR 0019)           |
| Deploy modes (ADR 0076)               | N/A    | nothing ships                                                          |
| Licence tier (ADR 0077)               | PASS   | free; Semgrep CE and ZAP are open source, run as images                |
| Docs and ADRs                         | PASS   | Security testing runbook; ADR 0187 Enforcement line                    |

## Deploy modes

| Mode       | Behaviour                                        |
| ---------- | ------------------------------------------------ |
| SaaS       | unchanged; the nightly scan reads public hosts   |
| On-prem    | unchanged; an operator may run the scans locally |
| Air-gapped | unchanged; the images must be mirrored first     |

## Correctness properties

- **P-001**: every Stackra rule matches its `// ruleid:` fixture lines and no `// ok:` line — Validates: FR-001
- **P-002**: a finding outside the baseline fails the run, a listed one passes, a vanished one is stale — Validates: FR-002
- **P-003**: a baseline update keeps accepted reasons and reads back identically — Validates: FR-003
- **P-004**: both tool commands name the pinned image; Semgrep's mount is read-only with no network — Validates: FR-004
- **P-005**: the policy decides each alert's level; an unlisted High fails — Validates: FR-005
- **P-006**: a host Stackra does not own is refused before Docker starts, and active modes need a local or active host — Validates: FR-006
- **P-007**: an `api` spec off the target's origin is refused and ZAP's attack carries `-O` — Validates: FR-007
- **P-008**: SARIF carries one rule per Stackra rule or ZAP plugin and stable fingerprints — Validates: FR-008
- **P-009**: the workflow's jobs hold only `contents: read` and `security-events: write` — Validates: FR-009
- **P-010**: the runbook is in the docs sidebar and linked from ADR 0187 — Validates: FR-010

## Architecture overview

`security-scan.mjs` parses its arguments, builds one Docker command per tool (pinned image, read-only checkout for
Semgrep, host network only for a local ZAP target), runs it, reads the tool's JSON report and passes it through a pure
gate function (`gateSemgrep` against the baseline, `gateZap` against the policy). The gate's result decides the exit
code and feeds the SARIF writer. Target and spec URL checks run before any process starts.

## Components and responsibilities

- the argument parser and `UsageError`: flags per command, exit 2 on misuse.
- the SAST half: fingerprints, the baseline reader and writer, `gateSemgrep`, `semgrepSarif`, `semgrepCommand`.
- the DAST half: `parseZapPolicy`, `gateZap`, `zapSarif`, `readTargets`, `isLocalHost`, `resolveTarget`,
  `resolveApiSpec`, `zapCommand`.
- the data in `tools/security/`: seven rules with fixtures, the baseline, the ZAP policy and targets.
- the workflow: a SAST job (fixtures, scan, upload) and a DAST matrix job (passive baseline per target, upload, HTML
  report kept 30 days).

## Files and folders

```text
package.json
.github/workflows/security-scan.yml
tools/scripts/security-scan.mjs
tools/scripts/__tests__/security-scan.test.mjs
tools/security/README.md
tools/security/semgrep/rules/
tools/security/semgrep/__tests__/__fixtures__/
tools/security/semgrep/baseline.yaml
tools/security/zap/policy.tsv
tools/security/zap/targets.yaml
apps/docs/src/docs/runbooks/security-testing.mdx
apps/docs/src/docs/runbooks/ci.mdx
apps/docs/src/docs/adr/0187-security-and-compliance-programme.mdx
apps/docs/src/config/docs.config.ts
.oxlintrc.jsonc
lefthook.yml
.flow/overrides/hooks/lefthook.yml.txt
.flow/lock.json
tools/README.md
tools/scripts/README.md
```

## Data models and migrations

none (the three data files' formats are in the spec's Contract section)

## Contracts

Additive: the two root commands, their flags and exit codes, and the `tools/security/` file formats. The module's
exports are read by its own test only. SARIF categories `semgrep-stackra` and `zap-<target>`.

## Error handling

`UsageError` and a refused target or spec exit 2 before Docker starts. A Semgrep rule error, a missing report or ZAP's
error exit 3 is a tool failure (exit 2), never a pass. A gate failure exits 1 after writing SARIF.

## Security and tenancy

Active scans reach only a local or private host or a listed target marked `active: true`; none is. The `api` spec URL
must sit on the target's origin or a local host and carry no credentials, and `-O` pins ZAP's attack to the target.
The workflow starts with `permissions: {}`; checkout keeps no credentials; a fork cannot upload SARIF. No tenant data.

## Testing strategy

- AC-001 to AC-004: `main sast` tests with a stubbed Docker (new finding, baseline update, stale entry, tool failure).
- AC-005: `sast --test` in the workflow and the `--test` case in the unit test.
- AC-006 to AC-010: `main dast` tests (FAIL alert, refused target, refused spec, `-O` pinning, ZAP exit 3) and the
  `resolveTarget`, `resolveApiSpec` and `zapCommand` cases.
- AC-011: the committed-file tests for the baseline, the policy and the targets.
- AC-012: read in review; the repository's action-pin check.
- The `-O` pinning was also proved live with ZAP 2.17.0 against a spec naming a second local port.

## Rollout

Merged with the SAST job not required. The first nightly run is read by release-operations (SC-003). STA-2823 works
down the baseline; STA-2822 adds the missing headers, after which those ZAP plugins can fail.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2 (a new workflow with a write-scoped job token).

## ADRs

ADR 0187 decision 3 (implemented, Enforcement partial); ADR 0019; ADR 0450 decision 3.

## Docs

The Security testing runbook (new), the CI runbook's enforcement row, ADR 0187's Enforcement line, the tools READMEs.

## Complexity tracking

none
