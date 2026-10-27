/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/payments (the gateway fake, the gateways fake, the
 *          Market defaults fake, the recorded-answer ECR link fake and the recorded-case runners for payout and
 *          dispute Connections) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Test support only; never imported by production code.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0269; the STA-347 stand-in barrel decision.
 */
export { ConnectedAccountLimitsFake } from "#testing/connected-account-limits.fake";
export { EcrLinkFake } from "#testing/ecr-link.fake";
export type { DisputeCase } from "#testing/dispute-case.type";
export type { EcrLinkCall } from "#testing/ecr-link-call.type";
export type { GatewayCaseResult } from "#testing/gateway-case-result.type";
export { MarketPaymentDefaultsFake } from "#testing/market-payment-defaults.fake";
export { PaymentGatewayFake } from "#testing/payment-gateway.fake";
export { PaymentGatewaysFake } from "#testing/payment-gateways.fake";
export type { PayoutCase } from "#testing/payout-case.type";
export { runDisputeCase } from "#testing/run-dispute-case.function";
export { runPayoutCase } from "#testing/run-payout-case.function";
