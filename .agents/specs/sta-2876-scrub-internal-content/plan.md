# Implementation Plan: public repos and packages carry nothing internal

**Spec**: `.agents/specs/sta-2876-scrub-internal-content/spec.md` · **Linear**: STA-2876 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-2876-scrub-internal-content/spec.md`

## Summary

Every tracked file outside the CLI and the applied registry migrations is rewritten with neutral examples (acme,
bistro, `dev.example`, `/Users/me`) or neutral prose ("the academy product", "the dev zone"). Two pieces of behaviour
named internal infrastructure and become inputs: the pull-request preview zone (`pullRequestZone` in the root runway)
and the testbed's key pair (`keyPair`), and the testbed workflow reads its state bucket from the assumed account. A new
guard, `tools/scripts/guard-public-content.mjs`, keeps it so: its test reads the whole repository in `pnpm validate`,
and both release paths read every tarball before publishing.

## Technical Context

- **Language**: TypeScript (ESM) and Node scripts (`.mjs`), Node 24 (`mise.toml`); GitHub Actions YAML
- **Members**: packages/developer/runway, packages/infrastructure/infra-testbed (behaviour); the other touched members (examples and prose); tools/scripts; .github/workflows; apps/docs
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); `node --test tools/scripts/__tests__/*.test.mjs` (in `pnpm validate`)
- **Storage**: none
- **Runtime target**: libraries, CI scripts and workflows

## Key trade-off and research

- **Trade-off: hashes, not a word list.** A plain list of forbidden names in a public file would publish them. The
  guard keeps SHA-256 hashes with each term's length (so most words are skipped unhashed) and a reason. The cost: a
  reader cannot see what is denied, and a new term needs `--hash`. Substring matching is not possible on hashes, so
  hosts are checked by each dotted suffix and words whole.
- **Trade-off: a required zone over a default.** The old default zone was Figentra's own; any neutral default would
  publish previews under a domain the product does not own. A pull-request publish without the zone is refused.
- **Research**: the 0.33.1 tarballs from the Stackra registry; `pnpm pack --pack-destination` and the beforePacking
  hook; GNU tar long names; `actions/create-github-app-token`'s comma or newline `repositories`.

## Applicable standards

| Rule                                                   | How it is enforced                                             |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| No internal content in tracked files                   | check: `guard-public-content.test.mjs` in `pnpm validate`      |
| No internal content in tarballs                        | check: the tarball steps in `runway-npm.yml` and `release.yml` |
| No secret-shaped strings                               | check: gitleaks (lefthook, `pnpm secrets:scan`), unchanged     |
| Tests beside their subjects in `__tests__/` (ADR 0022) | check: the repository layout in CI                             |
| Workflows lint clean                                   | check: actionlint and zizmor in the Quality Gate               |
| Changesets for publishable packages                    | check: changeset status in CI                                  |

## Constitution Check

| Law                                   | Result | Note                                                               |
| ------------------------------------- | ------ | ------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import                                                      |
| Secrets (ADR 0009)                    | PASS   | no secret read or named; two variables hold names                  |
| Security                              | PASS   | personal and infrastructure data removed from public files         |
| HTTP and events                       | N/A    | no route or event                                                  |
| Tenancy                               | N/A    | no tenant data                                                     |
| Delegation                            | PASS   | not delegated                                                      |
| Not built yet (ADR 0011)              | PASS   | no rejected or deferred technology used                            |
| Test placement (ADR 0022)             | PASS   | every test in `__tests__/`                                         |
| Versions and catalogs                 | PASS   | no dependency added                                                |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                  |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                          |
| Docs and ADRs                         | PASS   | runbooks, READMEs updated; ADR prose scrubbed, decisions unchanged |

## Deploy modes

| Mode       | Behaviour                                                    |
| ---------- | ------------------------------------------------------------ |
| SaaS       | a product that publishes pull-request previews sets its zone |
| On-prem    | same                                                         |
| Air-gapped | same; the guard reads local files only                       |

## Correctness properties

- **P-001**: for any tracked file outside the allow list, the guard finds every whole denied word, every denied host suffix and every non-placeholder home folder in its path and text — Validates: FR-001, FR-002, FR-003
- **P-002**: the guard's source holds no denied term — Validates: FR-003, NFR-002
- **P-003**: a tarball is read file by file under its full path; an allowed package is skipped and no other — Validates: FR-004, FR-005
- **P-004**: no package is published unless its tarball passed the guard in the same job — Validates: FR-006
- **P-005**: a pull-request host is `<product>-pr-<n>.<zone>` for the product's own zone, and no zone means no publish — Validates: FR-008
- **P-006**: the launch template names the stack's key pair when given, else the default — Validates: FR-009

## Architecture overview

- `tools/scripts/guard-public-content.mjs`: `lineFindings`, `scanText`, `tarballFiles`, `scanTarball`, `readAllow`;
  the command reads `git ls-files` or the tarballs given.
- `tools/scripts/public-content.allow.json`: the exemptions.
- Release: `runway-npm.yml` step "Tarball check" (input `pack-check`), `release.yml` passes the guard; the prerelease
  job has its own step.
