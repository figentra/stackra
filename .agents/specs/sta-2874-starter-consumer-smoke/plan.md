# Implementation Plan: @stackra/starter in the fixed group, and `latest` only after a clean-consumer create

**Spec**: `.agents/specs/sta-2874-starter-consumer-smoke/spec.md` · **Linear**: STA-2874 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2874-starter-consumer-smoke/spec.md`

## Summary

A new member `packages/developer/starter` builds `dist/template.tgz` from the stackra-template commit it pins and is
released with every `@stackra/*` version. The CLI's `starterTarball` reads that nested archive. `runway-npm.yml` gains
`promote-latest-after` and `consumer-smoke`; with the smoke, the release job writes the dist-tag moves instead of
making them, a `consumer-smoke` job with no credential runs the command, and a `promote` job moves the tags after it. `release.yml` reads the mode from `runway.yaml` and passes
`node tools/scripts/consumer-smoke.mjs`, which runs the documented `npx … create` at the release's version.

## Technical Context

- **Language**: JavaScript (ESM, Node built-ins) for the build and the smoke; TypeScript for the CLI and runway
  changes; bash in the workflows
- **Members**: `packages/developer/starter` (new), `packages/developer/cli`, `packages/developer/runway`,
  `tools/scripts`, `.github/workflows`
- **Testing**: vitest (starter, cli, runway); `node --test` (`tools/scripts/__tests__`, run by `pnpm validate`)
- **Storage**: none
- **Runtime target**: three jobs on `ubuntu-latest` (git, Docker, yq, jq on the image; node and pnpm from mise)

## Constitution Check

| Law                                   | Result | Note                                                                          |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the starter imports nothing; the CLI reads bytes only                         |
| Secrets (ADR 0009)                    | PASS   | none; the smoke runs in its own job, which holds no credential                |
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
- **P-006**: with the smoke, the release job writes no dist-tag and runs no smoke, and across the jobs the order is
  last publish < smoke < first dist-tag write — Validates: AC-006
- **P-007**: a failing smoke leaves `{ "release-pending": "1.0.0" }` on every package; re-running the smoke and then
  `promote` moves `latest` without publishing again — Validates: AC-007
- **P-008**: the smoke's environment keys are exactly HOME, LANG, PATH, RUNWAY_REGISTRY, RUNWAY_RELEASE, with an empty
  HOME; the `consumer-smoke` job has no environment, `id-token`, secret or App token and `cache: false`, and the
  release job's script holds no `env -i` and never runs the command — Validates: AC-008
- **P-009**: missing command, empty mode and `later` stop with nothing published; `immediate`, nothing to move and
  the dry run run no smoke — Validates: AC-009
- **P-010**: the core smoke's argv, cwd, environment and checks, against a stand-in registry and tools — Validates:
  AC-010
- **P-011**: the gate step returns `consumer-smoke` for core's runway and an unset key, `immediate` when set, and
  stops on `later` (run with mikefarah yq 4.47.1); release.yml passes both inputs — Validates: AC-011
- **P-012**: `promote` moves nothing for a plan whose sha256 is not the release job's output (a downgrade written in
  its place), for a missing or malformed sha256, and for a line whose tag is not a tag — Validates: AC-012

## Architecture overview

```text
version PR merge ─▶ release.yml gate (reads runway.yaml release.npm.promoteLatestAfter)
                     └─▶ runway-npm.yml
  release job (environment release, id-token, App token)
    plan ─▶ pack + verify every package ─▶ closure (plan) ─▶ publish under release-pending ─▶ closure (registry)
    ─▶ moves
       immediate, or no move sets a tag ─▶ move the tags here
       consumer-smoke ─▶ registry-promotion artifact (moves.tsv, release.tsv); outputs promotion-due, sha256
  consumer-smoke job (no environment, contents: read, no secret, no cache)       needs: release
    env -i … bash -c "$CONSUMER_SMOKE" ─▶ node tools/scripts/consumer-smoke.mjs
       registry serves @stackra/cli and @stackra/starter at the version ─▶ npx … create demo --yes ─▶ app checks
  promote job (environment release, id-token only, nothing checked out)          needs: release, consumer-smoke
    sha256(moves.tsv) == release output ─▶ each line checked ─▶ per package: ID token ─▶ publish token ─▶ dist-tags
```

`stackra create` (the CLI) fetches `@stackra/starter` at its own version; the starter's `dist/template.tgz` is the
stackra-template commit `package.json` pins, built by `scripts/build-starter.mjs` and published with every release.

## Components and responsibilities

- `@stackra/starter` (`packages/developer/starter`): holds the template pin; `build-starter.mjs` fetches the pinned
  commit, refuses what `create` cannot write, and packs every tracked file to `dist/template.tgz`, the same bytes for
  the same commit; `--bump` moves the pin.
- `@stackra/cli` `starterTarball`: reads the nested archive, refuses a path that climbs out, and keeps reading the two
  older layouts.
- `@stackra/runway` root schema: `release.npm.promoteLatestAfter` (`consumer-smoke` | `immediate`), in the canonical
  schema, the package's copy and `RELEASE_SECTION_SCHEMA`.
- `runway-npm.yml` `release` job: checks the mode before packing; with `consumer-smoke` writes the moves rather than
  making them, and hands their sha256 on as a job output.
- `runway-npm.yml` `consumer-smoke` job: the clean consumer, on a runner with no credential; its exit status is all
  it hands on.
- `runway-npm.yml` `promote` job: moves the release job's moves after the smoke, and nothing else.
- `release.yml` gate: reads the mode from `runway.yaml` and passes it with `node tools/scripts/consumer-smoke.mjs`.
- `tools/scripts/consumer-smoke.mjs`: the documented create at the release's version, then the app's checks.

## Files and folders

```text
.github/workflows/
├── runway-npm.yml
├── release.yml
└── README.md
apps/docs/
├── scripts/architecture-map/architecture-map.yaml
├── src/assets/architecture-map.html
└── src/docs/runbooks/release.mdx
packages/developer/
├── starter/
│   ├── package.json
│   ├── scripts/build-starter.mjs
│   ├── vitest.config.ts
│   ├── turbo.jsonc
│   ├── tsconfig.json
│   ├── README.md
│   ├── AGENTS.md
│   ├── CHANGELOG.md
│   └── LICENSE
├── cli/src/node/create/functions/starter-tarball.function.ts
└── runway/
    ├── src/core/constants/release-section-schema.constant.ts
    ├── schema/root.json
    ├── README.md
    └── AGENTS.md
tools/
├── schemas/runway-root.schema.json
└── scripts/consumer-smoke.mjs
runway.yaml
```

Tests beside each in `__tests__/` (`build-starter.test.mjs`, `create.test.ts`, `parse-runway.function.test.ts`,
`registry-publish.test.mjs`, `consumer-smoke.test.mjs`); `.changeset/starter-fixed-group-consumer-smoke.md`;
`pnpm-lock.yaml`.

## Data models and migrations

none

## Contracts

- `@stackra/starter`: a published package with no entry point; its tarball holds `dist/template.tgz` (entries under
  `package/`), README, CHANGELOG and LICENSE.
- `runway-npm.yml` inputs `promote-latest-after` (default `consumer-smoke`) and `consumer-smoke` (a shell command);
  the `release` job's outputs `promotion-due` and `promotion-sha256`; the artifact `registry-promotion` (`moves.tsv`:
  name, version, tag or `-`, `drop` or `-`; `release.tsv`: name, version).
- The smoke command's environment: PATH, LANG, HOME (new, empty), RUNWAY_REGISTRY, RUNWAY_RELEASE.
- The root runway schema key `release.npm.promoteLatestAfter`.
- No action, query, event or API.

## Error handling

- Before anything is packed: a mode that is neither value, or `consumer-smoke` with no command, stops the run with
  nothing published (`Consumer smoke not set` in the runbook).
- `consumer-smoke` job: no release list or no command stops it; a non-zero command exit is `Consumer smoke failed`;
  every version stays under `release-pending` and `promote` does not run. Re-run the failed jobs for a runner cause;
  otherwise fix on `main` and release again.
- `promote` job: a sha256 that differs from the release job's output, a missing one, or a malformed line stops it
  before the first move; a dist-tag write is retried three times, then `Dist-tag not moved` names it, and a re-run
  repeats the idempotent moves.
- Starter build: every refusal of AC-002 exits non-zero with the reason and leaves no `dist/template.tgz`.

## Security and tenancy

- No tenant data. Secrets: none added; publishing stays GitHub OIDC exchanged per package (ADR 0453 decision 6).
- The smoke's downloaded code runs only in the `consumer-smoke` job: no environment, no `id-token`, no secret, no App
  token, a `GITHUB_TOKEN` that reads contents only (the repository is public), `persist-credentials: false` and
  `cache: false`, so it can neither mint a registry token nor push, and leaves no cache a later job restores.
- `promote` trusts only the release job: the moves' sha256 travels as a job output, which no step of the smoke job can
  set, and each line is checked before any token is asked for. It checks out, installs and restores nothing.
- The starter pin is a full commit id checked after the fetch; symlinks, submodules and climbing paths are refused.

## Testing strategy

- `node --test tools/scripts/__tests__/registry-publish.test.mjs`: the three scripts cut out of the workflow and run
  against a stand-in registry (AC-006 to AC-009, AC-012: P-006 to P-009, P-012), and the jobs' permissions, needs and
  conditions read from the workflow text.
- `node --test tools/scripts/__tests__/consumer-smoke.test.mjs`: the smoke's checks and argv against stand-in tools
  (AC-010, P-010).
- Vitest: `packages/developer/starter` (AC-001 to AC-003), `packages/developer/cli` `create.test.ts` (AC-004),
  `packages/developer/runway` `parse-runway.function.test.ts` (AC-005).
- The gate step with mikefarah yq (AC-011, P-011); actionlint and zizmor on the workflows.
- The first real run is the next release: the smoke stays red until the create path works from the registry.

## Rollout

1. This PR; no flag. Core's `runway.yaml` sets `consumer-smoke`.
2. The next version PR's merge publishes `@stackra/starter` with the fixed group; the owner approves the release job,
   then the `promote` job once the smoke is green. Until `stackra create` works from the registry end to end
   (STA-2794), the smoke fails and `latest` stays where it is; `immediate` in `runway.yaml` releases without it.
3. Later (the CTO's call): a registry publisher row for a reviewer-free promotion environment, so `promote` needs no
   second approval.
4. Template side: the template's own `starter` job is redundant and can be removed.
