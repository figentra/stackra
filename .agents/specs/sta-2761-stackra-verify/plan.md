# Implementation Plan: stackra/verify, main's gate run on our machines for every PR head

**Spec**: `.agents/specs/sta-2761-stackra-verify/spec.md` · **Linear**: STA-2761 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2761-stackra-verify/spec.md`

## Summary

A daemon (`tools/scripts/stackra-verify.mjs daemon`) polls open PR heads and main, builds the tested tree, and runs
main's Quality Gate step by step in rootless containers: installs through an allowlisting proxy with no scripts, PR
steps in writable containers, judges read-only from the judge image with the guard first in every Node process. It
posts `stackra/verify` from its own App; pr-merge reads it behind `VERIFY_ENFORCED`. This round fixes the judge
image's offline build (F1) and closes the judge code-execution gap (F2).

## Technical Context

- **Language**: JavaScript (ESM, Node 24), POSIX sh and bash for the generated container scripts
- **Members**: repository tooling (`tools/scripts`), `packages/developer/repo-checks`
- **Testing**: `node --test` in `tools/scripts/__tests__/` (ADR 0022); vitest in repo-checks
- **Storage**: run state and logs on the build box
- **Runtime target**: node on the build box; Docker (rootless) for every container

## Constitution Check

| Law                                   | Result | Note                                                              |
| ------------------------------------- | ------ | ----------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | tooling only; repo-checks gains one data entry                    |
| Secrets (ADR 0173)                    | PASS   | the App key stays a host file; no secret reaches a PR container   |
| Security                              | PASS   | judges run main's code only; PR code is sealed (no network, user) |
| HTTP and events                       | N/A    | no route or event                                                 |
| Tenancy                               | N/A    | no tenant data                                                    |
| Delegation                            | PASS   | one branch                                                        |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                            |
| Test placement (ADR 0022)             | PASS   | `__tests__/` beside the scripts and the constant                  |
| Versions and catalogs                 | PASS   | no workspace dependency added                                     |
| Deploy modes (ADR 0076)               | N/A    | internal CI service                                               |
| Licence tier (ADR 0077)               | PASS   | free                                                              |
| Docs and ADRs                         | PASS   | service header, tools/README.md, STATE.md, a changeset            |

## Deploy modes

| Mode       | Behaviour                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------ |
| SaaS       | none: stackra/verify runs on Stackra's own build box and gates this repository's PRs only        |
| On-prem    | none: no on-prem deployment ships or runs the service                                            |
| Air-gapped | none: no air-gapped deployment ships or runs it; its judges already run with no network (FR-002) |

## Correctness properties

- **P-001**: for any PR head with `VERIFY_ENFORCED` on, pr-merge passes condition 5 only when a passing `stackra/verify` run from the verify App is bound to that exact head SHA, after main's ci.yml steps ran in ci.yml's order — Validates: FR-001
- **P-002**: for any store image whose `pnpm fetch` ran as root, the judge image's install with no network succeeds as the judge user, and no rebuild leaves `node_modules/.pnpm-store` in the tree — Validates: FR-002
- **P-003**: every package under `packages/*/*/src/node/database/macros` is built in the judge image before main's gen runs — Validates: FR-003
- **P-004**: for any way node is started in a judge (PATH, the image's node, a clean environment, a fork), the guard is the first code to run, and `--run`, a config-file or a snapshot option before the script never starts node, also behind an option the scan does not know (it fails closed) — Validates: FR-004
- **P-005**: no text from the tested tree runs as code in a judge: a preload or loader that is not main's, `--env-file`, `--expose-internals`, an inline or stdin script (except where validate's mounted marker allows it) and, where code from strings is off, a compile with no file to check are each refused before they run — Validates: FR-005, FR-006
- **P-006**: the gate script reads the PR facts with `/in/facts-reader.cjs` and never starts `node -e` — Validates: FR-007

## Architecture overview

Store image (main's lockfile fetched, pinned tools) → judge image (main's tree installed offline, judges and macro
packages built, main's gen) → per job: the tested tree, the PR install (proxy, no scripts), the allowed builds, the
judge views, then one container per ci.yml step. Judges get `/in/bin/node` (the guarded node) first on PATH and over the
image's node, `/in/judge-guard.cjs` preloaded first, `/work` from a noexec read-only volume, and `/judge` read-only.

## Components and responsibilities

- `judgeDockerfile`: the judge image; copies root's pnpm metadata for the judge user, installs offline with
  `--cache-dir`, builds the judges and every macro package, runs main's gen (F1 a, c).
- `installCommands` / `REBUILD_COMMAND`: the two-part install; the rebuild names `--store-dir /store` (F1 b).
- `judgeNodeSource`: the guarded node; the guard at the head of NODE_OPTIONS and on the command line; refuses the
  options node applies before any preload (F2).
- `judgeGuard` / `judgeGuardSource`: the guard (CommonJS); start checks for preloads, inline and stdin scripts and
  early options; refusal of code with no file to check where eval is off (F2).
- `runJob` / `stepArgs`: mounts `/in/judge-inline` for a step with `inlineAllowed` (validate) only.
- `stepScript` / `kindFiles` / `kindMounts`: the PR facts reader as `/in/facts-reader.cjs`.
- `MUST_STAY_JSON` (repo-checks): `tools/policy/licences.json` stays JSON for the licence check.

## Files and folders

```text
tools/scripts/stackra-verify.mjs
tools/scripts/__tests__/stackra-verify.test.mjs
tools/scripts/pr-merge.mjs
tools/scripts/__tests__/pr-merge.test.mjs
tools/scripts/osv-canary.lock.yaml
tools/policy/licences.json
tools/README.md
THIRD_PARTY_NOTICES.md
STATE.md
packages/developer/repo-checks/src/node/constants/must-stay-json.constant.ts
packages/developer/repo-checks/src/node/functions/__tests__/repository-checks.test.ts
.changeset/repo-checks-licence-policy-json.md
.agents/specs/sta-2761-stackra-verify/{spec,plan,tasks}.md
```

## Data models and migrations

None.

## Contracts

The `stackra/verify` check run (name, App, head SHA); pr-merge conditions 5 and 6 behind `VERIFY_ENFORCED`. The
container inputs under `/in` (`judge-guard.cjs`, `bin/node`, `facts-reader.cjs`, `judge-inline` for validate).

## Error handling

A judge image that cannot be built is a service error (no verdict). The guard throws before any other code runs; the
guarded node exits `NODE_REFUSED_EXIT` (126) for an early option. A store image with no pnpm metadata stops the judge
build with a message naming the path.

## Security and tenancy

The guard is the first code in every judge Node process; a PR's preload (NODE_OPTIONS, `.npmrc` node-options, the
command line), inline or stdin script, early option, or anonymous compile never runs where eval is off. Inline scripts
are allowed by a read-only mounted marker, never by an environment variable. No tenancy.

## Testing strategy

Unit tests in `stackra-verify.test.mjs` and `repository-checks.test.ts`, each with a revert check; a nested run of
every `tools/scripts` self-test under the new guard as validate runs them; real `docker build --network none` proofs of
F1 on box 2; the box-1 proof rerun by the lead before go-live.

## Rollout

Merged with verify off (`VERIFY_ENFORCED` false); the box-1 proofs rerun on the merged service; the go-live PR turns
it on with the owner's approval.
