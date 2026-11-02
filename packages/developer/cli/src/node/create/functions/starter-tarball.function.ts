/**
 * Stackra file contract:
 * Purpose: `starterTarball(tgz)`, the template files of a packed `@stackra/starter`: the npm tarball holds the
 *          generated starter `package.json` beside the template under `template/` (so the template's own
 *          `package.json` does not collide with it); the files under `template/` come back with that prefix removed.
 *          A tarball without a `template/` folder is the template itself and comes back whole.
 * Boundary: pure; reads bytes only (`readTarball` refuses a path that climbs out).
 * Runtime: node
 * Governing contract: ADR 0515 (decision 3); the template's `.github/scripts/pack-starter.mjs`.
 */
import { readTarball } from "#node/functions/read-tarball.function";

/** Where the template sits inside the starter package. */
const PREFIX = "template/";

/**
 * The template files of a starter tarball.
 *
 * @param tgz - the gzipped starter tarball.
 * @example
 * starterTarball(bytes).get("stackra.starter.yaml");
 */
export function starterTarball(tgz: Uint8Array): Map<string, Uint8Array> {
  const files = readTarball(tgz);
  if (![...files.keys()].some((path) => path.startsWith(PREFIX))) return files;
  return new Map(
    [...files]
      .filter(([path]) => path.startsWith(PREFIX))
      .map(([path, bytes]) => [path.slice(PREFIX.length), bytes]),
  );
}
