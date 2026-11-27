# Implementation Plan: Google and file secret stores, reload on rotation, and the names check before a deploy

**Spec**: `.agents/specs/sta-258-secret-stores-reload-check/spec.md` · **Linear**: STA-258 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-258-secret-stores-reload-check/spec.md`

## Summary

`@stackra/config` gains a `gcp_secret_manager` and a `file` `SecretStore` driver, a shared JSON splitter, and
`scheduleSecretReload`, which reloads any loading store on an interval or a signal while keeping its last good copy.
`@stackra/runway` gains `runway env missing`, which fails a deploy whose sops scope lacks a required synced name before
anything is decrypted, and treats names only code declares as optional (`required: false`) as placeholders the sync
writes empty. The secrets-decrypt action runs the check when asked.

## Technical Context

TypeScript on Node 24; vitest; `fetch` and `AbortSignal.timeout` for Google; `node:fs/promises` for files; no new
dependency.

## Key trade-off and research

- **REST over the Google SDK**: `@google-cloud/secret-manager` would add gRPC and an optional peer; two REST calls with
  the metadata token need neither. Off Google Cloud there is no metadata server, which is the deploy mode it serves.
- **Opt-in reload, no boot change**: the reload policy in `bootApp` waits for STA-2804's ruling, so this ships the
  mechanism and the `reloadSeconds` knob (default 0) without changing how any app boots.
- **Placeholders from `required: false`**: no new runway key; the manifest already carries `required` per row.

## Applicable standards

ADR 0371 (amended here), ADR 0173, ADR 0525, ADR 0294 (decisions 16, 19, 20, 26), ADR 0022 (test placement), ADR 0128
(member order).

## Constitution Check

| Law                                   | Result | Note                                                                |
| ------------------------------------- | ------ | ------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new cross-package import                                         |
| Secrets (ADR 0009)                    | PASS   | names only in code, config, logs and errors; values in private maps |
| Security                              | PASS   | fail closed; no response body quoted; tokens never logged           |
| HTTP and events                       | PASS   | no route or event added                                             |
| Tenancy                               | N/A    | no tenant-owned data                                                |
| Delegation                            | PASS   | R3 work: independent review                                         |
| Not built yet (ADR 0011)              | PASS   | no rejected or deferred technology used                             |
| Test placement (ADR 0022)             | PASS   | every test in `__tests__/` beside its subject                       |
| Versions and catalogs                 | PASS   | no dependency added                                                 |
| Deploy modes (ADR 0076)               | PASS   | `file` runs on-premises and air-gapped with no outbound call        |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                           |
| Docs and ADRs                         | PASS   | ADR 0371 amended; runbooks, READMEs, AGENTS.md and a command page   |

## Deploy modes

| Mode       | Behaviour                                                                               |
| ---------- | --------------------------------------------------------------------------------------- |
| SaaS       | `env`, `aws_secrets_manager` or `gcp_secret_manager`; the names check in the deploy job |
| On-prem    | `env` or `file` (mounted secrets), or `aws_secrets_manager` on AWS                      |
| Air-gapped | `env` or `file`; nothing leaves the enclave                                             |

## Correctness properties

- **P-001**: a failed load never changes what `get` answers — Validates: FR-003
- **P-002**: at most one `load()` of a store runs at a time under `scheduleSecretReload` — Validates: FR-005
- **P-003**: a name is a placeholder only when every declaration is `required: false` and no runway lists it — Validates: FR-007, FR-009
- **P-004**: `runway env missing` and `runway secrets sync` agree: what the check lets pass absent, the sync writes empty — Validates: FR-008, FR-010, FR-011
- **P-005**: no error, log line or finding carries a value or a token — Validates: NFR-001

## Architecture overview

A host builds a loading driver from its config, awaits `load()`, and may hand it to `scheduleSecretReload`. A deploy job
downloads the scope's ciphertext; the action runs `runway env missing` (names: `deployPlan` → `secretSyncPlan` against
the file names), then decrypts; `runway secrets sync` reads the values, an absent placeholder as `""`, and writes each.

## Components and responsibilities

### C1 `GcpSecretManagerSecretStoreDriver` and `GcpSecretManagerConfig`

**Responsibility**: read Google Secret Manager with the runtime's identity · **Location**: `packages/foundation/config`

**Behaviour**: token from the metadata server; `GET …/secrets/<id>/versions/<v>:access`, eight at a time; base64
payload; JSON split.

**Failure modes**: no token, a non-2xx, a timeout, no payload or an unreadable body → the load rejects naming ids.

### C2 `FileSecretStoreDriver` and `SecretFilesConfig`

**Responsibility**: read mounted secret files · **Location**: `packages/foundation/config`

**Behaviour**: list or name files, `stat` then read, drop one trailing line break.

**Failure modes**: relative folder, unlistable folder, missing or oversize file → reject naming names and codes.

### C3 `scheduleSecretReload`

**Responsibility**: reload a loading store on an interval or a signal · **Location**: `packages/foundation/config`

**Behaviour**: single-flight `load()`, unref'd `setInterval`, `onReload` and `onError`.

**Failure modes**: a failed load → `onError`, `false`, last good copy kept.

### C4 `runway env missing` and placeholders

**Responsibility**: the names check and the sync's placeholders · **Location**: `packages/developer/runway`,
`.github/actions/secrets-decrypt`

**Behaviour**: as FR-007 to FR-012.

**Failure modes**: no project or ciphertext, or outside CI → refuse.

## Files and folders

See tasks.md; every file is named there.

## Data models and migrations

None.

## Contracts

The exports, config keys, driver names, command and action input listed in the spec's Impact.

## Error handling

Errors name steps, ids, names, statuses and errno codes; never a value, a token or a body.

## Security and tenancy

R3: a value lives only in a private map or on a runner's stdin; the Google driver swallows JSON parse errors; the
`file` driver's names are SCREAMING_SNAKE only. No tenant data.

## Testing strategy

Unit tests per component with canary values; `fetch` stubbed for Google; a real temporary folder (with the kubelet's
`..data` swap) for `file`; fake timers for the reload; temporary repositories and ciphertext folders for runway. Revert
checks show the placeholder, optional-flag and reload tests fail without the change.

## Rollout

Additive: no default changes. A deployment opts in by `store`, `reloadSeconds` and the action's `check-environment`.

## Partial-failure ordering

The names check runs before the decrypt; the sync reads every value before it writes.

## Delegation and risk plan

R3: not delegated; independent review by the security reviewer.

## ADRs

ADR 0371 amendment of 2026-11-27.

## Docs

See the spec's Docs to update.

## Complexity tracking

None.

## Open questions

None: the boot binding and its reload policy are STA-2804's.
