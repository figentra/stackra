/**
 * Stackra file contract:
 * Purpose: `PackageDefinition`, what a package member's `stackra.config.ts` passes to `definePackage`: nothing,
 *          because gen derives a package's key, entries, root module and Explorer from its folders.
 * Boundary: a type only; any option is a type error, so a package cannot restate a derived fact.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 1), ADR 0294 (decisions 12 and 15).
 */

/** The definition of a package member: always `{}`. */
export type PackageDefinition = { readonly [option: string]: never };
