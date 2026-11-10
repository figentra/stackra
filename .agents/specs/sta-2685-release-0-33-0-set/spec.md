# Feature Specification: release: the 0.33.0 set in one merge

**Feature Branch**: `figentra/sta-2685-release-0-33-0-set`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (decided under the owner's delegation, 2026-11-10)

**Linear**: STA-2685

**Clarifications status**: complete

**Input**: STA-2663 (0.33.x). `main-protection` requires a branch to be up to date with main before it merges
(`strict_required_status_checks_policy`), so merging the nine reviewed pull requests of the 0.33.0 set one by one
would take nine serial gate runs. This branch merges all nine, in the leader's order, onto main, so one gate run
covers the set and the owner merges it once. Each of the nine already had main merged in and a green Testbed gate
dry-run; their own specs, plans, changesets and tests come in unchanged.

### Sources

- stackra#1026 (STA-2682), #986, #988, #991, #987, #989, #1016 (STA-2669), #1012, #1019 (STA-2673)
- the leader's plan of 2026-11-10 (one combined PR; the nine closed as merged via it)

## The set, in merge order

| PR    | Branch                                   | Title                                                                                      |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| #1026 | figentra/sta-2682-pr-merge-adr-0523      | fix(scripts): pr:merge merges by the gate and the ruleset, as ADR 0523 decided             |
| #986  | figentra/iam-test-scope-default          | feat(iam): test user actors act in TEST_SCOPE_ID by default                                |
| #988  | figentra/gen-api-client-route            | fix(gen): an api_client actor gets an endpoint                                             |
| #991  | figentra/testing-memory-drivers          | fix(actions,gen): memory rate-limit and job drivers for tests; seeders' services are wired |
| #987  | figentra/gen-well-known-public-path      | fix(gen): accept a public call under /.well-known/ in the area check                       |
| #989  | figentra/gen-i18n-contract-once          | fix(gen): a consumed service's namespace its contract also ships is taken once             |
| #1016 | figentra/sta-2669-config-driver-defaults | fix(config,contracts): the signer and secret-store drivers are chosen by config            |
| #1012 | figentra/repo-checks-eval-json           | fix(repo-checks): a prompt's eval dataset stays .eval.json                                 |
| #1019 | figentra/sta-2673-tenant-key-provider    | feat(tenancy): a per-tenant KeyProvider a container can bind                               |

## Impact

- **Apps touched**: as the nine pull requests touch them; nothing beyond their diffs
- **Services touched**: as the nine pull requests touch them
- **Packages touched**: as the nine pull requests touch them (gen, config, contracts, tenancy, iam, actions, repo-checks)
- **Public contract change**: the nine pull requests' own, each with its changeset
- **Cross-service events**: none beyond the nine
- **Tenancy and data**: #1019's per-tenant KeyProvider and #986's test scope, as reviewed there
- **Security and privacy**: #1026's merge condition, #1016's signer and secret-store selection, as reviewed there
- **Secrets**: none
- **ADR needed**: no; the nine carry their own ADR notes (ADR 0119 in #1026)
- **New dependencies**: none beyond the nine
- **Deploy modes**: as the nine
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: none beyond the nine
- **Lane**: full
- **Change risk**: R2 (the highest of the nine)

## Acceptance criteria

- **AC-001**: THE branch SHALL contain each of the nine pull requests' heads, merged in the order above with
  `chore: merge <branch>` commits, and nothing else but this spec folder.
- **AC-002**: WHEN the branch's gate runs THE Quality Gate SHALL be green on its head before it is marked ready.
- **AC-003**: THE pull request body SHALL list the nine pull requests with their heads and their Testbed dry-run
  results, and the combined dry-run's.

## Status history

- 2026-11-10 → Clarified (leader: one combined PR; new key, not the umbrella)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10
- 2026-11-10 → Tasked (tasks.md)
