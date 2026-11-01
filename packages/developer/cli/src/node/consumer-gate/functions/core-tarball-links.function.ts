/**
 * Stackra file contract:
 * Purpose: `coreTarballLinks(packs, dest)`, the rows pack mode rewrites a consumer's workspace with:
 *          `{ "<name>": "file:<dest>/<scope>-<name>-<version>.tgz" }`, the file name `pnpm pack` gives a package.
 *          The rows go through `linkConsumerWorkspace`, which rewrites the catalog and `overrides:` alike.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import type { ConsumerGateCorePack } from "#node/consumer-gate/types/consumer-gate-core-pack.type";

/**
 * The tarball rows.
 *
 * @param packs - the packed packages.
 * @param dest - the absolute folder the tarballs are in.
 * @example
 * coreTarballLinks([{ name: "@stackra/model", version: "0.3.0", dir: "/c" }], "/o/tarballs");
 * // { "@stackra/model": "file:/o/tarballs/stackra-model-0.3.0.tgz" }
 */
export function coreTarballLinks(
  packs: readonly Pick<ConsumerGateCorePack, "name" | "version">[],
  dest: string,
): Record<string, string> {
  return Object.fromEntries(
    packs.map(({ name, version }) => [
      name,
      `file:${dest}/${name.replace(/^@/, "").replace("/", "-")}-${version}.tgz`,
    ]),
  );
}
