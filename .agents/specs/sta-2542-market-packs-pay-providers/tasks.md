# Tasks: market packs list payment providers under a key the pack grammar accepts

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2542

- [x] T001 the defaults driver reads `payments.byo_providers` (covers: AC-001) — `packages/commerce/payments/src/node/drivers/market-pack-payment-defaults.driver.ts`
- [x] T002 the base schema registers the key (covers: AC-002) — `packages/foundation/market-packs/src/core/constants/base-pack-schemas.constant.ts`
- [x] T003 the ae, sa and eg packs list their providers, with a data test (covers: AC-003) — `packages/foundation/market-packs/assets/data/packs/ae.json`, `packages/foundation/market-packs/src/core/__tests__/mena-packs.test.ts`
