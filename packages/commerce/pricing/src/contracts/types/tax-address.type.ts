/**
 * Stackra file contract:
 * Purpose: `TaxAddress`, where a sale is taxed: the buyer's country, and the region and postal code a sub-national
 *          sales tax needs (ADR 0244 decision 9: tax is destination-based).
 * Boundary: a type only, picked from the one `Address` of `@stackra/validation`, so a checkout address passes to tax
 *           as it is. `country` is ISO 3166-1 alpha-2 and `region` the ISO 3166-2 subdivision suffix (`NY`), both as
 *           the caller has them; a missing part is left out. A provider driver may need the postal code, the rate
 *           table does not.
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decision 9); the OS-109 answer (own tables, a provider where the market needs one);
 *                     STA-1383 (one home for duplicated value types).
 */
import type { Address } from "@stackra/validation";

/**
 * The destination of a taxed sale: the country, and the region and postal code where the country taxes below the
 * national level.
 *
 * @example
 * const destination: TaxAddress = { country: "US", region: "NY", postalCode: "10001" };
 */
export type TaxAddress = Pick<Address, "country" | "region" | "postalCode">;
