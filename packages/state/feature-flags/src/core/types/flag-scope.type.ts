/**
 * Stackra file contract:
 * Purpose: `FlagScope`, a level of the settings cascade a flag may be set at: platform, product, tenant, node or user.
 * Boundary: a type only, the scope codes as typed literals. The scope enum itself is contributed by the tenancy and
 *           settings packages above this one, whose codes are these strings, so a generated ref that names
 *           `SettingScope.Platform` type-checks here without this package importing them.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decisions 22 and 25: the scopes, a flag's `scopes`); ADR 0213 (decision 2: cascade).
 */

/** One scope code a flag may be set at. */
export type FlagScope = "platform" | "product" | "tenant" | "node" | "user";
