# Implementation Plan: a public-content guard driven by a policy file

**Spec**: `.agents/specs/sta-2911-public-content-policy/spec.md` · **Linear**: STA-2911 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-2911-public-content-policy/spec.md`

## Summary

The STA-2876 guard's hard-coded `DENIED` map becomes `RECOMMENDED_DENY`, the default, and the allow list becomes the
policy file `tools/scripts/public-content.policy.yaml`, which also `deny`s more terms and `waive`s recommended ones. The
guard validates the policy and refuses to scan with an invalid one. It runs as `pnpm public-content` in `pnpm validate`
(so in `pnpm verify` and the Quality Gate), on staged files in the pre-commit hook (`--files`), and in both release pack
steps (`--pack`, unchanged).

## Technical Context

- **Language**: Node scripts (`.mjs`), Node 24 (`mise.toml`); YAML (lefthook, the policy)
- **Members**: tools/scripts; the root `package.json`; `.flow/overrides/hooks` and `lefthook.yml`; apps/docs (prose)
- **Testing**: `node --test tools/scripts/__tests__/*.test.mjs` (in `pnpm validate`)
- **Storage**: none
- **Runtime target**: repository tooling and git hooks

## Key trade-off and research

- **Trade-off: a built-in default plus a policy, not a policy alone.** The recommended list ships with the guard, so a
  repository that writes an empty policy is still protected; the policy can only add terms or waive one with a reason
  and an issue, which a reviewer sees in the diff.
- **Trade-off: an invalid policy fails closed.** A typo in an entry exits 2 and checks nothing, so it fails the hook,
  validate and the release instead of quietly checking less.
- **Trade-off: no wording exemption for approval lines.** The item asked to exempt the approval-line format; the
  STA-2876 review removed a wording exemption because it let person names through. The role-only format
  (`Approved by CTO <date>`, STA-2905) carries no denied term and passes on its own, which the tests hold.
- **Research**: lefthook `{staged_files}` (added, copied, modified, renamed paths, relative to the root).

## Applicable standards

| Rule                                                   | How it is enforced                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| No internal content in tracked files                   | check: `pnpm public-content` in `pnpm validate`; pre-commit hook |
| No internal content in tarballs                        | check: the tarball steps in `runway-npm.yml` and `release.yml`   |
| No secret-shaped strings                               | check: gitleaks (lefthook, `pnpm secrets:scan`), unchanged       |
| Tests beside their subjects in `__tests__/` (ADR 0022) | check: the repository layout in CI                               |
| Hooks rendered from the preset overrides               | check: `fflow sync` (the lock file)                              |

## Constitution Check

| Law                                   | Result | Note                                      |
| ------------------------------------- | ------ | ----------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import                             |
| Secrets (ADR 0009)                    | PASS   | no secret read or named                   |
| Security                              | PASS   | personal and infrastructure data kept out |
| HTTP and events                       | N/A    | no route or event                         |
| Tenancy                               | N/A    | no tenant data                            |
| Delegation                            | PASS   | not delegated                             |
| Not built yet (ADR 0011)              | PASS   | no rejected or deferred technology used   |
| Test placement (ADR 0022)             | PASS   | the test is in `__tests__/`               |
| Versions and catalogs                 | PASS   | no dependency added                       |
| Deploy modes (ADR 0076)               | PASS   | same in all three                         |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                 |
| Docs and ADRs                         | PASS   | scripts README and release runbook        |

## Deploy modes

| Mode       | Behaviour                              |
| ---------- | -------------------------------------- |
| SaaS       | none: repository tooling               |
| On-prem    | same                                   |
| Air-gapped | same; the guard reads local files only |

## Correctness properties

- **P-001**: the effective deny list is exactly recommended − waived + denied — Validates: FR-001
- **P-002**: every policy that breaks FR-002 yields at least one problem, and any problem stops every scan with exit 2 — Validates: FR-002, FR-003
- **P-003**: `--files` reports exactly what a whole-repository scan reports for those files — Validates: FR-005
- **P-004**: no output of `--hash` or `--recommended`, and no line of the guard or the policy, holds a denied term — Validates: FR-006, NFR-001

## Architecture overview

```mermaid
flowchart TD
  policy["public-content.policy.yaml (deny, waive, allow)"] --> guard["guard-public-content.mjs"]
  recommended["RECOMMENDED_DENY (built in)"] --> guard
  staged["pre-commit: staged files (--files)"] --> guard
  tracked["pnpm public-content: tracked files"] --> guard
  packs["release: pnpm pack tarballs (--pack)"] --> guard
  guard -->|invalid policy| stop["exit 2"]
  guard -->|finding| fail["exit 1"]
  guard -->|clean| pass["commit / merge / publish"]
```

## Components and responsibilities

### C1 The policy and the guard

**Responsibility**: read and check the policy; find denied terms and home folders · **Location**: `tools/scripts`

```text
tools/scripts/
├── guard-public-content.mjs                    (changed)
├── public-content.policy.yaml                  (renamed from public-content.allow.yaml; deny and waive added)
├── README.md                                   (changed)
└── __tests__/guard-public-content.test.mjs     (changed)
```

```ts
export const RECOMMENDED_DENY: Map<string, { length: number; reason: string }>; // was DENIED
export const POLICY_FILE: string;
export const DEFAULT_POLICY: Policy; // the recommended list, nothing allowed
type Policy = { deny: Map<string, { length: number; reason: string }>; allow: AllowEntry[] };
export function parsePolicy(document: unknown): { policy: Policy; errors: string[] };
export function readPolicy(file?: string): { policy: Policy; errors: string[] };
export function lineFindings(line: string, deny?: Policy["deny"]): string[];
export function scanText(path: string, text: string, policy?: Policy): Finding[];
export function scanTarball(label: string, bytes: Buffer, policy?: Policy): Finding[];
```

**Behaviour**: as STA-2876, against the policy's effective deny list. **Failure modes**: an invalid policy exits 2; a
finding exits 1.

### C2 Wiring

**Responsibility**: run the guard in validate and before each commit · **Location**: the repository root

```text
package.json                                 (changed: script public-content, in validate)
.flow/overrides/hooks/lefthook.yml.txt       (changed: pre-commit job public-content)
.flow/overrides/hooks/lefthook.yml           (changed: the override's reason)
lefthook.yml                                 (rendered by fflow sync)
.flow/lock.json                              (rendered by fflow sync)
apps/docs/src/docs/runbooks/release.mdx      (changed)
```

```ts
// package.json scripts (JSON shown as its TypeScript shape)
type Scripts = { "public-content": "node tools/scripts/guard-public-content.mjs" };
```

**Behaviour**: the hook skips with a message without node or the install. **Failure modes**: a finding fails the
commit, validate or the release.

## Files and folders

The trees of C1 and C2.

## Data models and migrations

none

## Contracts

- `tools/scripts/public-content.policy.yaml` replaces `public-content.allow.yaml` (its `allow` list unchanged).
- `guard-public-content.mjs`: `--policy`, `--files`, `--recommended` added; `--hash` prints `{ sha256, length, reason }`.
- Root script `pnpm public-content`.

## Error handling

Each policy problem prints as `<policy>: <problem>`, then exit 2; each finding as `path:line: reason`, then exit 1.

## Security and tenancy

Denied terms stay hashes in the guard and the policy. No tenant data.

## Testing strategy

- AC-001 to AC-003, AC-006: `guard-public-content.test.mjs`.
- AC-004: a staged file under lefthook on the build box. AC-005: `pnpm public-content` on this branch.

## Rollout

Merge after PR #1197; the hook is installed by `pnpm install` (lefthook) for every contributor.
