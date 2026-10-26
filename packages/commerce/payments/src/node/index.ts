/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/payments (the root module and the market-pack
 *          `MarketPaymentDefaults` driver) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The `PaymentService` and the isomorphic drivers stay in `.`, the
 *           ports in `./contracts`, so no symbol is exported from two entries.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { MarketPackPaymentDefaultsDriver } from "#node/drivers/market-pack-payment-defaults.driver";
export { PaymentsModule } from "#node/payments.module";
