/**
 * Stackra file contract:
 * Purpose: `renderPackument`: A packument.
 * Boundary: rendering and the KV cache only; read rules are the caller's.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 3, 4, 8 and 9).
 */
import type { PackageRow } from "#src/interfaces/package-row.interface";
import type { VersionRow } from "#src/interfaces/version-row.interface";
import { distOf } from "#src/npm/dist-of";
import { renderManifest } from "#src/npm/render-manifest";

/** The fields npm's abbreviated (install) form keeps per version. */
const ABBREVIATED_FIELDS = [
  "name",
  "version",
  "dependencies",
  "optionalDependencies",
  "devDependencies",
  "bundleDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "bin",
  "directories",
  "engines",
  "os",
  "cpu",
  "libc",
  "funding",
  "_hasShrinkwrap",
] as const;

/** The abbreviated form of one version. */
function abbreviate(row: VersionRow, host: string): Record<string, unknown> {
  const manifest = JSON.parse(row.manifest) as Record<string, unknown>;
  const scripts = (manifest.scripts ?? {}) as Record<string, unknown>;
  const kept = Object.fromEntries(
    ABBREVIATED_FIELDS.filter((field) => manifest[field] !== undefined).map((field) => [
      field,
      manifest[field],
    ]),
  );
  const installs = ["preinstall", "install", "postinstall"].some((hook) => hook in scripts);
  return {
    ...kept,
    ...(installs ? { hasInstallScript: true } : {}),
    ...(row.deprecated === null ? {} : { deprecated: row.deprecated }),
    dist: distOf(row, host),
  };
}

/**
 * A packument.
 *
 * @param abbreviated - the install form (`application/vnd.npm.install-v1+json`).
 */
export function renderPackument(
  pkg: PackageRow,
  versions: readonly VersionRow[],
  distTags: Readonly<Record<string, string>>,
  host: string,
  abbreviated: boolean,
): Record<string, unknown> {
  if (abbreviated)
    return {
      name: pkg.name,
      modified: pkg.modified_at,
      "dist-tags": distTags,
      versions: Object.fromEntries(versions.map((row) => [row.version, abbreviate(row, host)])),
    };
  const latest = versions.find((row) => row.version === distTags.latest);
  const latestManifest =
    latest === undefined ? {} : (JSON.parse(latest.manifest) as Record<string, unknown>);
  return {
    _id: pkg.name,
    name: pkg.name,
    ...(latestManifest.description === undefined
      ? {}
      : { description: latestManifest.description }),
    ...(latestManifest.license === undefined ? {} : { license: latestManifest.license }),
    "dist-tags": distTags,
    versions: Object.fromEntries(versions.map((row) => [row.version, renderManifest(row, host)])),
    time: {
      created: pkg.created_at,
      modified: pkg.modified_at,
      ...Object.fromEntries(versions.map((row) => [row.version, row.published_at])),
    },
  };
}
