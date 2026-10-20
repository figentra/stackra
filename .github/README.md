# `.github/`

GitHub configuration for the repository. GitHub is the only code host
([ADR 0012](../apps/docs/src/adr/0012-code-host-and-ci.mdx)).

| Path                       | Holds                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [`workflows/`](workflows)  | CI (the `Quality Gate`), release and Linear sync                                                                |
| `pull_request_template.md` | the PR body: summary, Linear key, spec, lane and change risk, verification checklist                            |
| `CODEOWNERS`               | the default owner; review is advisory (0 required approvals)                                                    |
| `branch-protection.json`   | the `main` protection rules, as a GitHub REST payload: `Quality Gate` required, linear history, no force pushes |
| `social-preview.png`       | the repository's social preview image                                                                           |
| `NOTICE`                   | `social-preview.png` is a brand image, all rights reserved, not MIT                                             |

## Rules

- `Quality Gate` is the only required check. Merges are squash merges through `pnpm pr:merge`, which also needs the
  head commit's `AI-REVIEW: PASS` from a reviewer other than the author
  ([ADR 0119](../apps/docs/src/adr/0119-merge-policy-and-release-authority.mdx)). Never `--admin`, never a push to
  `main`.
- A PR's branch is Linear-named (`figentra/sta-<n>-<slug>`) and its title or branch names the STA key, or it carries
  the `chore-lane` label; `pnpm linear check-pr` enforces it in CI.
- Changes here are CI and permission changes, change risk R3
  ([ADR 0120](../apps/docs/src/adr/0120-sdlc-spec-location-lanes-and-change-risk.mdx)).
- `branch-protection.json` stays strict JSON (`MUST_STAY_JSON`).
