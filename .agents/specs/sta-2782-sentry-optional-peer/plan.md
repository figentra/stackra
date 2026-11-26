# Implementation Plan: @sentry/vite-plugin is an optional peer of @stackra/vite-plugin

**Spec**: `.agents/specs/sta-2782-sentry-optional-peer/spec.md` · **Linear**: STA-2782 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2782-sentry-optional-peer/spec.md`

## Summary

`@sentry/vite-plugin` moves from `dependencies` to an optional peer (and a devDependency for the tests). A shared
internal `importOptionalPeer(load, name, instruction)` turns a missing optional peer into one error that says what to
add and passes any other import failure on unchanged; `sentryPlugin` and `pwaPlugin` both use it. A manifest test holds
both optional peers and their lazy loading.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/vite-plugin` (`@stackra/vite-plugin`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022)
- **Storage**: none
- **Runtime target**: node (inside a Vite build)

## Constitution Check

| Law                                   | Result | Note                                                     |
| ------------------------------------- | ------ | -------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | only `@stackra/vite-plugin` changes                      |
| Secrets (ADR 0009)                    | PASS   | no secret is read or named; ADR 0173 unchanged           |
| Security                              | PASS   | a smaller install tree; no new code path reads input     |
| HTTP and events                       | N/A    | no route, header or event                                |
| Tenancy                               | N/A    | no tenant data                                           |
| Delegation                            | PASS   | one session, one branch                                  |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                   |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file       |
| Versions and catalogs                 | PASS   | the peer keeps `catalog:frontend`; no version changes    |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                        |
| Licence tier (ADR 0077)               | PASS   | free; consumers no longer receive the FSL-1.1-MIT binary |
| Docs and ADRs                         | PASS   | README, AGENTS.md and a changeset; ADR 0184 unchanged    |

## Deploy modes

| Mode       | Behaviour                                                                    |
| ---------- | ---------------------------------------------------------------------------- |
| SaaS       | a release job that uploads source maps adds `@sentry/vite-plugin` to the app |
| On-prem    | same; most on-prem builds upload nothing and install no Sentry package       |
| Air-gapped | same; no Sentry binary is fetched unless the member adds the package         |

## Correctness properties

- **P-001**: for each optional peer, the manifest has it in `peerDependencies` with `optional: true`, in `devDependencies` at the same range, and not in `dependencies` — Validates: FR-001
- **P-002**: for each optional peer, exactly one source file imports it dynamically and none imports it as a value — Validates: FR-002
- **P-003**: a load that fails with `ERR_MODULE_NOT_FOUND` naming the peer becomes one error with the instruction and the cause; any other failure is rethrown as the same object — Validates: FR-003, FR-004
- **P-004**: `viteConfig` calls `sentryPlugin` only when `sourcemaps` is set — Validates: FR-005

## Architecture overview

`viteConfig` already calls `sentryPlugin` only when `options.sourcemaps` is set, and `sentryPlugin` already imported the
package dynamically. The change is the manifest placement plus the error path: `importOptionalPeer` wraps the dynamic
import, matches the missing-package error on the peer's own name, and rethrows everything else.

## Components and responsibilities

- `importOptionalPeer` (`src/core/functions/import-optional-peer.function.ts`): the shared optional-peer import.
- `sentryPlugin` (`src/core/functions/sentry-plugin.function.ts`): loads the Sentry plugin through it, with a test seam.
- `pwaPlugin` (`src/core/functions/pwa-plugin.function.ts`): its private copy of the same logic is replaced by it.
- `package.json`: the peer, its `optional` flag and the devDependency.

## Files and folders

```text
packages/developer/vite-plugin/
├── AGENTS.md
├── README.md
├── package.json
└── src/core/
    ├── __tests__/optional-peers.test.ts
    └── functions/
        ├── import-optional-peer.function.ts
        ├── pwa-plugin.function.ts
        ├── sentry-plugin.function.ts
        └── __tests__/
            ├── sentry-plugin.function.test.ts
            ├── sentry-plugin-lazy.function.test.ts
            └── vite-config.function.test.ts
.changeset/
└── vite-plugin-sentry-optional-peer.md
```

- `packages/developer/vite-plugin/package.json`
- `packages/developer/vite-plugin/src/core/functions/import-optional-peer.function.ts`
- `packages/developer/vite-plugin/src/core/functions/sentry-plugin.function.ts`
- `packages/developer/vite-plugin/src/core/functions/pwa-plugin.function.ts`
- `packages/developer/vite-plugin/src/core/__tests__/optional-peers.test.ts`
- `packages/developer/vite-plugin/src/core/functions/__tests__/sentry-plugin.function.test.ts`
- `packages/developer/vite-plugin/src/core/functions/__tests__/sentry-plugin-lazy.function.test.ts`
- `packages/developer/vite-plugin/src/core/functions/__tests__/vite-config.function.test.ts`
- `packages/developer/vite-plugin/README.md`, `packages/developer/vite-plugin/AGENTS.md`, `pnpm-lock.yaml`,
  `.changeset/vite-plugin-sentry-optional-peer.md`

## Data models and migrations

none

## Contracts

- `package.json`: `peerDependencies["@sentry/vite-plugin"] = "catalog:frontend"` (5.4.1 when published),
  `peerDependenciesMeta["@sentry/vite-plugin"] = { optional: true }`; removed from `dependencies`.
- No exported symbol changes; `stackra.viteConfig` keeps its signature and options.

## Error handling

With the `sourcemaps` option on and the peer missing: `Error("Uploading source maps to Sentry needs
@sentry/vite-plugin, an optional peer of @stackra/vite-plugin: add it to this member (`pnpm add -D
@sentry/vite-plugin`), or turn the `sourcemaps` option off", { cause })`. Any other failure is rethrown as is.

## Security and tenancy

Nothing new is read. The Sentry plugin still reads its token and organisation from the release job's environment
(ADR 0173), and its telemetry stays off (ADR 0184).

## Testing strategy

- AC-001: `optional-peers.test.ts` (manifest placement) plus the packed-consumer resolution recorded in the PR.
- AC-002: `vite-config.function.test.ts` ("never asks for the Sentry plugin … unless the sourcemaps option is on") and
  `sentry-plugin-lazy.function.test.ts`.
- AC-003: `sentry-plugin.function.test.ts` ("says what to add when the package is not installed", the two pass-on cases).
- AC-004: `sentry-plugin.function.test.ts` ("uploads to the project and deletes the maps").
- Revert check: against main's `package.json` and `sentry-plugin.function.ts`, four of these tests fail.

## Rollout

A minor changeset for `@stackra/vite-plugin`, which tells source-map users to add `@sentry/vite-plugin`. No member here
or in the template sets the option today.

## Delegation and risk plan

One session, one branch. Follow-up: the two licence exceptions go back to scope `tool` once `tools/policy/licences.json`
lands on main (#1043).

## ADRs

ADR 0184 (telemetry), ADR 0173 (no secret in a tool config), ADR 0022 (test placement): all Accepted.

## Docs

`packages/developer/vite-plugin/README.md`, `packages/developer/vite-plugin/AGENTS.md`,
`.changeset/vite-plugin-sentry-optional-peer.md`.

## Complexity tracking

none
