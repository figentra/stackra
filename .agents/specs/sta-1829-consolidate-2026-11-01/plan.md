# Plan: consolidate every core branch into main (STA-1829)

1. Fetch, record origin/main `ff636501` as the rollback point, and work only in
   `.claude/worktrees/consolidate-2026-11-01` on `figentra/sta-1829-consolidate-2026-11-01`.
2. Recompute the leaves from the current refs; for each, count the commits whose patch-id and subject are not on main
   or in the trains, and trial-merge it with `git merge-tree` to see what it would still change.
3. Merge the base: `land/031-stack`, then `figentra/sta-1629-docs-032`, `figentra/sta-1685-test-timeouts-032` and
   `figentra/sta-1694-defaulted-input-032`.
4. Merge the remaining branches oldest tip first with `git merge --no-ff --no-verify --no-edit`; resolve each conflict
   by combining both sides' intent; check for markers and `git diff --check`; commit with `--no-verify`.
5. Cherry-pick the novel tip commits of branches whose base is an older copy of the trains.
6. Push the branch as HEAD and open the PR with the merged, superseded, excluded and conflict tables; report to the
   leader.
