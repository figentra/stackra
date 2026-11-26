/**
 * Stackra file contract:
 * Purpose: `starterTarball(tgz)`, the template files of a packed `@stackra/starter`. The published starter (STA-2874,
 *          packages/developer/starter) nests the template as `dist/template.tgz`, so `pnpm pack` cannot drop its
 *          `.npmrc` or its `.gitignore` files; that archive's files come back whole. A tarball the template's
 *          `.github/scripts/pack-starter.mjs` made holds the template under `template/` beside a generated
 *          `package.json`; those files come back with the prefix removed. A tarball with neither is the template itself
 *          and comes back whole.
 * Boundary: pure; reads bytes only (`readTarball` refuses a path that climbs out, in the outer and the nested archive).
 * Runtime: node
 * Governing contract: ADR 0515 (decision 3); STA-2874; the template's `.github/scripts/pack-starter.mjs`.
 */
import { readTarball } from "#node/functions/read-tarball.function";

/** Where the published starter keeps the template archive (packages/developer/starter `ARCHIVE`). */
const NESTED = "dist/template.tgz";

/** Where a template-packed starter keeps the template's files. */
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
  const nested = files.get(NESTED);
  if (nested !== undefined) return readTarball(nested);
  if (![...files.keys()].some((path) => path.startsWith(PREFIX))) return files;
  return new Map(
    [...files]
      .filter(([path]) => path.startsWith(PREFIX))
      .map(([path, bytes]) => [path.slice(PREFIX.length), bytes]),
  );
}
