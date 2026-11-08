/**
 * Stackra file contract:
 * Purpose: `checkForkingPeers(pkg)`, the findings of a library whose peers would fork its dependents' installs: a
 *          test-only package declared as a peer, or the web renderer declared as an optional one (`FORKING_PEERS`).
 * Boundary: pure: reads the parsed package.json only.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the peers-that-fork fix (2026-11-08).
 */
import { FORKING_PEERS } from "#node/constants/forking-peers.constant";
import type { PackageManifest } from "#node/types/package-manifest.type";

/** Whether `name` is `entry`, or under it when `entry` is a scope prefix (`@testing-library/`). */
const matches = (name: string, entry: string): boolean =>
  entry.endsWith("/") ? name.startsWith(entry) : name === entry;

/**
 * The forking-peer findings of one library.
 *
 * @example
 * checkForkingPeers({ name: "@stackra/database", peerDependencies: { "@electric-sql/pglite": "catalog:" } });
 * // ["peerDependencies.@electric-sql/pglite is test-only: …"]
 */
export function checkForkingPeers(pkg: PackageManifest): string[] {
  const out: string[] = [];
  const testLibrary = pkg.name !== undefined && FORKING_PEERS.testLibraries.includes(pkg.name);
  for (const name of Object.keys(pkg.peerDependencies ?? {})) {
    if (!testLibrary && FORKING_PEERS.testOnly.some((entry) => matches(name, entry)))
      out.push(
        `peerDependencies.${name} is test-only: a peer some members install and others do not forks every dependent's install; list it in devDependencies and load it from the member running the tests`,
      );
    if (
      FORKING_PEERS.requiredOnly.includes(name) &&
      pkg.peerDependenciesMeta?.[name]?.optional === true
    )
      out.push(
        `peerDependencies.${name} is optional: an optional peer forks every dependent's install by whether the member has it; make it required`,
      );
  }
  return out;
}
