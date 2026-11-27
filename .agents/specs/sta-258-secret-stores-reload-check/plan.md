# Implementation Plan: Google and file secret stores, reload on rotation, and the names check before a deploy

**Spec**: `.agents/specs/sta-258-secret-stores-reload-check/spec.md` · **Linear**: STA-258 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-258-secret-stores-reload-check/spec.md`

## Summary

`@stackra/config` gains a `gcp_secret_manager` and a `file` `SecretStore` driver, a shared JSON splitter, and
`scheduleSecretReload`, which reloads any loading store on an interval or a signal while keeping its last good copy.
`@stackra/runway` gains `runway env missing`, which fails a deploy whose sops scope lacks a required synced name before
anything is decrypted, and treats names only code declares as optional (`required: false`) as placeholders the sync
writes empty. `runway secrets decrypt` runs the check first on every product scope.

## Technical Context

TypeScript on Node 24; vitest; `fetch` and `AbortSignal.timeout` for Google; `node:fs/promises` for files; no new
dependency.

## Key trade-off and research

- **REST over the Google SDK**: `@google-cloud/secret-manager` would add gRPC and an optional peer; two REST calls with
  the metadata token need neither. Off Google Cloud there is no metadata server, which is the deploy mode it serves.
- **Opt-in reload, no boot change**: the reload policy in `bootApp` waits for STA-2804's ruling, so this ships the
  mechanism only, with no config field nothing would read, without changing how any app boots.
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
- **P-004**: `runway env missing` and `runway secrets sync` agree: what the check lets pass absent, the sync writes empty where Encore holds no value, and a value Encore holds is never replaced by an empty one — Validates: FR-008, FR-010, FR-011
- **P-006**: a decrypt of a product scope that lacks a required synced name decrypts nothing — Validates: FR-012
- **P-005**: no error, log line or finding carries a value or a token — Validates: NFR-001
- **P-007**: no optional config name is ever written empty, so an empty value never overrides a config default — Validates: FR-013
- **P-008**: `reloadNow()` resolves whatever its listeners do — Validates: FR-014
- **P-009**: no value the `file` driver answers is longer than 64 KiB, however the file changes while it is read — Validates: FR-015

## Architecture overview

A host builds a loading driver from its config, awaits `load()`, and may hand it to `scheduleSecretReload`. A deploy job
downloads the scope's ciphertext; `runway secrets decrypt` runs the names check (`scopeMissing` → `envMissing`:
`deployPlan` → `secretSyncPlan` against the file names) for a product scope, then decrypts; `runway secrets sync` reads the values, an absent placeholder as `""`, and writes each.

## Components and responsibilities

The work divides into the Google store (C1), the file store (C2), the reload schedule (C3), the names check with the
sync's placeholders (C4), and that check inside every decrypt of a product scope (C5). The docs (ADR 0371 amendment,
`apps/docs/src/docs/runway/env-missing.mdx`, the secrets and runway runbooks, the docs nav) follow tasks T014 and T015.

### C1 `GcpSecretManagerSecretStoreDriver` and `GcpSecretManagerConfig`

**Responsibility**: read Google Secret Manager with the runtime's identity · **Location**: `packages/foundation/config`

```text
packages/foundation/config/
├── src/node/drivers/gcp-secret-manager-secret-store.driver.ts                    (new)
├── src/node/drivers/__tests__/gcp-secret-manager-secret-store.driver.test.ts     (new)
├── src/node/drivers/aws-secrets-manager-secret-store.driver.ts                   (changed: shared JSON split, swap on success)
├── src/config/gcp-secret-manager.config.ts                                       (new)
├── src/config/__tests__/gcp-secret-manager.config.test.ts                        (new)
├── src/core/schemas/gcp-secret-manager-options.schema.ts                         (new)
├── src/core/constants/gcp-secret-manager-config-schema.constant.ts               (new)
├── src/core/functions/secret-entries-of.function.ts                              (new)
├── src/core/functions/__tests__/secret-entries-of.function.test.ts               (new)
├── src/core/constants/secret-store-drivers.constant.ts                           (changed: two names)
├── src/core/types/secret-store-driver-names.type.ts                              (changed: two names)
├── src/core/index.ts                                                             (changed: exports)
├── src/core/__tests__/index.test.ts                                              (changed)
├── src/node/index.ts                                                             (changed: exports)
├── src/node/__tests__/index.test.ts                                              (changed)
├── stackra.manifest.json                                                         (generated)
├── README.md                                                                     (docs)
└── AGENTS.md                                                                     (docs)
```

```ts
export class GcpSecretManagerOptions extends Schema {
  project: string;
  location: string;
  secretIds: string[];
  timeoutMs: number;
}

export class GcpSecretManagerSecretStoreDriver extends Driver(SecretStore) {
  constructor(config: GcpSecretManagerConfig);
  /** Reads every id's version with the metadata token; swaps the copy only when every read succeeded. */
  load(): Promise<void>;
  get(name: string): string | undefined;
}

export function secretEntriesOf(name: string, text: string): readonly (readonly [string, string])[];
```

**Behaviour**: token from the metadata server; `GET …/secrets/<id>/versions/<v>:access`, eight at a time; base64
payload; JSON split.

**Failure modes**: no token, a non-2xx, a timeout, no payload or an unreadable body → the load rejects naming ids.

### C2 `FileSecretStoreDriver` and `SecretFilesConfig`

**Responsibility**: read mounted secret files · **Location**: `packages/foundation/config`

```text
packages/foundation/config/
├── src/node/drivers/file-secret-store.driver.ts                    (new)
├── src/node/drivers/__tests__/file-secret-store.driver.test.ts     (new)
├── src/config/secret-files.config.ts                               (new)
├── src/config/__tests__/secret-files.config.test.ts                (new)
├── src/core/schemas/secret-files-options.schema.ts                 (new)
└── src/core/constants/secret-files-config-schema.constant.ts       (new)
```

```ts
export class SecretFilesOptions extends Schema {
  directory: string;
  names: string[];
}

export class FileSecretStoreDriver extends Driver(SecretStore) {
  constructor(config: SecretFilesConfig);
  load(): Promise<void>;
  get(name: string): string | undefined;
}
```

**Behaviour**: list or name files, `stat` then read, drop one trailing line break.

**Failure modes**: relative folder, unlistable folder, missing or oversize file → reject naming names and codes.

### C3 `scheduleSecretReload`

**Responsibility**: reload a loading store on an interval or a signal · **Location**: `packages/foundation/config`

```text
packages/foundation/config/
├── src/core/functions/schedule-secret-reload.function.ts                    (new)
├── src/core/functions/__tests__/schedule-secret-reload.function.test.ts     (new)
├── src/core/types/loadable-secret-store.type.ts                             (new)
├── src/core/types/secret-reload.type.ts                                     (new)
├── src/core/types/secret-reload-options.type.ts                             (new)
├── src/core/schemas/secrets-options.schema.ts                               (changed: docs; no interval field)
├── src/core/constants/secrets-config-schema.constant.ts                     (changed: store names only)
└── src/config/__tests__/secrets.config.test.ts                              (changed)
```

```ts
export type LoadableSecretStore = SecretStore & { load: () => Promise<void> };

export type SecretReloadOptions = {
  readonly everySeconds: number;
  readonly onError?: ((error: unknown) => void) | undefined;
  readonly onReload?: (() => void) | undefined;
};

export type SecretReload = { reloadNow(): Promise<boolean>; stop(): void };

export function scheduleSecretReload(
  store: LoadableSecretStore,
  options: SecretReloadOptions,
): SecretReload;
```

**Behaviour**: single-flight `load()`, unref'd `setInterval`, `onReload` and `onError`. `SecretsConfig` carries no
interval: nothing at boot reads one until STA-2804 binds the store, so the host that schedules picks it.

**Failure modes**: a failed load → `onError`, `false`, last good copy kept.

### C4 `runway env missing` and placeholders

**Responsibility**: the names check and the sync's placeholders · **Location**: `packages/developer/runway`

```text
packages/developer/runway/
├── src/node/commands/runway-env-missing.command.ts                         (new)
├── src/node/commands/__tests__/runway-env-missing.command.test.ts          (new)
├── src/node/functions/env-missing.function.ts                              (new)
├── src/node/functions/__tests__/env-missing.function.test.ts               (new)
├── src/node/constants/runway-commands.constant.ts                          (changed: the command)
├── src/node/functions/deploy-plan.function.ts                              (changed: optional)
├── src/node/functions/__tests__/deploy-plan.function.test.ts               (changed)
├── src/node/functions/read-runways.function.ts                             (changed: required)
├── src/node/functions/secret-sync-plan.function.ts                         (changed: placeholders)
├── src/node/functions/read-member-secrets.function.ts                      (changed: placeholders read empty)
├── src/node/functions/sync-secrets.function.ts                             (changed: placeholder guard)
├── src/node/functions/__tests__/sync-secrets.function.test.ts              (changed)
├── src/node/functions/encore-held-secrets.function.ts                      (new)
├── src/node/functions/__tests__/encore-held-secrets.function.test.ts       (new)
├── src/node/types/deploy-plan.type.ts                                      (changed)
├── src/node/types/deploy-runways.type.ts                                   (changed)
├── src/node/types/secret-sync-entry.type.ts                                (changed)
├── stackra.manifest.json                                                   (generated)
└── README.md                                                               (docs)
```

```ts
export async function envMissing(
  input: EnvReadInput & { readonly dir?: string | undefined },
): Promise<EnvFinding[]>;

export function encoreHeldSecrets(listing: string, environment: string): ReadonlySet<string> | null;

export type SecretSyncEntry = {
  readonly placeholders?: readonly string[];
};
```

**Behaviour**: as FR-007 to FR-011. The sync asks `encore secret list` before it writes an empty placeholder and keeps a
value Encore holds; an unreadable listing writes no placeholder.

**Failure modes**: no project or ciphertext, or outside CI → refuse.

### C5 The names check inside the decrypt

**Responsibility**: run the names check on every decrypt of a product scope, with no input to opt in ·
**Location**: `packages/developer/runway`, `.github/actions/secrets-decrypt`

```text
packages/developer/runway/
├── src/node/functions/scope-missing.function.ts                          (new)
├── src/node/functions/__tests__/scope-missing.function.test.ts           (new)
├── src/node/commands/runway-secrets-decrypt.command.ts                   (changed: check first)
└── src/node/commands/__tests__/runway-secrets-decrypt.command.test.ts    (changed)
```

```text
.github/actions/secrets-decrypt/
└── action.yml    (docs: the check runs inside the decrypt; no opt-in input)
```

```text
apps/docs/src/
├── docs/adr/0371-secret-store-drivers-which-deploy-mode-binds-which-and-how-the-bootstrap-credential-arrives.mdx    (amendment)
├── docs/runway/env-missing.mdx                                                                                      (new)
├── docs/runbooks/secrets.mdx                                                                                        (docs)
├── docs/runbooks/runway.mdx                                                                                         (docs)
└── config/docs.config.ts                                                                                            (nav)
```

```ts
export async function scopeMissing(input: {
  readonly cwd: string;
  readonly scope: string;
  readonly dir: string;
  readonly ci?: boolean | undefined;
}): Promise<{ readonly environments: readonly string[]; readonly findings: EnvFinding[] } | null>;
```

**Behaviour**: for `products/<project>/<env>` of the checked-out repository, `envMissing` for every runway environment
of that scope; the decrypt prints the findings and exits 1 on an error before decrypting anything.

**Failure modes**: another scope, no repository, no runway or another project → null, nothing checked; outside CI →
refuse.

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

A deployment opts in to a store by `store`. The names check is on for every decrypt of a product scope of the
checked-out repository; a deploy whose scope lacks a required secret now fails before the decrypt instead of in the sync.

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
