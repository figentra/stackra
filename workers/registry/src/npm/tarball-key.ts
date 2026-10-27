/**
 * Stackra file contract:
 * Purpose: `tarballKey`: the R2 key of a tarball.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */

/** The R2 key of a tarball. */
export const tarballKey = (name: string, version: string): string =>
  `tarballs/${name}/${version}.tgz`;
