/**
 * Stackra file contract:
 * Purpose: `releaseOf(bundle, product, origin)`, the edge `release:` row of one built bundle served from `origin`: its
 *          version, entry URL, folder URL, the shell line it targets, its `modulepreload` and stylesheet URLs, and each
 *          file's SRI value by URL when the build recorded them, under
 *          `<origin>/<product>/<surface>/<version>/`.
 * Boundary: pure. `publishProduct` writes it to the edge KV; `previewServe` writes it to the local copy.
 * Runtime: node
 * Governing contract: ADR 0437 (the KV copy); ADR 0436 (decision 4).
 */
import type { EdgeBundle } from "#node/types/edge-bundle.type";
import type { EdgeRelease } from "#node/types/edge-release.type";

/**
 * The release row of `bundle`.
 *
 * @example
 * releaseOf(bundle, "acme", "https://assets.figentra.com").url; // "https://assets.figentra.com/acme/console/1.0.0/index.js"
 */
export function releaseOf(bundle: EdgeBundle, product: string, origin: string): EdgeRelease {
  const { manifest } = bundle;
  const base = `${origin.replace(/\/+$/, "")}/${product}/${bundle.surface}/${manifest.version}/`;
  return {
    version: manifest.version,
    url: `${base}${manifest.entry}`,
    base,
    targets: manifest.targets,
    modulepreload: manifest.modulepreload.map((file) => `${base}${file}`),
    css: manifest.css.map((file) => `${base}${file}`),
    ...(manifest.integrity === undefined
      ? {}
      : {
          integrity: Object.fromEntries(
            Object.entries(manifest.integrity).map(([file, value]) => [`${base}${file}`, value]),
          ),
        }),
  };
}
