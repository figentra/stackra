# Specification: merge stewards, bot approval and auto-merge without `--admin`

**Feature Branch**: `figentra/sta-1856-merge-stewards`

**Created**: 2026-11-01

**Status**: Planned

**Linear**: STA-1856

**Clarifications status**: complete

**Input**: Owner decision 2026-11-01. The owner no longer runs every `gh pr merge --admin`. Instead (1) a GitHub App
gives the required approving review, (2) the merge happens once the required checks pass, through `pnpm pr:merge`
and never `--admin`, and (3) a new `git-steward` agent decides when to trigger both. The owner also approved two more
agents: `ci-steward`, which turns red CI into root-cause fix PRs, and `linear-steward`, which keeps Linear in step
with what landed (about 346 issues sit In Progress).

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: the workflow references `STACKRA_BOT_APP_ID` and `STACKRA_BOT_PRIVATE_KEY` by name only, as secrets of
  the `pr-approval` environment, which allows `main` only. The owner sets the values. No agent reads or types a key.
- **ADR needed**: no new ADR. ADR 0119 gets an amendment: the `review` ruleset requires one approval, the approving
  App gives it through `pr-approve.yml`, and owner-only paths still wait for the owner.
- **New dependencies**: none (`actions/create-github-app-token`, already pinned in `linear-sync.yml`)
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: `.agents/agents/README.md` roster, ADR 0119 amendment, `.github/workflows/README.md`
- **Lane**: lite
- **Change risk**: R2. A new identity can approve PRs, so the bot's approval decides which PRs merge without the owner.

## Requirements

- **FR-001** `git-steward` asks for approval and merge only when every required check is green, the reviewer
  verdicts the change needs are PASS on the head, and the PR touches no owner-only path. It never uses `--admin`
  and merges only through `pnpm pr:merge`. It also owns stacked-PR retargeting, clean-up of merged branches and
  worktrees (`git worktree remove` without force, after checking for ignored files), and folder moves with
  `git worktree repair`.
- **FR-002** `ci-steward` reads a failing run, finds the root cause and fixes it in a PR. It never weakens a check to
  make the run pass.
- **FR-003** `linear-steward` moves an issue to Done once its PR has merged, and reports drift. It never closes an
  issue that has no merged PR.
- **FR-004** `.github/workflows/pr-approve.yml` takes a PR number by `workflow_dispatch` (in core) or `workflow_call`
  (in another figentra repo). It approves the PR, pinned to the head SHA it checked, only when all of these hold:
  the PR is open and not a draft; the head is in the same repository; the head is the SHA the caller expected; the
  author is not the approving App; the PR has no `design` or `risk:R3` label; every changed path, including the old
  path of a rename, is outside the owner-only list; and every required check passed or was skipped, with at least
  one passing. A refused PR gets one comment that gives the reasons.
- **FR-005** The owner-only list is defined once, in the workflow. It covers production deploy, promote and release
  workflows (every file under `.github/workflows` and `.github/actions`), secrets and the secret guards, the
  `catalog:` entries (`pnpm-workspace.yaml`), repo settings and branch protection (`.github/rulesets`, the branch
  protection file, CODEOWNERS), and billing or legal files. The workflow checks itself against sample paths before
  it uses the list, and stops if any sample is classified wrongly.
- **FR-006** `~/.local/bin/merge-queue` is left in place. The plan describes a replacement without `--admin`.

## Status history

- 2026-11-01 → Clarified (owner decision relayed by the leader session)
- 2026-11-01 → Planned
