/**
 * Stackra file contract:
 * Purpose: `uploadBundle(bundle, product, bucket, run)`, uploads every file of one built bundle to the asset store
 *          (R2) under `<product>/<surface>/<version>/<file>` with `wrangler r2 object put --remote`, immutable cache
 *          headers and the content type of its extension, and answers the object keys.
 * Boundary: runs wrangler only, through the command runner; wrangler's own login holds the credentials. Never deletes
 *           an older version: a rollback moves the release pointer back to it (ADR 0436 decision 4).
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); app-shells 4.2 (step 2).
 */
import { readdirSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";

import { EDGE_PUBLISH_SETTINGS } from "#node/constants/edge-publish-settings.constant";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { EdgeBundle } from "#node/types/edge-bundle.type";

/**
 * The keys uploaded, sorted.
 *
 * @example
 * await uploadBundle(bundle, "mezzora", "figentra-assets", runCommand);
 */
export async function uploadBundle(
  bundle: EdgeBundle,
  product: string,
  bucket: string,
  run: CommandRunner,
): Promise<string[]> {
  const { wrangler, cacheControl, contentTypes } = EDGE_PUBLISH_SETTINGS;
  const prefix = `${product}/${bundle.surface}/${bundle.manifest.version}`;
  const files = readdirSync(bundle.folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative(bundle.folder, join(entry.parentPath, entry.name)).split(sep).join("/"),
    )
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort();
  const keys: string[] = [];
  for (const file of files) {
    const key = `${prefix}/${file}`;
    const type = contentTypes[extname(file)];
    await run(
      wrangler,
      [
        "r2",
        "object",
        "put",
        `${bucket}/${key}`,
        `--file=${join(bundle.folder, file)}`,
        `--cache-control=${cacheControl}`,
        ...(type === undefined ? [] : [`--content-type=${type}`]),
        "--remote",
      ],
      {},
    );
    keys.push(key);
  }
  return keys;
}
