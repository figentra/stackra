# Feature Specification: market packs list payment providers under a key the pack grammar accepts

**Feature Branch**: `figentra/sta-2542-market-packs-pay-providers`

**Created**: 2026-11-06

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2542

**Clarifications status**: complete

**Input**: Figentra Pay's routing (W1) asks each Market's pack which payment providers it offers, through
`MarketPackPaymentDefaultsDriver`. The driver reads `payments.byo-providers`, but `MarketPack$` accepts only dotted
lowercase keys without hyphens, so no valid pack can carry that key and every Market offers no provider. The ae, sa and
eg packs list none either.

### Sources

- `packages/commerce/payments/src/node/drivers/market-pack-payment-defaults.driver.ts` (the key it reads)
- `packages/foundation/market-packs/src/core/constants/market-pack-schema.constant.ts` (the key grammar)
- `packages/foundation/market-packs/src/core/constants/base-pack-schemas.constant.ts`
- ADR 0378; the owner's 2026-11-06 Pay suite answers (markets and providers); figentra/pay#61 (W1)
- `pnpm turbo run test --filter=@stackra/market-packs` on Testbed

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/commerce/payments (the defaults driver's key), packages/foundation/market-packs (a
  base schema, the ae, sa and eg packs, a test)
- **Public contract change**: the pack key becomes `payments.byo_providers`; no shipped pack used the old key
- **Cross-service events**: none
- **Tenancy and data**: none (pack data is public market facts)
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0378's reference to the key is corrected)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/commerce/payments/README.md
- **Lane**: full
- **Change risk**: R1 (a key rename nothing could use, and draft pack data)

## Acceptance criteria

- **AC-001**: THE payments defaults driver SHALL read the providers of a Market from `payments.byo_providers`.
- **AC-002**: THE base pack schemas SHALL register `payments.byo_providers` as a list of provider codes or
  `{ provider, status }`, where a code may contain hyphens.
- **AC-003**: THE ae, sa and eg packs SHALL list their launch payment providers in routing order from 2026-11-01.

## Status history

- 2026-11-06 → Clarified (the cause is in the pack key grammar; the providers are the owner's 2026-11-06 choice)
- 2026-11-06 → Planned (plan.md)
- 2026-11-06 → Tasked (tasks.md; built in the same branch)
