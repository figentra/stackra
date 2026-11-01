# Specification: linear reconcile reads merged work from every figentra repo

**Feature Branch**: `figentra/sta-1822-reconcile-all-repos`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1822

**Clarifications status**: complete

**Input**: `tools/scripts/linear-reconcile.mjs` reads merged and open PRs only from `figentra/stackra`, the newest 100
of each. Work that lands in another figentra repo (stackra-pro, stackra-template, stackra-notes, billing, pay,
invoicing, tamo, os, juristra, figentra, flow, brand, commerce, organza, velora, academorix, jute, mezzora) never
reaches it, and a direct push or a squash merge whose PR
body lost the trailer is never seen, so those STA issues stay open after their work merges. The script moves to
`figentra linear reconcile` later (ADR 0500); this fixes it where it lives today.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none (`tools/scripts/linear-reconcile.mjs`, a new data file
  `tools/scripts/linear-reconcile.repos.yaml`, a new test `tools/scripts/__tests__/linear-reconcile.test.mjs`,
  `.github/workflows/linear-sync.yml`)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: the workflow passes the stackra-bot App id and key (the repository secrets `STACKRA_BOT_APP_ID` /
  `STACKRA_BOT_PRIVATE_KEY` that release.yml uses today) only to its job in the `linear-sync` environment, and mints a
  read-only installation token for the `figentra` org; no value in git. STA-1827 moves the key to Infisical prod
  `/ci/release` for release.yml and this workflow together (STA-1747). Without a token the job runs on `github.token` and reports the other repos
  as skipped.
- **ADR needed**: no (ADR 0065 rule 7 and ADR 0121 D14 already govern the reconcile; ADR 0500 moves it later)
- **New dependencies**: none (`yaml` is already a root dev dependency)
- **Deploy modes**: all, no change (CI tooling only)
- **Licence tier**: free
- **Docs to update**: `tools/scripts/README.md` row for the script
- **Lane**: lite
- **Change risk**: R1 (nightly, non-blocking tooling; writes only Linear states and marked comments)

## Requirements

- **FR-001** The repo list comes from `tools/scripts/linear-reconcile.repos.yaml` (org and repo names), overridable
  by `--repos a,b`; nothing in the script names a product repo.
- **FR-002** For each repo, the reconcile reads PRs merged since a cursor (`--since`, default 14 days back) and the
  open PRs, paginated and capped per repo per run; fork PRs are ignored as today.
- **FR-003** For each repo, it reads the commits on `main` since the cursor and takes the keys of their
  `Refs:` / `Fixes:` / `Closes:` / `Resolves:` trailers, paginated and capped.
- **FR-004** Merged work closes an issue (→ Done) only through its branch name or a
  `Refs` / `Fixes` / `Closes` / `Resolves` trailer or body line; a title mention, `Part of STA-n` and a bare mention
  never close (`Part of` is the escape hatch for partial work). Open PRs from every repo keep an issue In Review, as before.
- **FR-005** Markers stay unique across repos: a PR outside the core repo is tagged `<repo>#<n>`, a commit
  `<repo>@<sha7>`; core PR tags keep their old form so existing markers still match.
- **FR-006** A repo the token cannot read is reported in the summary and skipped; the run never fails. `--dry-run`
  writes nothing, as before.

## Clarifications

- Q: Does a `Refs:` key now close an issue? → A: yes, for merged-to-main work (the leader's ask): every
  feat/fix commit carries `Refs: STA-n` (commitlint `refs-issue-key`), so it is the only signal outside core branch
  names. A title mention and `Part of STA-n` stay mentions (leader correction, 2026-11-01).
- Q: Which repos? → A: the 19 of `gh repo list figentra` except `.github` and `academorix-legacy` (leader, 2026-11-01).
- Q: Which credential reads the other repos? → A: the stackra-bot App, with the same repository secrets release.yml
  passes today, given only inside the `linear-sync` environment; the figentra-ci-deploy identity is the shared deploy
  identity and is not reused. Moving both workflows to Infisical prod `/ci/release` is STA-1827 (leader, 2026-11-01).
- Q: Where is the cursor kept? → A: nowhere; it is a lookback window (`--since`). Idempotency comes from the markers,
  so overlapping nightly windows repeat nothing.
- Q: Can the repo list live in `figentra-flow.config.json`? → A: not now; that file's schema is Flow's. Proposed to
  Flow as `tracker.repos` when the command moves to the figentra CLI (ADR 0500 d4), follow-up STA-1824.

## Status history

- 2026-11-01 → Clarified (leader brief)
