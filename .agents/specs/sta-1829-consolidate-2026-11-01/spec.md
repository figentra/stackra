# Consolidate every core branch into main (2026-11-01)

**Linear**: STA-1829
**Status**: implementing
**Clarifications status**: complete

## Decision

The owner decided on 2026-11-01 to merge every branch, PR and local commit of core into main in one consolidation
pull request, merged by the owner with `--admin`. Main may go red; it is built, tested and fixed afterwards on the
testbed. The rollback point is origin/main `ff636501456fed766f481462d866e191bc3f3e5c` (tag
`pre-consolidate-2026-11-01`, local).

## Scope

- Candidates: every ref whose patches are not on main, reduced to leaves (tips no other candidate contains), plus the
  open PR heads (#184, #185, #186).
- Base: `land/031-stack`, then the three 0.3.2 leaves that contain `land/032-stack`; every other branch merges on top,
  oldest tip first.
- One version per piece of work: the newest complete copy merges; older copies are listed as superseded, and a commit
  only an older copy carries is cherry-picked.
- Excluded and listed in the PR body: `changeset-release/*`, branches whose content is already on main or in the
  trains, `tw-core-1..8`, `fx-perms-option-b-wip`, `c6/showcase-with-pro-a642a97`, `figentra/sta-666-app-shells`
  (for the Runway session to mine).
- `figentra/sta-1823-tenant-from-scope` (2d3ebcfe) merges but must not ship in a release until its blockers B1 and B2
  are fixed.

## Rules

- A conflict resolution combines both sides' intent: the newer side wins where both change the same thing, and an
  addition from either side is kept. Generated files keep the released versions; lockfiles take the newer side and are
  regenerated on the testbed.
- No installs, builds, tests or typecheck on the Mac. Never push to main, force-push, delete refs or stash.

## Acceptance

- One PR into main from `figentra/sta-1829-consolidate-2026-11-01` with tables of merged, superseded and excluded
  branches and of the conflicts resolved.
- `git grep` finds no conflict markers and `git diff --check` is clean after each merge.

## Impact

- **Apps touched**: console, mobile, docs, playground (through the merged branches)
- **Services touched**: example, health (through the merged branches)
- **Packages touched**: many, through the merged branches; this change authors only conflict resolutions
- **Cross-service events**: none added by this change
- **Tenancy and data**: STA-1823 tenant-from-scope merges as WIP, flagged not to release until B1/B2 are fixed
- **Secrets**: none
- **ADR needed**: no; it records the owner's decision of 2026-11-01
- **New dependencies**: none beyond those the merged branches carry
- **Deploy modes**: none; nothing deploys or publishes
- **Licence tier**: free
- **Docs to update**: the ADR index and numbers.yaml where merges add ADRs
- **Lane**: full
- **Change risk**: R3, main may go red by owner decision
