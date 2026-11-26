# Implementation Plan: @stackra/starter in the fixed group, and `latest` only after a clean-consumer create

**Spec**: `.agents/specs/sta-2874-starter-consumer-smoke/spec.md` · **Linear**: STA-2874 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2874-starter-consumer-smoke/spec.md`

## Summary

A new member `packages/developer/starter` builds `dist/template.tgz` from the stackra-template commit it pins and is
released with every `@stackra/*` version. The CLI's `starterTarball` reads that nested archive. `runway-npm.yml` gains
`promote-latest-after` and `consumer-smoke`, and its registry script runs the smoke with a scrubbed environment between
the registry closure check and the first dist-tag write. `release.yml` reads the mode from `runway.yaml` and passes
`node tools/scripts/consumer-smoke.mjs`, which runs the documented `npx … create` at the release's version.

## Technical Context

- **Language**: JavaScript (ESM, Node built-ins) for the build and the smoke; TypeScript for the CLI and runway
  changes; bash in the workflows
- **Members**: `packages/developer/starter` (new), `packages/developer/cli`, `packages/developer/runway`,
  `tools/scripts`, `.github/workflows`
- **Testing**: vitest (starter, cli, runway); `node --test` (`tools/scripts/__tests__`, run by `pnpm validate`)
- **Storage**: none
- **Runtime target**: the release job on `ubuntu-latest` (git, Docker, yq on the image; node and pnpm from mise)

## Constitution Check

| Law                                   | Result | Note                                                                          |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the starter imports nothing; the CLI reads bytes only                         |
| Secrets (ADR 0009)                    | PASS   | none; the smoke runs under `env -i` so no job token reaches downloaded code   |
| Security                              | PASS   | the pin is a commit id checked after the fetch; nested paths cannot climb out |
| HTTP and events                       | N/A    | none                                                                          |
| Tenancy                               | N/A    | none                                                                          |
| Delegation                            | PASS   | Claude only                                                                   |
| Not built yet (ADR 0011)              | PASS   | the first real smoke and starter publish happen on the next release           |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                                         |
| Versions and catalogs                 | PASS   | catalog devDependencies only; changesets for starter, cli and runway          |
| Deploy modes (ADR 0076)               | PASS   | release tooling, same in all three                                            |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                     |
| Docs and ADRs                         | PASS   | runbook, workflow README, member docs; ADR 0515 wording noted for #1129       |

## Deploy modes

| Mode       | Behaviour                                              |
| ---------- | ------------------------------------------------------ |
| SaaS       | release tooling only; no runtime change                |
| On-prem    | the same; an on-prem consumer fetches the same starter |
| Air-gapped | the same; the starter is one tarball on the registry   |

## Correctness properties

- **P-001**: building a fixture template packs every tracked file byte for byte, `.npmrc`, nested `.gitignore` and a
  tracked file `.gitignore` names included; the real build packs 292 files of the pinned commit — Validates: AC-001
- **P-002**: a branch, a short id or a non-URL pin, an unserved commit, a symlink, a submodule, no starter manifest
  and an `export-ignore` attribute each fail the build — Validates: AC-002
- **P-003**: two builds of one commit are byte-identical — Validates: AC-003
- **P-004**: `starterTarball` returns the nested archive's files whole and refuses `../` inside it — Validates: AC-004
- **P-005**: `parseRunway` accepts both modes and refuses `later`, `true` and a misspelt key; the derived schema equals
  the canonical one — Validates: AC-005
- **P-006**: with the smoke, the order is last publish < smoke < first dist-tag write — Validates: AC-006
- **P-007**: a failing smoke leaves `{ "release-pending": "1.0.0" }` on every package and the re-run moves `latest`
  without publishing again — Validates: AC-007
- **P-008**: the smoke's environment keys are exactly HOME, LANG, PATH, RUNWAY_REGISTRY, RUNWAY_RELEASE, with an empty
  HOME — Validates: AC-008
- **P-009**: missing command, empty mode and `later` stop with nothing published; `immediate`, nothing to move and
  the dry run run no smoke — Validates: AC-009
- **P-010**: the core smoke's argv, cwd, environment and checks, against a stand-in registry and tools — Validates:
  AC-010
- **P-011**: the gate step returns `consumer-smoke` for core's runway and an unset key, `immediate` when set, and
  stops on `later` (run with mikefarah yq 4.47.1); release.yml passes both inputs — Validates: AC-011
