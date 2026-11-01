# Implementation Plan: linear reconcile reads merged work from every figentra repo

**Spec**: `spec.md` · **Linear**: STA-1822 · **Branch**: `figentra/sta-1822-reconcile-all-repos`

This Mac runs only oxfmt, oxlint and `node --test` on the script's own tests; nothing runs against Linear or GitHub.

| Step | What                                                                                         | Gate                            |
| ---- | -------------------------------------------------------------------------------------------- | ------------------------------- |
| 1    | `linear-reconcile.repos.yaml`; `--repos`, `--since`, `--max-pages` flags                     | `linear-reconcile.test.mjs`     |
| 2    | Injected per-repo fetchers: merged PRs, open PRs, main commits; per-repo failure is reported | `linear-reconcile.test.mjs`     |
| 3    | `prKeys` closes on branch, title, Refs/Fixes/Closes/Resolves; commits become merged work     | `linear.test.mjs`, the new test |
| 4    | Repo-qualified marker tags outside the core repo                                             | `linear-reconcile.test.mjs`     |
| 5    | `linear-sync.yml` mints an org-wide read-only App token, falling back to `github.token`      | review (release-operations)     |
