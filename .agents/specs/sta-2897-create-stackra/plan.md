# Implementation Plan: `create-stackra`, the `npm create stackra` initializer, and one documented install line

**Spec**: `.agents/specs/sta-2897-create-stackra/spec.md` · **Linear**: STA-2897 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-2897-create-stackra/spec.md`

## Summary

A new, dependency-free member `create-stackra` whose binary maps the `@stackra` scope to the Stackra registry as an
npx flag for one run and hands every argument to `@stackra/cli create`. `stackra create` writes the registry it used
into the app's `.npmrc`; `@stackra/repo-checks` accepts the one unscoped name. ADR 0199 is amended and the customer
install page gets the one line. Publishing to npmjs waits on the owner.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/create-stackra` (new), `packages/developer/cli`, `packages/developer/repo-checks`, `apps/docs`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the end-to-end run in `stackra-demo` on box 2 against the real registry
- **Storage**: none
- **Runtime target**: a Node binary run by `npm create` / `pnpm create` / `yarn create`

## Key trade-off and research

- **Trade-off: map the scope, not the registry.** Pointing npm's whole registry at the Stackra registry would make
  every third-party dependency 404 (it never proxies npmjs, ADR 0453 decision 4), so only `@stackra` is mapped.
- **Trade-off: an npx flag, not an `.npmrc`.** `--@stackra:registry=<origin>` lasts one run; writing a user or
  project `.npmrc` would change the developer's machine for every later install.
- **Trade-off: hand over, do not re-implement.** The initializer asks nothing and writes nothing; `stackra create`
  stays the one place for questions, checks and files, so the two cannot drift.
- **Research**: npm's `npm init <initializer>` maps to `npm exec create-<initializer>`; scoped registry config flags
  are accepted by `npm exec`; Node 24 refuses to spawn `.cmd` files without a shell, hence `npx-cli.js` under the same
  Node.

## Applicable standards

| Rule                                                   | How it is enforced                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| Member name follows its folder (`expectedName`)        | check: `stackra validate --repository`; `repository-checks.test` |
| One declaration per file, kind suffixes (ADR 0305)     | check: oxlint `stackra(one-declaration-per-file)`                |
| Tests beside their subjects in `__tests__/` (ADR 0022) | check: the repository layout in `stackra validate`               |
| Catalog versions only                                  | check: `stackra validate --repository`                           |
| Changesets for publishable packages                    | check: changeset status in CI (`@stackra/cli`, `repo-checks`)    |
| No runtime dependency in the initializer               | check: `package.json` has `devDependencies` only; review         |

## Constitution Check

| Law                                   | Result | Note                                                                    |
| ------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the new member imports nothing from the workspace                       |
| Secrets (ADR 0009)                    | PASS   | no secret read or written; the environment passes through untouched     |
| Security                              | PASS   | no shell; `--cli` restricted to versions and tags; one scope mapped     |
| HTTP and events                       | N/A    | no route or event                                                       |
| Tenancy                               | N/A    | no data                                                                 |
| Delegation                            | PASS   | R2: one builder, independent review before merge                        |
| Not built yet (ADR 0011)              | PASS   | no rejected or deferred technology                                      |
| Test placement (ADR 0022)             | PASS   | every test in `__tests__/` beside its subject                           |
| Versions and catalogs                 | PASS   | dev dependencies from the catalogs; no runtime dependency               |
| Deploy modes (ADR 0076)               | PASS   | `--registry` / `STACKRA_REGISTRY` reach an on-prem or air-gapped mirror |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                               |
| Docs and ADRs                         | PASS   | ADR 0199 amended; install page, README and AGENTS.md written            |

## Deploy modes

| Mode       | Behaviour                                                                    |
| ---------- | ---------------------------------------------------------------------------- |
| SaaS       | `npm create stackra@latest my-app`; the default Stackra registry             |
| On-prem    | `--registry` or `STACKRA_REGISTRY` names the organisation's Stackra registry |
| Air-gapped | same, with npm's own registry pointed at the internal npm mirror as usual    |

## Correctness properties

- **P-001**: for any forwarded arguments, the npx call is the scope flag, `@stackra/cli@<cli>`, `create`, then the arguments unchanged and in order — Validates: FR-002, FR-004
- **P-002**: the origin in the npx flag, in `STACKRA_REGISTRY` and in the app's `.npmrc` is the same string — Validates: FR-002, FR-003, FR-006
- **P-003**: a refused command line starts no process — Validates: FR-003, FR-004, FR-005
- **P-004**: with the default registry, `starterFiles` writes the same `.npmrc` as before — Validates: FR-006

## Architecture overview

```text
npm create stackra my-app -- --yes
  └─ create-stackra (npmjs, no dependency)
       parseBootstrapArgs → bootstrapRegistry → npxCommand → npxArguments
       └─ node npx-cli.js --yes --@stackra:registry=<origin> @stackra/cli@<cli> create my-app --yes
            env STACKRA_REGISTRY=<origin>
            └─ stackra create (Stackra registry): starter from <origin>, .npmrc maps @stackra to <origin>
```

## Components and responsibilities

### C1 `create-stackra`

**Responsibility**: reach `stackra create` from a clean machine · **Location**: `packages/developer/create-stackra`

**Behaviour**: `runCreateStackra(argv, host)`: Node floor, `parseBootstrapArgs`, help, `bootstrapRegistry`,
`npxCommand`, then `host.run` with `npxArguments` and `STACKRA_REGISTRY`. `PROCESS_HOST` is the only code that touches
the machine.

**Failure modes**: usage → 2; old Node → 1; npx missing or cannot start → 127 with `manualLine`; the child's failure →
its code.

### C2 `stackra create` registry in `.npmrc`

**Responsibility**: the app installs from the registry it was made from · **Location**: `packages/developer/cli`

**Behaviour**: `CreateCommand` resolves `registryOrigin` once, fetches the starter from it and passes it to
`starterFiles` as `registry`; `starterFiles` moves every default-host scope line to it and adds the `@stackra` line
when missing.

**Failure modes**: none new.

### C3 The unscoped member

**Responsibility**: the repository checks accept `create-stackra` · **Location**: `packages/developer/repo-checks`

**Behaviour**: `expectedName` answers `UNSCOPED_PACKAGES[dir]` before the folder rules.

**Failure modes**: none.

## Files and folders

`packages/developer/create-stackra/**` (new), `packages/developer/cli/src/node/commands/create.command.ts`,
`packages/developer/cli/src/node/create/functions/starter-files.function.ts`,
`packages/developer/cli/src/node/create/types/starter-options.type.ts` and their tests,
`packages/developer/repo-checks/src/node/constants/unscoped-packages.constant.ts`,
`packages/developer/repo-checks/src/node/functions/expected-name.function.ts`, `packages/developer/repo-checks/src/node/index.ts`
and its test, ADR 0199, the ADR index, `customers/install.mdx`, the architecture map, `.changeset/create-stackra-registry.md`
and `pnpm-lock.yaml`.

## Data models and migrations

none

## Contracts

- New npm name `create-stackra` with the bin `create-stackra`; no code export (`exports` holds `./package.json`).
- `@stackra/repo-checks`: new export `UNSCOPED_PACKAGES`.
- `stackra create`: the app's `.npmrc` follows the registry it used. Compatibility: unchanged with the default
  registry. Patch bumps for `@stackra/cli` and `@stackra/repo-checks`.

## Error handling

`BootstrapUsageError` for a command line that cannot run (exit 2); every other error from the host propagates. npx
failures surface through its own output and exit code.

## Security and tenancy

No shell anywhere; arguments go to `spawn` as an array. `--cli` cannot name a path, URL or other package. Only the
`@stackra` scope is mapped, for one run. No tenancy.

## Testing strategy

- AC-001, AC-002, AC-004: `run-create-stackra.function.test.ts`, `exit-code.function.test.ts`,
  `process-host.constant.test.ts` (a real child: code, signal, ENOENT).
- AC-003: `parse-bootstrap-args.function.test.ts`, `bootstrap-registry.function.test.ts`.
- AC-005: `create.test.ts`, `create.command.test.ts` in `@stackra/cli`.
- AC-006: `repository-checks.test.ts` in `@stackra/repo-checks`.
- AC-007 and SC-001: the built bundle's imports, and the box 2 run against the real registry.

## Rollout

Merge; the release publishes `@stackra/cli` and `@stackra/repo-checks` (patch). `create-stackra` stays private. When
the owner claims the npm name and allows the publish, a follow-up removes `"private": true` and adds an npmjs publish
step for this one package (trusted publishing, provenance), then the docs drop the "not on npmjs yet" note.

## Partial-failure ordering

None: the initializer runs any published `@stackra/cli`; the `.npmrc` change only matters with a non-default registry.

## Delegation and risk plan

R2: one builder, independent review before merge.

## ADRs

ADR 0199 (amended 2026-11-27), ADR 0453 (decisions 4, 10, 16), ADR 0083, ADR 0022, ADR 0305.

## Docs

ADR 0199 and the ADR index; `apps/docs/src/docs/customers/install.mdx`; `packages/developer/create-stackra/README.md`
and `AGENTS.md`.

## Complexity tracking

none

## Open questions

- Owner: claim the npm name `create-stackra` and allow its npmjs publish (an exception to ADR 0453's "only the
  Stackra registry"). Until then the member stays private.
