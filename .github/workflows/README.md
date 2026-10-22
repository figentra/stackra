# `.github/workflows/`

| Workflow            | Runs on                                                                                       | Does                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`            | pull requests to `main` (including ready for review), pushes to `main`                        | **Quality Gate**: install, Linear key check, format check, lint, typecheck, test, build, `pnpm validate`, `pnpm boundaries`, `pnpm knip`, `pnpm secrets:scan`, `pnpm agents:check`. `deploy-staging` is a placeholder that deploys nothing until a deploy target is decided                                                                                      |
| `release.yml`       | pushes to `main`                                                                              | Changesets: opens or updates the "version packages" PR as `stackra-bot`, publishes released packages to npmjs with provenance through npm trusted publishing (GitHub OIDC, no token), and uploads a CycloneDX SBOM. Waits for the owner's approval of the `release` environment                                                                                  |
| `deploy-static.yml` | pushes to `main` touching `workers/static/**` or `tools/schemas/**`, `schemas@*` tags, manual | Tests and builds `workers/static`, then `wrangler deploy` of the `stackra-static` Worker (static.stackra.figentra.com) with `CLOUDFLARE_API_TOKEN` from Infisical `/ci` over OIDC; skips the deploy with a notice until `INFISICAL_CI_IDENTITY_ID` is set ([ADR 0284](../../apps/docs/src/adr/0284-hosted-static-files-one-cloudflare-static-assets-worker.mdx)) |
| `linear-sync.yml`   | nightly, pushes to `main`, manual (with dry run)                                              | `tools/scripts/linear-reconcile.mjs`: moves Linear issues to match merged and open PRs, closes decided ADR issues and labels stale work. Never fails the run                                                                                                                                                                                                     |

## Rules

- Least privilege ([ADR 0019](../../apps/docs/src/adr/0019-supply-chain-hardening.mdx) D2): `permissions` at the
  workflow is read-only or empty, and a job asks only for what it needs.
- No token is a repository secret: CI logs in to Infisical by GitHub OIDC for one step and reads `/ci` only
  ([ADR 0009](../../apps/docs/src/adr/0009-secrets-two-mechanisms.mdx)).
- Third-party actions are pinned to a commit SHA, with the version in a comment.
- The toolchain comes from `mise.toml`, so CI runs the same versions as a contributor.

Runbooks: [CI](../../apps/docs/src/runbooks/ci.mdx), [release](../../apps/docs/src/runbooks/release.mdx).
