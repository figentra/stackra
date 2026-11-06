# Plan: market packs list payment providers under a key the pack grammar accepts

**Spec**: [spec.md](./spec.md) · **Linear**: STA-2542 · **Tier**: feature

## Approach

1. Rename the key `payments.byo-providers` to `payments.byo_providers` in the defaults driver, its tests, the
   payments README, the integrations seed comment and ADR 0378's reference.
2. Register the key in `BASE_PACK_SCHEMAS`, with a provider-code pattern that allows hyphens.
3. Add the entries to the ae, sa and eg draft packs, and a data test of the lists and order.

## Verification (Testbed)

- market-packs, payments and integrations unit tests and typecheck.

Tasks: [tasks.md](./tasks.md)
