/**
 * Stackra file contract:
 * Purpose: `BundleManifest`, the fields of a built extension bundle's `bundle.manifest.json` the publish step reads:
 *          the package, surface, the shell line it targets, the version, the entry, the files to preload, the
 *          stylesheets and the import-map specifiers it leaves to the shell.
 * Boundary: type only; `readBundles` parses the file into it. The file is written by @stackra/vite-plugin as gen's
 *           `ExtensionBundleManifest`; runway reads it as data and takes no dependency on gen (gen depends on runway).
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); app-shells 4.2 and 15 (points 7 and 8).
 */

/** One built bundle's manifest, as the publish step reads it. */
export type BundleManifest = {
  /** The package the bundle is built from. */
  readonly package: string;
  /** The surface code the bundle was built for. */
  readonly surface: string;
  /** The shell line it targets, `<surface>@<major>`. */
  readonly targets: string;
  /** The version: the bundle's folder. */
  readonly version: string;
  /** The entry module, relative to the bundle folder. */
  readonly entry: string;
  /** The files the Worker preloads, relative to the bundle folder. */
  readonly modulepreload: readonly string[];
  /** The stylesheets, relative to the bundle folder. */
  readonly css: readonly string[];
  /** The bare specifiers the shell's import map must resolve. */
  readonly imports: readonly string[];
};
