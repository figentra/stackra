# Implementation Plan: the CLI's doctor, dev tunnel and starter carry no Figentra-internal advice

**Spec**: `.agents/specs/sta-2859-cli-residue/spec.md` · **Linear**: STA-2859 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2859-cli-residue/spec.md`

## Summary

Doctor finds tools through a new `commandOnPath` (a `PATH` walk with Windows `Path` / `PATHEXT` rules) instead of
`which`. The network row moves into a pure `networkCheck(hosts, probes)` whose fix names generic steps, and
`doctorChecks` takes an optional `deps.probe` so tests inject the network. The registry, Google login and secrets rows,
the tunnel's refusal and usage, a new service's `runway.yaml` header and `stackra mcp exec`'s error drop every
Figentra repository, script and person. `StarterManifest` profiles gain optional `exclude` globs, applied after
`include` and before overlays. The template's profiles exclude its fflow workflows (stackra-template, same key).

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/cli` (`@stackra/cli`), `packages/developer/mcp` (`@stackra/mcp`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); temporary folders and an injected file check and probe
- **Storage**: none
- **Runtime target**: node (the CLI); `mcpExecCommand` is isomorphic

## Constitution Check

| Law                                   | Result | Note                                                             |
| ------------------------------------- | ------ | ---------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI keeps its imports; no new package edge                   |
| Secrets (ADR 0009)                    | PASS   | names only; no value is read or printed                          |
| Security                              | PASS   | doctor stays read-only; the lookup reads file metadata only      |
| HTTP and events                       | N/A    | no route, header or event changes                                |
| Tenancy                               | N/A    | no tenant data                                                   |
| Delegation                            | PASS   | one session, one branch per repository                           |
| Not built yet (ADR 0011)              | PASS   | `agents setup` stays unbuilt; the template stops calling it      |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file               |
| Versions and catalogs                 | PASS   | no dependency added                                              |
| Deploy modes (ADR 0076)               | N/A    | developer tooling                                                |
| Licence tier (ADR 0077)               | PASS   | free                                                             |
| Docs and ADRs                         | PASS   | README rows and changesets; refines ADR 0515 decision 5's filter |

## Deploy modes

| Mode       | Behaviour                     |
| ---------- | ----------------------------- |
| SaaS       | unchanged (developer tooling) |
| On-prem    | unchanged                     |
| Air-gapped | unchanged                     |

## Correctness properties

- **P-001**: for every environment and platform, `commandOnPath(c)` is true only when some `PATH` folder (or `c` itself, when it has a folder) holds a startable file named `c` plus one tried extension — Validates: FR-001
- **P-002**: for every probe set, the network row's status is fail when a host has no answering address, warn when only some addresses fail, ok otherwise, and its fix matches no vendor product — Validates: FR-002
- **P-003**: for every workspace, no doctor row's name, detail or fix names `figentra/secrets`, `figentra/infra`, WARP or `secrets-exec` — Validates: FR-003
- **P-004**: for every starter manifest, a file is written iff it is an overlay target or (an include glob matches it and no exclude glob does and it is not the starter's own) — Validates: FR-007
- **P-005**: for every environment without `CLOUDFLARE_TUNNEL_TOKEN`, `stackra dev --tunnel` refuses before starting `cloudflared`, and neither its refusal nor the `dev` usage text names a Figentra script or repository — Validates: FR-004
- **P-006**: for every service name, the `runway.yaml` that `serviceTemplate` writes says secret values come from the secret store through runway and names no Figentra repository — Validates: FR-005
- **P-007**: for every `argv` that names a secret and no secrets checkout, `mcpExecCommand` refuses with an error that names `STACKRA_SECRETS_DIR` and its default `~/.stackra/secrets`, and no Figentra repository — Validates: FR-006

## Architecture overview

`doctorChecks` keeps its order of rows; only how it asks for a tool (`has`) and how the network row is built change.
`commandOnPath` and `networkCheck` are pure helpers beside it. `starterFiles` gains one module-level `matches(path,
globs)` used for both `include` and `exclude`.

## Components and responsibilities

- `commandOnPath` (`src/node/doctor/functions/command-on-path.function.ts`): the `PATH` walk.
- `networkCheck` (`src/node/doctor/functions/network-check.function.ts`): the network row.
- `doctorChecks` (`src/node/doctor/functions/doctor-checks.function.ts`): uses both; generic advice; `deps.probe`.
- `doctorGroup` (`src/node/doctor/functions/doctor-group.function.ts`): `secrets checkout` under Repo.
- `startTunnel`, `DEV_COMMAND`, `DEV_TUNNEL_SETTINGS`: the tunnel advice.
- `serviceTemplate`: the `runway.yaml` header.
- `starterFiles`, `StarterManifest`: `exclude`.
- `mcpExecCommand`, `McpExecOptions`, `execWithSecrets`: the checkout wording.

## Files and folders

```text
packages/developer/cli/
├── README.md
└── src/node/
    ├── constants/mcp-exec-command.constant.ts
    ├── create/
    │   ├── functions/starter-files.function.ts
    │   ├── functions/__tests__/create.test.ts
    │   └── types/starter-manifest.type.ts
    ├── dev-surface/constants/dev-command.constant.ts
    ├── dev-surface/constants/__tests__/dev-command.constant.test.ts
    ├── dev-tunnel/constants/dev-tunnel-settings.constant.ts
    ├── dev-tunnel/functions/start-tunnel.function.ts
    ├── dev-tunnel/functions/__tests__/start-tunnel.function.test.ts
    ├── doctor/functions/command-on-path.function.ts
    ├── doctor/functions/network-check.function.ts
    ├── doctor/functions/doctor-checks.function.ts
    ├── doctor/functions/doctor-group.function.ts
    ├── doctor/functions/google-credentials-path.function.ts
    ├── doctor/functions/__tests__/command-on-path.function.test.ts
    ├── doctor/functions/__tests__/network-check.function.test.ts
    ├── doctor/functions/__tests__/doctor-checks.function.test.ts
    ├── doctor/types/doctor-need.type.ts
    ├── functions/service-template.function.ts
    └── functions/__tests__/service-template.function.test.ts
packages/developer/mcp/src/
├── core/functions/mcp-exec-command.function.ts
├── core/functions/__tests__/mcp-exec-command.function.test.ts
├── core/types/mcp-exec-options.type.ts
└── node/functions/exec-with-secrets.function.ts
.changeset/
├── cli-no-internal-residue.md
└── mcp-exec-secrets-checkout.md
```

- `packages/developer/cli/src/node/doctor/functions/command-on-path.function.ts`
- `packages/developer/cli/src/node/doctor/functions/network-check.function.ts`
- `packages/developer/cli/src/node/doctor/functions/doctor-checks.function.ts`
- `packages/developer/cli/src/node/create/functions/starter-files.function.ts`
- `packages/developer/cli/src/node/create/types/starter-manifest.type.ts`
- `packages/developer/cli/src/node/dev-tunnel/functions/start-tunnel.function.ts`
- `packages/developer/cli/src/node/functions/service-template.function.ts`
- `packages/developer/mcp/src/core/functions/mcp-exec-command.function.ts`

## Data models and migrations

none

## Contracts

- `stackra.starter.yaml`: `profiles.<name>.exclude?: string[]` (new, optional). `StarterManifest` mirrors it.
- `doctorChecks(root, workspace, options?, deps?)`: `deps.probe?: (hosts) => Promise<HostProbe[]>` (new, optional;
  internal to the CLI, which exports no module entry).
- Doctor row `figentra/secrets clone` renamed `secrets checkout` (the `--json` `name`).

## Error handling

A malformed `exclude` refuses the manifest with the existing "not a version 1 starter manifest" error, now naming
`optional exclude`. `commandOnPath` treats any `stat` or access failure as not found.

## Security and tenancy

Doctor stays read-only: `commandOnPath` reads file metadata only and runs nothing. No message carries a secret value.

## Testing strategy

- AC-001, AC-002, AC-003: `doctor-checks.function.test.ts` (empty `PATH`, injected probe) and
  `network-check.function.test.ts`.
- AC-004: `command-on-path.function.test.ts` (temporary folders; an injected file check for Windows paths).
- AC-005: `start-tunnel.function.test.ts`, `dev-command.constant.test.ts`.
- AC-006: `create.test.ts` ("a profile's exclude globs ...", and the malformed `exclude` refusal).
- FR-004 (P-005): `start-tunnel.function.test.ts`, `dev-command.constant.test.ts`.
- FR-005 (P-006), FR-006 (P-007): `service-template.function.test.ts`, `mcp-exec-command.function.test.ts`.
- Revert check: with the previous `doctor-checks`, `doctor-group`, `start-tunnel`, `dev-command`, `starter-files` and
  `starter-manifest` sources, six of the new tests fail.

## Rollout

A minor changeset for `@stackra/cli`, a patch for `@stackra/mcp`. The template's `exclude` lines land in
stackra-template under the same key and take effect with the CLI release that carries this change.

## Delegation and risk plan

One session; one branch in core, one in stackra-template. Follow-ups: STA-2790 (fflow into `stackra`), the starter CI's
registry step.

## ADRs

ADR 0515 (decisions 3 and 5), ADR 0290 (decisions 4 and 5), ADR 0525, ADR 0027, ADR 0282 (decision 10: `agents setup`
not built): all Accepted.

## Docs

`packages/developer/cli/README.md`, `.changeset/cli-no-internal-residue.md`, `.changeset/mcp-exec-secrets-checkout.md`;
the template's `stackra.starter.yaml` header.

## Complexity tracking

none
