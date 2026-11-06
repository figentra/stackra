# Implementation Plan: gen binds Menu, Shortcut, Store, Bridge and ExtensionPoint; a config override keeps its base's key

**Spec**: `.agents/specs/sta-2055-wiring-kind-bindings/spec.md` · **Linear**: STA-2055 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2055-wiring-kind-bindings/spec.md`

## Summary

Add the five kind codes to gen's `BINDING_KINDS`, give `emitWiring` a kind lifetime (a Bridge is request-scoped when
it carries no `@Lifetime`), and compute a config override's key from its base once, used by the config row, the driver
selector and the link step's dedupe. Add the two missing codes to the container's `BINDING_KINDS`, correct ADR 0294's
Extension point row by an amendment note, and prove the point binding with a loyalty-kit container test.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`); `packages/foundation/container` (`tier:lib`);
  `packages/commerce/loyalty-kit` (`tier:lib`, test only); `apps/docs` (`tier:app`, one ADR note)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); every run on ci-box
- **Storage**: none
- **Runtime target**: a library (gen's emitter; the container's constant)

## Constitution Check

| Law                                   | Result | Note                                                                     |
| ------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | lib-only edits; gen still never imports a member's source                |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                               |
| Security                              | PASS   | a bridge's main-process checks are unchanged                             |
| HTTP and events                       | N/A    | no endpoint or event changes                                             |
| Tenancy                               | N/A    | no tenant data                                                           |
| Delegation                            | PASS   | one worktree, one package boundary (gen) plus two one-line edits         |
| Not built yet (ADR 0011)              | PASS   | nothing from the table is introduced; wiring stays build-time (ADR 0227) |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside their subjects                              |
| Versions and catalogs                 | PASS   | no dependency or catalog change                                          |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                        |
| Licence tier (ADR 0077)               | PASS   | free                                                                     |
| Docs and ADRs                         | PASS   | ADR 0294 amendment note; gen AGENTS.md                                   |

## Deploy modes

| Mode       | Behaviour             |
| ---------- | --------------------- |
| SaaS       | same generated wiring |
| On-prem    | same generated wiring |
| Air-gapped | same generated wiring |

## Correctness properties

- **P-001**: for every kind code in {menu, shortcut, store, bridge, extension_point}, a declared class of that kind
  yields exactly one binding row with that kind and its constructor tokens — Validates: FR-001, FR-004
- **P-002**: a binding's printed lifetime is its `@Lifetime` when present, else `request` for a bridge, else none —
  Validates: FR-002, FR-003
- **P-003**: for a config override, the wiring holds exactly one row whose provide token is the base, keyed with the
  base's key, and the selector of a port it selects uses that key — Validates: FR-005, FR-006, FR-007
- **P-004**: every code in gen's `BINDING_KINDS` that `@Lifetime` may mark is in the container's `BINDING_KINDS` —
  Validates: FR-008
- FR-009 is example-only (a docs note).

## Architecture overview

`emitWiring` walks `ir.classes` once for bindings (`BINDING_KINDS`) and once for configs. The binding walk gains a
kind-lifetime fallback. The config walk and the selector walk share one function that returns a config class's key:
for an override, the base package's manifest `config` entry for the base class (read through the existing
`dependencyConfigs`), else `configKeyOf(base.name, memberOf(base.from))`; for an own class, `configKeyOf(name,
ir.member)`. `memberOf` moves above the config walk unchanged. The link step's dedupe (`configKeys`) then already
holds the base's key, so it adds no second row.

## Components and responsibilities

- `BINDING_KINDS` (gen): the five codes, alphabetical with the rest.
- `KIND_LIFETIMES` (a private constant in `emit-wiring.function.ts`): `{ bridge: "request" }`; a Store needs no entry
  (singleton is the container default).
- `configKeyFor(declared)` (a private function in `emit-wiring.function.ts`): the key of a config class, own or
  override.
- `BINDING_KINDS` (container): gains `shortcut` and `extension_point`.

## Files and folders

- `packages/developer/gen/src/core/constants/binding-kinds.constant.ts` (rows and file contract)
- `packages/developer/gen/src/core/constants/__tests__/binding-kinds.constant.test.ts` (new)
- `packages/developer/gen/src/core/functions/emit-wiring.function.ts` (lines ~406-441, ~482, ~506-532)
- `packages/developer/gen/src/core/functions/__tests__/emit-wiring.function.test.ts`
- `packages/developer/gen/AGENTS.md` (binding kinds note)
- `packages/foundation/container/src/core/constants/binding-kinds.constant.ts` and its existing test
- `packages/commerce/loyalty-kit/src/node/services/__tests__/account.service.test.ts` (one container case)
- `apps/docs/src/docs/adr/0294-programming-model-v3-grammar-folders-identities-and-naming.mdx` (amendment note)
- `.changeset/<slug>.md` for `@stackra/gen` and `@stackra/container` (patch)

## Data models and migrations

none

## Contracts

The generated `#stackra/wiring` gains rows (additive). `@stackra/container`'s exported `BINDING_KINDS` gains two
codes (additive). No manifest, action, event or API change.

## Error handling

No new refusal. A config override whose base package is not a declared dependency falls back to the snake-cased
package name, as `memberOf` already does.

## Security and tenancy

none

## Testing strategy

- AC-001, AC-002: `emit-wiring.function.test.ts` adds one class of each kind to `COMMERCE_IR` and asserts the five
  rows, the Bridge's `Lifetime.Request`, an explicit `@Lifetime` winning, and the Store's row without a lifetime.
- AC-004: `emit-wiring.function.test.ts` builds a host IR (member `web`) with `LoyaltyKitConfig` whose base is the
  kit's `LoyaltyKitConfig` (`own: false`), the kit's manifest from `buildManifest(LOYALTY_KIT_IR)`, and a service that
  injects the kit's config; it asserts one `key: "loyalty_kit"` row with `override:` and no `web.loyalty_kit`.
- AC-003: loyalty-kit's `account.service.test.ts` resolves `AccountService` from
  `createTestingModule(LoyaltyKitModule).useDrivers("memory")`, overriding only the tokens that need a running request.
- AC-005: the new gen `binding-kinds.constant.test.ts` (frozen, unique, snake_case, holds the five) and the container's
  existing `binding-kinds.constant.test.ts` (holds `shortcut` and `extension_point`).
- On ci-box: `stackra gen` for gen, container, loyalty-kit, platform and peripherals, then their typecheck and test,
  and gen's `golden.test.ts` (no golden fixture declares one of the five kinds, so no expected file should change;
  a change is a finding).

## Rollout

None: generated output changes on the next `stackra gen`. A patch changeset for `@stackra/gen` and
`@stackra/container`.

## Delegation and risk plan

One executor in one worktree (route `gen`). The `emit-wiring.function.ts` chain is wp-03 → wp-59 → wp-101 and
wp-03 → wp-62 → wp-103, so this lands first. Merge origin/main in before shipping (STA-2044 to 2047 touch other gen
files). Risk: a package's bridge tokens pull another package's driver table into that package's wiring; the box run
of platform and peripherals catches a typecheck or resolution break.

## ADRs

Relies on ADR 0294 (decisions 16, 17 and 20), ADR 0305 (rules 22 to 25), ADR 0265 (decision 4), ADR 0251 (bridges),
ADR 0263. Opens no new ADR; adds a dated amendment note to ADR 0294.

## Docs

- `apps/docs/src/docs/adr/0294-programming-model-v3-grammar-folders-identities-and-naming.mdx`
- `packages/developer/gen/AGENTS.md`

## Complexity tracking

none
