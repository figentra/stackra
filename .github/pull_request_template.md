## Summary

<!-- What changed and why, in a few lines. -->

Linear: STA-

<!-- The issue this closes or advances (`Fixes STA-n` moves it to Done on merge). A chore with no issue gets the
`chore-lane` label instead. CI fails when the branch is not Linear-named (`figentra/sta-n-<slug>`, from the
issue's "Copy git branch name") or when neither the title nor the branch names an STA key. -->

Spec: <!-- .agents/specs/sta-n-<slug>/, or "none" (chore and bug lanes) -->

Lane: <!-- full | lite | bug | chore (ADR 0120) --> · Change risk: <!-- R0 | R1 | R2 | R3; R3 and design PRs need the owner's approval -->

## Verification

- [ ] `pnpm verify` green
- [ ] Linear issue in the right state (`pnpm linear review STA-n <this PR url>`)
