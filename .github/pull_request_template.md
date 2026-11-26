## Summary

<!-- What changed and why, in a few lines. Link the GitHub issue it fixes, if any. -->

Linear: STA-

<!-- The issue this closes or advances (`Fixes STA-n` moves it to Done on merge). An outside contributor uses the key a
maintainer gave on the GitHub issue, or leaves this line as it is: a maintainer fills it in or adds the `chore-lane`
label (CONTRIBUTING.md, "Pull requests"). CI fails when the branch is not Linear-named (`figentra/sta-n-<slug>`, from
the issue's "Copy git branch name") or when neither the title nor the branch names an STA key, unless the pull request
carries `chore-lane`. -->

Spec: <!-- .agents/specs/sta-n-<slug>/, or "none" (chore and bug lanes); maintainers fill this in for outside pull requests -->

Lane: <!-- full | lite | bug | chore (ADR 0120) --> · Change risk: <!-- R0 | R1 | R2 | R3; R3 and design PRs need the owner's approval -->

## Verification

<!-- The commands you ran, for example `pnpm --filter @stackra/<name> test`. -->

- [ ] Tests, typecheck and lint pass for the members I changed, and `pnpm format:check` passes
- [ ] A package change carries a changeset (`pnpm changeset`)
- [ ] `pnpm verify` green (maintainers: on the box, `needs-testing`)
- [ ] Linear issue in the right state (maintainers: `pnpm linear review STA-n <this PR url>`)
