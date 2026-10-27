/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/i18n, the leaf entry with the provider ports
 *          (`TranslationProvider`, `Geocoder`, `AddressAutocomplete`) and the types they exchange, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. Each port is
 *           exported here only, never from `.` (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AddressAutocomplete } from "#contracts/ports/address-autocomplete.port";
export { Geocoder } from "#contracts/ports/geocoder.port";
export { TranslationProvider } from "#contracts/ports/translation-provider.port";
export type { AddressSuggestion } from "#contracts/types/address-suggestion.type";
export type { AutocompleteQuery } from "#contracts/types/autocomplete-query.type";
export type { GeocodeQuery } from "#contracts/types/geocode-query.type";
export type { GeocodeResult } from "#contracts/types/geocode-result.type";
export type { TranslationRequest } from "#contracts/types/translation-request.type";
