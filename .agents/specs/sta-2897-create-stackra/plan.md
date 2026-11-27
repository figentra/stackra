# Implementation Plan: `create-stackra`, the npm initializer, and one documented install line

**Spec**: `.agents/specs/sta-2897-create-stackra/spec.md` · **Linear**: STA-2897 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-2897-create-stackra/spec.md`

## Summary

A new, dependency-free member `create-stackra` whose binary maps the `@stackra` scope to the Stackra registry as an
npx flag for one run and hands every argument to `@stackra/cli create`. `stackra create` writes the registry it used
into the app's `.npmrc`; `@stackra/repo-checks` accepts the one unscoped name and points it at `stackra-inc/stackra`,
the repository that would sign its npmjs provenance. ADR 0199 is amended, and the customer install page gives the
scope-mapped `npx` line as the one line, with every item it still needs listed as pending. The npmjs name claim and
publish wait on the owner, and no page names `npm create stackra` as a line to run until the claim.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/create-stackra` (new), `packages/developer/cli`, `packages/developer/repo-checks`, `apps/docs`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the end-to-end run in `stackra-demo` on box 2 against the real registry
- **Storage**: none
- **Runtime target**: a Node binary run by `npm create` / `pnpm create` / `yarn create`, once published

## Key trade-off and research

- **Trade-off: map the scope, not the registry.** Pointing npm's whole registry at the Stackra registry would make
  every third-party dependency 404 (it never proxies npmjs, ADR 0453 decision 4), so only `@stackra` is mapped.
- **Trade-off: an npx flag, not an `.npmrc`.** `--@stackra:registry=<origin>` lasts one run; writing a user or
  project `.npmrc` would change the developer's machine for every later install.
- **Trade-off: hand over, do not re-implement.** The initializer asks nothing and writes nothing; `stackra create`
  stays the one place for questions, checks and files, so the two cannot drift.
- **Trade-off: document the `npx` line, not the initializer name.** A documented `npm create` name that nobody holds
  on npmjs is a supply-chain hole (anyone could publish under it); the `npx` line names only the `@stackra` scope on
  the Stackra registry, which only the release workflow publishes to.
- **Trade-off: an exception for the npmjs member, not a repository-wide URL move.** npm refuses a provenance publish
  whose `repository.url` is not the signing repository; only the npmjs member is published there, so only it moves to
  `stackra-inc/stackra` now (`NPMJS_REPOSITORY`).
- **Research**: npm's `npm init <initializer>` maps to `npm exec create-<initializer>`; scoped registry config flags
  are accepted by `npm exec`; Node 24 refuses to spawn `.cmd` files without a shell, hence `npx-cli.js` under the same
  Node. The clean-`HOME` runs of 2026-11-27 are in spec SRC-007.

## Applicable standards

| Rule                                                   | How it is enforced                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| Member name follows its folder (`expectedName`)        | check: `stackra validate --repository`; `repository-checks.test` |
| Member npm metadata (`npmMetadataFor`)                 | check: `stackra validate --repository`; the metadata tests       |
| One declaration per file, kind suffixes (ADR 0305)     | check: oxlint `stackra(one-declaration-per-file)`                |
| Tests beside their subjects in `__tests__/` (ADR 0022) | check: the repository layout in `stackra validate`               |
| Catalog versions only                                  | check: `stackra validate --repository`                           |
| Changesets for publishable packages                    | check: changeset status in CI (`@stackra/cli`, `repo-checks`)    |
| No runtime dependency in the initializer               | check: `package.json` has `devDependencies` only; review         |

## Constitution Check

| Law                                   | Result | Note                                                                         |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the new member imports nothing from the workspace                            |
| Secrets (ADR 0009)                    | PASS   | no secret read or written; the environment passes through untouched          |
| Security                              | PASS   | no shell; `--cli` restricted to versions and tags; one scope mapped; no name |
| HTTP and events                       | N/A    | no route or event                                                            |
| Tenancy                               | N/A    | no data                                                                      |
| Delegation                            | PASS   | R2: one builder, independent review before merge                             |
| Not built yet (ADR 0011)              | PASS   | no rejected or deferred technology                                           |
| Test placement (ADR 0022)             | PASS   | every test in `__tests__/` beside its subject                                |
| Versions and catalogs                 | PASS   | dev dependencies from the catalogs; no runtime dependency                    |
| Deploy modes (ADR 0076)               | PASS   | `--registry` / `STACKRA_REGISTRY` reach an on-prem or air-gapped mirror      |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                    |
| Docs and ADRs                         | PASS   | ADR 0199 amended; install page, README and AGENTS.md written                 |

## Deploy modes

| Mode       | Behaviour                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------ |
| SaaS       | the documented `npx` line (later `npm create stackra@latest my-app`); the default registry |
| On-prem    | `--registry` or `STACKRA_REGISTRY` names the organisation's Stackra registry               |
| Air-gapped | same, with npm's own registry pointed at the internal npm mirror as usual                  |

## Correctness properties

- **P-001**: for any forwarded arguments, the npx call is the scope flag, `@stackra/cli@<cli>`, `create`, then the arguments unchanged and in order — Validates: FR-002, FR-004
- **P-002**: the origin in the npx flag, in `STACKRA_REGISTRY` and in the app's `.npmrc` is the same string — Validates: FR-002, FR-003, FR-006
- **P-003**: a refused command line starts no process — Validates: FR-003, FR-004, FR-005
- **P-004**: with the default registry, `starterFiles` writes the same `.npmrc` as before — Validates: FR-006
- **P-005**: for any folder, `expectedName` answers its `UNSCOPED_PACKAGES` name when it has one and the scoped name of its placement otherwise — Validates: FR-007
- **P-006**: for any folder, `npmMetadataFor` and `checkMemberFiles` name the same repository URL: `NPMJS_REPOSITORY`'s for a folder of `UNSCOPED_PACKAGES`, `MEMBER_METADATA`'s otherwise — Validates: FR-010

FR-001, FR-008 and FR-009 are example-only (a manifest field, a `private` flag and docs text), checked by the
repository checks and the review.

## Architecture overview

```text
npx -y --@stackra:registry=<origin> @stackra/cli create my-app     (the documented line, today)
create-stackra my-app --yes                                        (the initializer, once published on npmjs)
  └─ parseBootstrapArgs → bootstrapRegistry → npxCommand → npxArguments
       └─ node npx-cli.js --yes --@stackra:registry=<origin> @stackra/cli@<cli> create my-app --yes
            env STACKRA_REGISTRY=<origin>
            └─ stackra create (Stackra registry): starter from <origin>, .npmrc maps @stackra to <origin>
```

## Components and responsibilities

Three components: the initializer member (C1), the registry `stackra create` writes into the new app (C2), and the
repository checks that admit the one unscoped, npmjs-published member (C3). The docs are listed under Files and
folders.

### C1 `create-stackra`

**Responsibility**: reach `stackra create` from a clean machine · **Location**: `packages/developer/create-stackra`

```text
packages/developer/create-stackra/
├── AGENTS.md                                       (new)
├── CHANGELOG.md                                    (new)
├── LICENSE                                         (new)
├── README.md                                       (new)
├── package.json                                    (new: bin, private, stackra-inc/stackra URLs)
├── stackra.config.ts                               (new)
├── stackra.manifest.json                           (new)
├── tsconfig.json                                   (new)
├── tsdown.config.ts                                (new)
├── turbo.jsonc                                     (new)
├── vitest.config.ts                                (new)
└── src/node/
    ├── create-stackra.ts                           (new: the bin)
    ├── constants/
    │   ├── min-node-major.constant.ts              (new)
    │   ├── process-host.constant.ts                (new)
    │   ├── stackra-cli-package.constant.ts         (new)
    │   ├── stackra-registry-default.constant.ts    (new)
    │   └── usage.constant.ts                       (new)
    ├── errors/
    │   └── bootstrap-usage.error.ts                (new)
    ├── functions/
    │   ├── bootstrap-registry.function.ts          (new)
    │   ├── exit-code.function.ts                   (new)
    │   ├── manual-line.function.ts                 (new)
    │   ├── npx-arguments.function.ts               (new)
    │   ├── npx-command.function.ts                 (new)
    │   ├── parse-bootstrap-args.function.ts        (new)
    │   └── run-create-stackra.function.ts          (new)
    └── types/
        ├── bootstrap-args.type.ts                  (new)
        ├── bootstrap-env.type.ts                   (new)
        ├── bootstrap-host.type.ts                  (new)
        └── npx-command.type.ts                     (new)
```

```ts
export type BootstrapEnv = Readonly<Record<string, string | undefined>>;

export type BootstrapArgs = {
  readonly registry: string | undefined;
  readonly cli: string;
  readonly help: boolean;
  readonly forwarded: readonly string[];
};

export type NpxCommand = { readonly command: string; readonly args: readonly string[] };

export type BootstrapHost = {
  readonly env: BootstrapEnv;
  readonly nodeVersion: string;
  readonly execPath: string;
  readonly platform: string;
  readonly exists: (path: string) => boolean;
  readonly out: (line: string) => void;
  readonly err: (line: string) => void;
  readonly run: (command: string, args: readonly string[], env: BootstrapEnv) => Promise<number>;
};

export class BootstrapUsageError extends Error {}

export const MIN_NODE_MAJOR = 24;
export const STACKRA_CLI_PACKAGE = "@stackra/cli";
export const STACKRA_REGISTRY_DEFAULT = "https://npm.stackra.figentra.com/";
export const USAGE: string;
export const PROCESS_HOST: BootstrapHost;

export function runCreateStackra(argv: readonly string[], host: BootstrapHost): Promise<number>;
export function parseBootstrapArgs(argv: readonly string[]): BootstrapArgs;
export function bootstrapRegistry(flag: string | undefined, env: BootstrapEnv): string;
export function npxCommand(
  host: Pick<BootstrapHost, "env" | "execPath" | "platform" | "exists">,
): NpxCommand | undefined;
export function npxArguments(origin: string, cli: string, forwarded: readonly string[]): string[];
export function manualLine(origin: string, cli: string, forwarded: readonly string[]): string;
export function exitCode(code: number | null, signal: NodeJS.Signals | null): number;
```

**Behaviour**: `runCreateStackra(argv, host)`: Node floor, `parseBootstrapArgs`, help, `bootstrapRegistry`,
`npxCommand`, then `host.run` with `npxArguments` and `STACKRA_REGISTRY`. `PROCESS_HOST` is the only code that touches
the machine.

**Failure modes**: usage → 2; old Node → 1; npx missing or cannot start → 127 with `manualLine`; the child's failure →
its code.

### C2 `stackra create` registry in `.npmrc`

**Responsibility**: the app installs from the registry it was made from · **Location**: `packages/developer/cli`

```text
packages/developer/cli/src/node/
├── commands/
│   └── create.command.ts                           (changed: one registryOrigin for starter and files)
└── create/
    ├── functions/
    │   └── starter-files.function.ts               (changed: scope lines follow options.registry)
    └── types/
        └── starter-options.type.ts                 (changed: optional registry)
```

```ts
export type StarterOptions = {
  readonly profile: string;
  readonly name: string;
  readonly scope: string;
  readonly stackraVersion: string;
  /** The registry origin the app installs from, ending in `/`; undefined keeps the default. */
  readonly registry?: string;
  readonly tarballs?: Readonly<Record<string, string>>;
};

export function starterFiles(
  files: ReadonlyMap<string, Uint8Array>,
  options: StarterOptions,
): Map<string, Uint8Array>;
```

**Behaviour**: `CreateCommand` resolves `registryOrigin` once, fetches the starter from it and passes it to
`starterFiles` as `registry`; `starterFiles` moves every default-host scope line to it and adds the `@stackra` line
when missing.

**Failure modes**: none new.

### C3 The unscoped, npmjs-published member

**Responsibility**: the repository checks accept `create-stackra` and its npmjs repository URLs · **Location**:
`packages/developer/repo-checks`

```text
packages/developer/repo-checks/src/node/
├── index.ts                                        (changed: exports UNSCOPED_PACKAGES)
├── constants/
│   ├── npmjs-repository.constant.ts                (new)
│   └── unscoped-packages.constant.ts               (new)
└── functions/
    ├── check-member-files.function.ts              (changed: repository URL from npmMetadataFor)
    ├── expected-name.function.ts                   (changed: UNSCOPED_PACKAGES first)
    └── npm-metadata-for.function.ts                (changed: NPMJS_REPOSITORY for UNSCOPED_PACKAGES)
```

```ts
export const UNSCOPED_PACKAGES: Readonly<Record<string, string>>;

export const NPMJS_REPOSITORY: Readonly<{
  repositoryUrl: "git+https://github.com/stackra-inc/stackra.git";
  treeUrl: "https://github.com/stackra-inc/stackra/tree/main/";
  bugsUrl: "https://github.com/stackra-inc/stackra/issues";
}>;

export function expectedName(dir: string): string | null;

export function npmMetadataFor(dir: string): {
  readonly repository: { readonly type: "git"; readonly url: string; readonly directory: string };
  readonly homepage: string;
  readonly bugs: { readonly url: string };
  readonly author: string;
  readonly engines: { readonly node: string };
};
```

**Behaviour**: `expectedName` answers `UNSCOPED_PACKAGES[dir]` before the folder rules; `npmMetadataFor` takes its
URLs from `NPMJS_REPOSITORY` for a folder of `UNSCOPED_PACKAGES` and from `MEMBER_METADATA` otherwise;
`checkMemberFiles` requires the repository URL `npmMetadataFor` gives.

**Failure modes**: none.

## Files and folders

The members' files are in the component trees above. The docs and repository files:

```text
apps/docs/
├── scripts/architecture-map/architecture-map.yaml                                       (changed: 15 developer packages)
└── src/
    ├── assets/architecture-map.html                                                     (regenerated)
    └── docs/
        ├── adr/0199-developer-experience-create-stackra-app-upgrades-stackra-dev-and-docs.mdx (amended)
        ├── adr/index.mdx                                                                (row)
        └── customers/install.mdx                                                        (the npx line, pending rows)
knip.jsonc                                                                               (create-stackra entries)
```

`.changeset/create-stackra-registry.md`, `.changeset/repo-checks-npmjs-repository.md` and `pnpm-lock.yaml` change
too.

## Data models and migrations

none

## Contracts

- New npm name `create-stackra` with the bin `create-stackra`; no code export (`exports` holds `./package.json`).
- `@stackra/repo-checks`: new export `UNSCOPED_PACKAGES`; `npmMetadataFor` answers `stackra-inc/stackra` URLs for its
  folders.
- `stackra create`: the app's `.npmrc` follows the registry it used. Compatibility: unchanged with the default
  registry. Patch bumps for `@stackra/cli` and `@stackra/repo-checks`.

## Error handling

`BootstrapUsageError` for a command line that cannot run (exit 2); every other error from the host propagates. npx
failures surface through its own output and exit code.

## Security and tenancy

No shell anywhere; arguments go to `spawn` as an array. `--cli` cannot name a path, URL or other package. Only the
`@stackra` scope is mapped, for one run. No page names the initializer as a line to run before the owner holds its
npmjs name. No tenancy.

## Testing strategy

- AC-001, AC-002, AC-004: `run-create-stackra.function.test.ts`, `exit-code.function.test.ts`,
  `process-host.constant.test.ts` (a real child: code, signal, ENOENT).
- AC-003: `parse-bootstrap-args.function.test.ts`, `bootstrap-registry.function.test.ts`.
- AC-005: `create.test.ts`, `create.command.test.ts` in `@stackra/cli`.
- AC-006: `repository-checks.test.ts` in `@stackra/repo-checks`.
- AC-008: `check-member-metadata.function.test.ts` and `repository-checks.test.ts` in `@stackra/repo-checks`, and
  `stackra validate --repository` on the branch.
- AC-007 and SC-001: the built bundle's imports, and the box 2 run against the real registry.
- AC-009: the docs review and the docs build.

## Rollout

Merge; the release publishes `@stackra/cli` and `@stackra/repo-checks` (patch). `create-stackra` stays private. When
the owner has claimed the npm name and allowed the publish, a follow-up removes `"private": true`, adds an npmjs
publish step for this one package (trusted publishing, provenance from `stackra-inc/stackra`) and makes
`npm create stackra@latest <folder>` the documented line.

## Partial-failure ordering

None: the documented line runs any published `@stackra/cli`; the `.npmrc` change only matters with a non-default
registry.

## Delegation and risk plan

R2: one builder, independent review before merge.

## ADRs

ADR 0199 (amended 2026-11-27), ADR 0453 (decisions 4, 10, 11, 16), ADR 0177, ADR 0083, ADR 0022, ADR 0305.

## Docs

ADR 0199 and the ADR index; `apps/docs/src/docs/customers/install.mdx`; `packages/developer/create-stackra/README.md`
and `AGENTS.md`.

## Complexity tracking

none

## Open questions

None. The npmjs name claim and the npmjs publish are the owner's: an external blocker recorded in spec.md (Impact and
Out of scope), which this change does not need.
