/**
 * Stackra file contract:
 * Purpose: `FORKING_PEERS`, the peers that fork a library's install: pnpm gives a package one variant per set of
 *          resolved peers, so a peer one member installs and another does not splits every dependent in two (two
 *          copies of @stackra/integrations, whose classes then fail each other's checks). A test-only package is never a
 *          peer (the testing entry finds it in the member's devDependencies); the web renderer is a required peer.
 * Boundary: data only; `checkForkingPeers` reads it. A name ending in `/` is a scope prefix.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: test peers); the peers-that-fork fix (2026-11-08).
 */

/**
 * The test-only packages a library never declares as a peer, the peers it declares only as required, and the libraries
 * that are test-only themselves (only ever a devDependency, so their peers never reach a real install).
 */
export const FORKING_PEERS: {
  readonly testOnly: readonly string[];
  readonly requiredOnly: readonly string[];
  readonly testLibraries: readonly string[];
} = {
  testOnly: [
    "@electric-sql/pglite",
    "@electric-sql/pglite-pgvector",
    "@electric-sql/pglite-postgis",
    "@faker-js/faker",
    "@mikro-orm/pglite",
    "@testcontainers/",
    "@testing-library/",
    "testcontainers",
  ],
  requiredOnly: ["react-dom"],
  testLibraries: ["@stackra/testing"],
};
