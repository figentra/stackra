# Tasks: market packs list payment providers under a key the pack grammar accepts

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2542

- [x] T001 the defaults driver reads the renamed key, with its tests, the README, the integrations seed comment and ADR 0378 in `packages/commerce/payments/src/node/drivers/market-pack-payment-defaults.driver.ts`, `packages/commerce/payments/src/node/drivers/__tests__/market-pack-payment-defaults.driver.test.ts`, `packages/commerce/payments/src/node/drivers/__tests__/market-pack-payment-pack-source.driver.test.ts`, `packages/commerce/payments/README.md`, `packages/communication/integrations/src/core/constants/provider-catalogue-seeds.constant.ts`, `apps/docs/src/docs/adr/0378-card-terminals-server-driven-and-tap-to-pay-stripe-terminal-square-and-adyen.mdx` — covers: AC-001, P-001 — route: spec-task
- [x] T002 the base schema registers the key in `packages/foundation/market-packs/src/core/constants/base-pack-schemas.constant.ts` — covers: AC-002, P-002 — route: spec-task — deps: T001
- [x] T003 the ae, sa and eg packs list their providers, with a data test, in `packages/foundation/market-packs/assets/data/packs/ae.json`, `packages/foundation/market-packs/assets/data/packs/sa.json`, `packages/foundation/market-packs/assets/data/packs/eg.json`, `packages/foundation/market-packs/src/core/__tests__/mena-packs.test.ts` — covers: AC-003, P-003 — route: spec-task — deps: T002
- [x] T004 the changeset in `.changeset/sta-2542-pack-payment-providers.md` — covers: AC-001 — route: spec-task — deps: T003
