/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/payments (the gateway fake, the gateways fake and the
 *          Market defaults fake) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Test support only; never imported by production code.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0269; the STA-347 stand-in barrel decision.
 */
export { ConnectedAccountLimitsFake } from "#testing/connected-account-limits.fake";
export { MarketPaymentDefaultsFake } from "#testing/market-payment-defaults.fake";
export { PaymentGatewayFake } from "#testing/payment-gateway.fake";
export { PaymentGatewaysFake } from "#testing/payment-gateways.fake";
