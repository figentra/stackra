/**
 * Stackra file contract:
 * Purpose: `readBundles(repository, surfaces)`, the built extension bundle of each named surface in a product
 *          checkout: the one `<bundleDir>/<surface>/<version>/` folder and its parsed manifest, whose version must
 *          match the folder.
 * Boundary: reads files only. A surface with no bundle folder, more than one version folder, or a missing or invalid
 *           manifest is an issue; every issue is reported at once.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); app-shells 4.2.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { BUNDLE_MANIFEST_SCHEMA } from "#node/constants/bundle-manifest-schema.constant";
import { EDGE_PUBLISH_SETTINGS } from "#node/constants/edge-publish-settings.constant";
import type { EdgeBundle } from "#node/types/edge-bundle.type";

/**
 * The bundles of `surfaces`, in the order given.
 *
 * @throws RunwayInvalidError listing every surface whose bundle is missing or invalid.
 * @example
 * const bundles = readBundles(repository, ["console", "till"]);
 */
export function readBundles(repository: string, surfaces: readonly string[]): EdgeBundle[] {
  const { bundleDir, manifestFile } = EDGE_PUBLISH_SETTINGS;
  const issues: RunwayIssue[] = [];
  const bundles: EdgeBundle[] = [];
  for (const surface of surfaces) {
    const root = join(repository, bundleDir, surface);
    const versions = existsSync(root)
      ? readdirSync(root, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
      : [];
    if (versions.length !== 1) {
      issues.push({
        path: `${bundleDir}/${surface}`,
        message:
          versions.length === 0
            ? "No built bundle: build the surface's bundle first"
            : `More than one bundle version (${versions.sort().join(", ")}): build from a clean checkout`,
      });
      continue;
    }
    const folder = join(root, versions[0] as string);
    const at = `${bundleDir}/${surface}/${versions[0] as string}/${manifestFile}`;
    let json: unknown;
    try {
      json = JSON.parse(readFileSync(join(folder, manifestFile), "utf8"));
    } catch (error) {
      issues.push({ path: at, message: `Not readable as JSON: ${(error as Error).message}` });
      continue;
    }
    const parsed = BUNDLE_MANIFEST_SCHEMA.safeParse(json);
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        issues.push({ path: `${at}:${issue.path.join(".")}`, message: issue.message });
      continue;
    }
    if (parsed.data.version !== versions[0]) {
      issues.push({
        path: `${at}:version`,
        message: `The manifest says ${parsed.data.version}, the folder ${versions[0] as string}`,
      });
      continue;
    }
    bundles.push({ surface, folder, manifest: parsed.data });
  }
  if (issues.length > 0) throw new RunwayInvalidError("bundles", issues);
  return bundles;
}
