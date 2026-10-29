/**
 * Stackra file contract:
 * Purpose: `ShellManifest`, the `shell.json` a web shell line's build writes into its `dist/`: the surface, the line
 *          major, the version, the entry module, the stylesheets and the import map of the shared dependencies it
 *          gives every product bundle, each path relative to `dist/`.
 * Boundary: type only; `shellReleaseOf` parses the file into it. Written by the OS shell build (figentra/os
 *           `apps/<shell>`), read here as data.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4: the import map); ADR 0481; app-shells 4.1.
 */

/** A built shell's manifest. */
export type ShellManifest = {
  /** The surface the shell serves, `console`. */
  readonly surface: string;
  /** The line's major, `3`. */
  readonly line: string;
  /** The shell version, the package version. */
  readonly version: string;
  /** The entry module, relative to `dist/`. */
  readonly entry: string;
  /** The stylesheets, relative to `dist/`. */
  readonly css: readonly string[];
  /** Bare specifier to module, relative to `dist/`; a key ending in `/` maps a prefix. */
  readonly importMap: { readonly imports: Readonly<Record<string, string>> };
};
