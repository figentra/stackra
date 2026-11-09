# Implementation Plan: market packs list payment providers under a key the pack grammar accepts

**Spec**: `.agents/specs/sta-2542-market-packs-pay-providers/spec.md` · **Linear**: STA-2542 · **Date**: 2026-11-06

**Input**: Feature specification from `.agents/specs/sta-2542-market-packs-pay-providers/spec.md`

## Summary

`MarketPackPaymentDefaultsDriver` reads `payments.byo-providers`, which `MarketPack$` can never hold (keys have no
hyphens). The key becomes `payments.byo_providers`, `BASE_PACK_SCHEMAS` registers it, and the ae, sa and eg draft packs
list their launch providers.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/commerce/payments` (commerce), `packages/foundation/market-packs` (foundation)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022)
- **Storage**: none
- **Runtime target**: a library

## Constitution Check

| Law                                   | Result | Note                                             |
| ------------------------------------- | ------ | ------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import between members                    |
| Secrets (ADR 0009)                    | N/A    | no secret is read or added                       |
| Security                              | PASS   | pack data is public market facts                 |
| HTTP and events                       | N/A    | no endpoint or event changes                     |
| Tenancy                               | N/A    | packs are not tenant data                        |
| Delegation                            | PASS   | Claude only                                      |
| Not built yet (ADR 0011)              | PASS   | the key rename touches only shipped code         |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`                       |
| Versions and catalogs                 | PASS   | a changeset patches both packages                |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                        |
| Docs and ADRs                         | PASS   | the payments README and ADR 0378's key reference |

## Deploy modes

| Mode       | Behaviour                                         |
| ---------- | ------------------------------------------------- |
| SaaS       | packs ship in the package; the same everywhere    |
| On-prem    | packs ship in the package; the same everywhere    |
| Air-gapped | packs ship in the package; no outbound call added |

## Correctness properties

- **P-001**: the defaults driver returns a Market's live providers in pack order from `payments.byo_providers` —
  Validates: AC-001
- **P-002**: a pack carrying the key passes `PackSchemaRegistry.check` with no issue — Validates: AC-002
- **P-003**: the ae, sa and eg packs resolve (drafts allowed) to their providers in order — Validates: AC-003

## Architecture overview

A payments host resolves a Market's pack, and `MarketPackPaymentDefaultsDriver` reads the provider list from it. Only
the key name and the data change; the flow is unchanged.

## Components and responsibilities

- `MarketPackPaymentDefaultsDriver`: reads `payments.byo_providers` (was the hyphenated key).
- `BASE_PACK_SCHEMAS`: owns the schema of `payments.byo_providers`.
- The ae, sa and eg packs: hold the provider lists.

## Files and folders

```text
packages/commerce/payments/
  README.md
  src/node/drivers/market-pack-payment-defaults.driver.ts
  src/node/drivers/__tests__/market-pack-payment-defaults.driver.test.ts
  src/node/drivers/__tests__/market-pack-payment-pack-source.driver.test.ts
packages/communication/integrations/
  src/core/constants/provider-catalogue-seeds.constant.ts
packages/foundation/market-packs/
  assets/data/packs/ae.json
  assets/data/packs/sa.json
  assets/data/packs/eg.json
  src/core/constants/base-pack-schemas.constant.ts
  src/core/__tests__/mena-packs.test.ts
apps/docs/src/docs/adr/
  0378-card-terminals-server-driven-and-tap-to-pay-stripe-terminal-square-and-adyen.mdx
.changeset/
  sta-2542-pack-payment-providers.md
```

## Data models and migrations

none

## Contracts

The pack key `payments.byo_providers` replaces `payments.byo-providers`. No shipped pack used the old key, so nothing
breaks.

## Error handling

none changed: a Market whose pack lists none still offers none, and an unregistered key still fails the registry check.

## Security and tenancy

none

## Testing strategy

- AC-001: the driver's unit tests on the renamed key.
- AC-002: `registry.check` returns no issue for the three packs (`mena-packs.test.ts`).
- AC-003: `mena-packs.test.ts` reads each Market's list and order.

## Rollout

A patch changeset for `@stackra/payments` and `@stackra/market-packs`. Figentra Pay picks the release up after its W1
(figentra/pay#61), which already reads the defaults through this driver.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

ADR 0378 (Accepted): its text names the key, and the reference is corrected.

## Docs

`packages/commerce/payments/README.md`.

## Complexity tracking

none
