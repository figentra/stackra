# Feature Specification: a full-history secret scan of every public ref and a stale-branch archive plan

**Feature Branch**: `figentra/sta-2878-history-secret-scan`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Linear**: STA-2878

**Clarifications status**: complete

**Input**: Batch 23 of the readiness drive, item 23.1. A public repository publishes every commit on every branch, tag
and pull request ref, not only `main`. `pnpm secrets:scan` reads the working tree and the pre-commit hook reads one
commit, so nothing had read the whole public history of the core and template repositories, and the readiness audit
reported token-shaped strings in commits outside `main`. Many stale branches keep that history reachable.

### Sources

- ADR 0009 (secrets never in a repository, a log or a report), ADR 0019 and ADR 0027 (pinned tools in `mise.toml`),
  ADR 0267 (value-free output)
- `.gitleaks.toml` and `.gitleaksignore` (the repository's secret policy)
- the readiness audit of 2026-11-26 (item 23.1)

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

## Not built here

- Turning on GitHub secret scanning and push protection, and deleting the archived branches: owner steps, listed in the
  two reports.

## Status history

- 2026-11-26 → Clarified (from the readiness audit, item 23.1)
- 2026-11-26 → Implementing (`tools/scripts/secrets-history-scan.mjs` and its tests; the review's inline-allow finding
  fixed with `--ignore-gitleaks-allow` on the raw pass and the scan rerun)
