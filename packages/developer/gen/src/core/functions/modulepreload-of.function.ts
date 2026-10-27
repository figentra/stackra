/**
 * Stackra file contract:
 * Purpose: `modulepreloadOf`, the URLs the edge Worker emits as `<link rel="modulepreload">` for first paint: the
 *          shell's entry first, then the product bundle's entry and the chunks it imports statically.
 * Boundary: pure and isomorphic, so the Worker can call it; reads a shell record's entry and a bundle manifest, joins
 *           the bundle's relative files onto the bundle's base URL. A base without a trailing `/` is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (first paint); app-shells-edge-and-extension.md 4.1 (`shell:<surface>:<major>` →
 *                     `{ version, entry, importMap }`) and 15 (point 8).
 */
import type { ExtensionBundleManifest } from "#core/types/extension-bundle-manifest.type";

/**
 * The modulepreload URLs of a shell and a product bundle, without duplicates.
 *
 * @param shellEntry - the shell record's `entry` URL.
 * @param bundleBase - the URL of the bundle's folder, ending in `/` (`https://assets…/mezzora/console/1.4.0/`).
 * @param bundle - the bundle's `bundle.manifest.json`.
 * @throws RangeError when `bundleBase` does not end in `/`.
 * @example
 * modulepreloadOf("/shell/console/3.2.0/entry.js", "/b/mezzora/console/1.4.0/", manifest);
 * // ["/shell/console/3.2.0/entry.js", "/b/mezzora/console/1.4.0/console.a1b2.js", "/b/mezzora/console/1.4.0/chunks/x.js"]
 */
export function modulepreloadOf(
  shellEntry: string,
  bundleBase: string,
  bundle: Pick<ExtensionBundleManifest, "modulepreload">,
): string[] {
  if (!bundleBase.endsWith("/"))
    throw new RangeError(`The bundle base "${bundleBase}" must end in "/"`);
  return [...new Set([shellEntry, ...bundle.modulepreload.map((file) => `${bundleBase}${file}`)])];
}
