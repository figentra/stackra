# Feature Specification: a full-history secret scan of every public ref and a stale-branch archive plan

**Feature Branch**: `figentra/sta-2878-history-secret-scan`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: leader (technical stop under the owner's delegation; change risk R1)

**Linear**: STA-2878

**Clarifications status**: complete

**Input**: Batch 23 of the readiness drive, item 23.1. A public repository publishes every commit on every branch, tag
and pull request ref, not only `main`. `pnpm secrets:scan` reads the working tree and the pre-commit hook reads one
commit, so nothing had read the whole public history of the core and template repositories, and the readiness audit
reported token-shaped strings in commits outside `main`. Many stale branches keep that history reachable.

### Sources

- ADR 0009 (secrets never in a repository, a log or a report), ADR 0019 and ADR 0027 (pinned tools in `mise.toml`),
  ADR 0267 (value-free output) (FR-002, FR-003)
- `.gitleaks.toml` and `.gitleaksignore` (the repository's secret policy) (FR-001, FR-002)
- the readiness audit of 2026-11-26 (item 23.1) (FR-001 to FR-005)

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none (a root tool script and its tests; `package.json` gains `secrets:scan:history`)
- **Public contract change**: no; no package export, manifest, contract or port changes
- **Cross-service events**: none
- **Tenancy and data**: none; the tool reads a local mirror clone and prints file, line, commit, rule and refs only
- **Secrets**: none added; the tool never prints a matched value and refuses to print output that carries one
- **ADR needed**: no; this applies ADR 0009 and ADR 0267
- **New dependencies**: none (gitleaks 8.30.1 is already pinned in `mise.toml`)
- **Deploy modes**: same everywhere (a developer and CI tool, not shipped)
- **Licence tier**: free (MIT, this repo)
- **Docs to update**: `docs/security/history-secret-scan-2026-11-26.md`, `docs/security/branch-archive-plan-2026-11-26.md`
- **Lane**: lite
- **Change risk**: R1 (a read-only tool and two dated reports; nothing is deleted or pushed)

## Requirements

- **FR-001** `scan` runs gitleaks over every commit reachable from any ref of a local repository (`--log-opts=--all`),
  so branches, tags and `refs/pull/*` are all read.
- **FR-002** `scan` runs two passes: the repository's policy (its config, its `.gitleaksignore` and inline
  `gitleaks:allow` comments), and gitleaks' default rules with no allowlist, an empty ignore file and
  `--ignore-gitleaks-allow`, so a token-shaped value marked allowed on any ref is still listed. A finding only the second
  pass reports is shown as `allowlisted`.
- **FR-003** Each finding is reported by file, line, commit, rule, policy result, a placeholder-or-review sort, whether
  `main` carries it, and the branches, tags and pull requests that carry it. No matched value leaves the process, and
  the output is checked against every matched text before it is printed.
- **FR-004** `branches` classifies every branch (merged, content in base, pull request merged, snapshot, pull request
  closed, pull request open, open) and never lists a protected branch for archiving.
- **FR-005** `archive` writes one verified git bundle per listed branch, a manifest with sha256 and a deletion script
  guarded by `--force-with-lease`; it changes no ref and pushes nothing.

## Acceptance criteria

Each criterion names the test in `tools/scripts/__tests__/secrets-history-scan.test.mjs` that holds it (12 tests; AC-001
has two).

- **AC-001**: IF the command line is bad (an unknown command, a missing or an extra argument) THEN THE script SHALL exit
  2 with its usage and SHALL NOT echo what it was given. Tests: "parseArgs refuses a bad command line without echoing
  what it was given"; "the script runs as a command and prints usage on a bad command".
- **AC-002**: WHEN a finding's matched text is a placeholder THE scan SHALL sort it by its value, never by its key name.
  Test: "classifyMatch tells a placeholder from a credential by the value, not the key name".
- **AC-003**: IF a line of output carries a matched value THEN THE scan SHALL refuse that output. Test: "assertValueFree
  refuses output that carries a matched value".
- **AC-004**: WHEN a finding is reachable from several refs THE scan SHALL list every ref that carries it, SHALL split
  the policy pass from the allowlisted findings and SHALL print no matched value. Test: "scan reports every ref that
  carries a finding, splits policy from allowlisted, and prints no value".
- **AC-005**: IF a matched value would reach the report THEN THE scan SHALL print nothing and fail. Test: "scan
  refuses, printing nothing, when a matched value would reach the report".
- **AC-006**: WHEN a credential is reachable only from a pull request ref THE scan, with the real gitleaks, SHALL report
  it. Test: "scan with the real gitleaks finds a credential that only a pull request ref carries".
- **AC-007**: WHEN a credential carries an inline `gitleaks:allow` on a pull request ref THE raw pass SHALL still list it,
  as allowlisted. Test: "scan with the real gitleaks lists a credential marked gitleaks:allow on a pull request ref as
  allowlisted".
- **AC-008**: WHEN `branches` runs THE script SHALL classify merged, squash-merged, snapshot and open branches and SHALL
  never list a protected branch. Test: "branches classifies merged, squash-merged, snapshot and open branches and never
  lists a protected one".
- **AC-009**: WHEN `archive` runs THE script SHALL write one verified bundle per branch, a manifest and the deletion
  commands, and SHALL change no ref. Test: "archive writes one verified bundle per branch and the deletion commands,
  and changes no ref".
- **AC-010**: IF a branch moved after it was bundled THEN THE deletion commands SHALL NOT delete it
  (`--force-with-lease` on its archived tip). Test: "the deletion commands delete only a branch still at its archived
  tip".
- **AC-011**: IF `archive` is given a protected branch or a name that is not a plain ref THEN THE script SHALL refuse
  it. Test: "archive refuses a protected branch or a name that is not a plain ref".

## Not built here

- Turning on GitHub secret scanning and push protection, and deleting the archived branches: owner steps, listed in the
  two reports.

## Amendments

- 2026-11-27 · CTO ruling on PR #1204: the acceptance criteria above map each criterion to its test; the archive plan
  says the scan found no secrets in the pull request refs, while internal identifiers remain there (removal is a GitHub
  Support request, an owner step: STA-2922).

## Status history

- 2026-11-26 → Clarified (from the readiness audit, item 23.1)
- 2026-11-26 → Implementing (`tools/scripts/secrets-history-scan.mjs` and its tests; the review's inline-allow finding
  fixed with `--ignore-gitleaks-allow` on the raw pass and the scan rerun)
