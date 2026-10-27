/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/shipping (the `CarrierGateways` fake) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: test helpers only; no runtime entry imports this one. Needs the optional peer @stackra/testing.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { CarrierGatewaysFake } from "#testing/carrier-gateways.fake";
