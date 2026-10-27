/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/pricing, the leaf entry of the `TaxProvider` port, the
 *          types its signature names and the `TaxGateway` a provider Connection implements, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. The port is
 *           exported from here only (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { TaxProvider } from "#contracts/ports/tax-provider.port";
export type { TaxAddress } from "#contracts/types/tax-address.type";
export type { TaxGateway } from "#contracts/types/tax-gateway.type";
export type { TaxLine } from "#contracts/types/tax-line.type";
export type { TaxQuote } from "#contracts/types/tax-quote.type";
export type { TaxRequest } from "#contracts/types/tax-request.type";
export type { TaxedLine } from "#contracts/types/taxed-line.type";
