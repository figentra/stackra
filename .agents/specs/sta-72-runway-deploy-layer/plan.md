# Implementation Plan: Runway deploy layer (wave R)

**Spec**: `.agents/specs/sta-72-runway-deploy-layer/spec.md` · **Linear**: STA-72 · **Date**: 2026-10-25

## Summary

Runway already has its config layer (`@stackra/runway`: the v3 schemas, `parseRunway`, `checkPlacement` and the
readers). This change adds the deploy layer that needs no gen output, in the owner's order:

1. **Runway check in `pnpm validate`.** `checkRunwayFiles` in `tools/scripts/validate-repository.mjs` maps each
   `runway.yaml` to its kind by path, parses it with `yaml` (duplicate keys refused), and hands it to the built
   `@stackra/runway` (`parseRunway`, then `checkPlacement` for the root against the `services/<name>` members). The
   runway API is passed in, so the tests use a stub and need no build.
2. **Core runway files.** `runway.yaml` at the root (providers, `dev` and `production`, the `cloudflare-workers`,
   `mintlify` and `npm` targets each naming its caller workflow, the CI secret names, the release policy) and
   `apps/docs/runway.yaml`.
3. **Reusable workflows.** `runway-cloudflare-workers.yml`, `runway-npm.yml` and `runway-mintlify.yml`, each a
   `workflow_call` workflow whose job takes its GitHub environment from an input (only a called workflow can), reads
   one credential per step over Infisical OIDC, and skips with a notice while its identity is unset.
   `deploy-static.yml`, `release.yml` and the new `deploy-docs.yml` become thin callers. Released as `runway-v<n>`.
4. **Hardening.** actionlint, zizmor (`.github/zizmor.yml`: hash pins everywhere) and OSV-Scanner in the Quality Gate,
   pinned in `mise.toml`; Trivy (filesystem scan before publish) and cosign (keyless SBOM signature) in
   `runway-npm.yml` through `mise exec`; `.github/rulesets/release-tags.json` for the owner to apply.
5. **The command shape.** the `runway` binary of `@stackra/runway` (`pnpm runway`): `plan <env>` (names only), `deploy <target>` and
   `promote <sha>` with a clean-commit preflight that dispatch the caller workflow; a `runway-deploy` owner ask in
   the guard.
6. **The sync design.** `apps/docs/src/docs/runbooks/runway.mdx`: the workflows, the command, the secrets and vars sync, the
   blocked parts and the owner steps.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                             |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | repository scripts and workflows only; the validator imports the built `@stackra/runway` entry by path and no member imports anything new        |
| Secrets (ADR 0173)                    | PASS   | names only in git; each value reaches one step over OIDC; the bootstrap token is opt-in and written to the runner's `~/.npmrc` by reference only |
| Security                              | PASS   | `permissions: {}` at every workflow, job-level grants only; SHA pins checked by zizmor; a SHA not on main is refused before a credential is read |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                     |
| Tenancy                               | N/A    | no tenant data                                                                                                                                   |
| Delegation                            | PASS   | infra route for workflows and scripts, tests route for the test files; a separate reviewer in the STA-597 pass                                   |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; Pulumi stays with STA-590                                                                                    |
| Test placement (ADR 0022)             | PASS   | `tools/scripts/__tests__/validate-repository.test.mjs` and `tools/scripts/__tests__/runway.test.mjs`                                             |
| Versions and catalogs                 | PASS   | no `package.json` dependency added; CI tools pinned exactly in `mise.toml` or in the workflow that uses them                                     |
| Deploy modes (ADR 0076)               | PASS   | CI and release only                                                                                                                              |
| Licence tier (ADR 0077)               | PASS   | MIT; the reusable workflows are public (ADR 0168 decision 1)                                                                                     |
| Docs and ADRs                         | PASS   | Runway runbook, deploys runbook and workflows README; the ADRs stand                                                                             |

## Deploy modes

| Mode       | Behaviour                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------- |
| SaaS       | unchanged at runtime; Stackra's own static Worker, docs and packages deploy through the workflows |
| On-prem    | unchanged; nothing here ships in an on-prem bundle                                                |
| Air-gapped | unchanged; the runway check reads local files only and makes no network call                      |

## Correctness properties

- **P-001**: a runway file at the root, under `apps/` or `workers/`, under `services/`, or in a scaffold template is checked for its kind, each issue naming file, path and message; any other `runway.yaml` is a finding — Validates: FR-001
- **P-002**: the root runway's placement issues are findings naming environment and code, and member runways never reach `checkPlacement` — Validates: FR-002
- **P-003**: with no built runway entry the check is one finding under `CI` and a stderr notice otherwise — Validates: FR-003
- **P-004**: `runway.yaml` and `apps/docs/runway.yaml` pass their v3 schemas and hold no secret value — Validates: FR-004
- **P-005**: `runway-cloudflare-workers.yml` has only `workflow_call`, reads `CLOUDFLARE_API_TOKEN` in one step, refuses an off-main SHA before that step and skips with a notice without an identity — Validates: FR-005
- **P-006**: `runway-npm.yml` publishes through trusted publishing, reads the bootstrap token only when asked, blocks the publish on a fixable critical Trivy finding and signs the SBOM it attaches — Validates: FR-006
- **P-007**: `runway-mintlify.yml` runs the three mint checks before a deploy, polls the update to a terminal status and smoke-tests the pages; the Quality Gate runs `mint a11y` — Validates: FR-007
- **P-008**: the Quality Gate runs actionlint, zizmor with `hash-pin` for every `uses:` and OSV-Scanner on the lockfile — Validates: FR-008
- **P-009**: `release-tags.json` covers `runway-v*`, `schemas@*` and the package tags with update and deletion rules — Validates: FR-009
- **P-010**: `runway` refuses a dirty tree, an unpushed commit or a SHA not on `origin/main` before it dispatches, prints the SHA, and `plan` prints names only — Validates: FR-010
- **P-011**: the runbook states the sync source, identities, write paths, plan and blocked parts — Validates: FR-011
- **P-013**: `stackra runway --help` lists exactly the nine commands and the interim `runway` binary folds into it — Validates: FR-013
- **P-014**: a conformance suite runs plan, apply, verify and rollback against every provider with a fake target — Validates: FR-014
- **P-015**: `infra preview` against a fake Pulumi workspace prints the plan and never applies; `infra up` is a guard ask — Validates: FR-015
- **P-016**: no workflow under `.github/workflows` deploys without calling the Runway CLI (validator check) — Validates: FR-016
- **P-017**: each command that changes an environment writes exactly one record per destination — Validates: FR-017
- **P-018**: gen's sources import nothing from `@stackra/runway/node` deploy code, and `deploy` calls gen before any provider — Validates: FR-018
- **P-019**: the MCP server lists the four read tools without approval and the four write tools behind approval; the `runway` skill names only CLI commands, never raw provider calls — Validates: FR-019
- **P-012**: the runbook states the `runway-v<n>` tag rule and the SHA pin for external callers — Validates: FR-012
