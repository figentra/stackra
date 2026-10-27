/**
 * Stackra file contract:
 * Purpose: `ExtensionBundleManifest`, the `bundle.manifest.json` the extension-bundle build of @stackra/vite-plugin
 *          writes beside a product's versioned bundle: the surface, the shell line it targets, the version, the entry,
 *          the files to `modulepreload`, the stylesheets and the import-map specifiers the bundle leaves to the shell.
 * Boundary: a type only. Every file path is relative to the bundle's own folder (`<surface>/<version>/`); absolute
 *           URLs are the Worker's, through `modulepreloadOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decision 4: extension bundles, the import map); app-shells-edge-and-extension.md 4.2,
 *                     15 (points 7 and 8: compatibility and modulepreload) and 16 (point 8: Pro on authenticated hosts).
 */

/** The manifest of one built extension bundle. */
export interface ExtensionBundleManifest {
  /** The package the bundle is built from. */
  readonly package: string;

  /** The surface code (`console`). */
  readonly surface: string;

  /** The shell line the bundle targets, `<surface>@<major>`; the registry refuses one the edge does not serve. */
  readonly targets: string;

  /** The package version: the bundle's folder. */
  readonly version: string;

  /** The entry module, relative to the bundle folder. */
  readonly entry: string;

  /** The entry and every chunk it imports statically, in load order: what the Worker preloads. */
  readonly modulepreload: readonly string[];

  /** The stylesheets the entry imports. */
  readonly css: readonly string[];

  /** The bare specifiers the bundle imports from the shell's import map, sorted. */
  readonly imports: readonly string[];

  /** `types-only` when HeroUI Pro was resolved for types only: the shell must serve Pro on this host. Absent otherwise. */
  readonly pro?: "types-only";
}
