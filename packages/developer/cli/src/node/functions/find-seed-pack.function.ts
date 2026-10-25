/**
 * Stackra file contract:
 * Purpose: `findSeedPack(cwd, product)`, the folder of a product's seed pack: the nearest `seed-packs/<product>/`
 *          holding a `seed-pack.yaml`, from `cwd` up to the file-system root, so the command runs from the service that
 *          owns the seed runner while the pack sits at the product repository's root.
 * Boundary: reads folder existence only.
 * Runtime: node
 * Governing contract: config-model section 6 (one `seed-pack:<product>` in the product's repository).
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

import { CliUsageError } from "#node/errors/cli-usage.error";

/**
 * The pack folder of `product`.
 *
 * @param cwd - where the search starts.
 * @param product - the product key, kebab-case.
 * @throws CliUsageError when the product key is not kebab-case or no pack is found.
 * @example
 * findSeedPack("/repo/services/commerce", "commerce"); // "/repo/seed-packs/commerce"
 */
export function findSeedPack(cwd: string, product: string): string {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(product))
    throw new CliUsageError(`a product key is kebab-case: ${product}`);
  for (let folder = cwd; ; folder = dirname(folder)) {
    const pack = join(folder, "seed-packs", product);
    if (existsSync(join(pack, "seed-pack.yaml"))) return pack;
    if (dirname(folder) === folder) break;
  }
  throw new CliUsageError(
    `no seed-packs/${product}/seed-pack.yaml at or above ${cwd}; create it with \`stackra new seed-pack ${product}\``,
  );
}
