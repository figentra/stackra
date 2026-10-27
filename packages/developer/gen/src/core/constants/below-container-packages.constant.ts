/**
 * Stackra file contract:
 * Purpose: `BELOW_CONTAINER_PACKAGES`, the packages that sit below `@stackra/container` (the container's only
 *          dependency), whose drivers extend their port directly because they cannot call `Driver(port)`.
 * Boundary: a frozen set of package names, in step with the `base-matches-suffix` lint's `BELOW_CONTAINER` path of
 *           `@stackra/coding-standard`. Read by `checkConventions` (no `kind_suffix_mismatch` for a port-kind class in a
 *           `.driver.ts` file there) and the source reader (its constructor is built by hand, so no tokens are read).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (R3, decision 16); STA-1365 (item 4).
 */

/** The package names below the container. */
export const BELOW_CONTAINER_PACKAGES: ReadonlySet<string> = new Set(["@stackra/contracts"]);
