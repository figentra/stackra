/**
 * Stackra file contract:
 * Purpose: `BundleConfigOptions`, what `stackra.bundleConfig(options)` takes to build one surface's extension bundle
 *          from a product UI package: the surface, the bundle entry, the shell's import map, the plugins that run
 *          first, the `define` map, Vite's build block, the output root and the HeroUI Pro types-only flag.
 * Boundary: a type only. The shell line (`targets`) and the version are not options: they are read from the member's
 *           committed `stackra.manifest.json` (gen's `surfaces` section and `version`). The import map is the shell
 *           record's, passed by the caller that read it (the dev command, the Runway publish step).
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 4 and 9); app-shells-edge-and-extension.md 4.2 and 16 (point 8);
 *                     owner decision D12.
 */
import type { PluginOption, UserConfig } from "vite";

import type { ImportMap } from "#core/types/import-map.type";

/** The options of `stackra.bundleConfig`. */
export type BundleConfigOptions = {
  /** The surface the bundle is for (`console`); the member's manifest must target it. */
  readonly surface: string;
  /** The bundle's entry module, relative to the member root (`src/console.ts`). */
  readonly entry: string;
  /** The shell's import map: every specifier it maps is left external and resolved by the shell at run time. */
  readonly importMap: ImportMap;
  /** Plugins that run before the preset's, such as `classComponents()` from `@stackra/gen/node`. */
  readonly plugins?: readonly PluginOption[];
  /** The bundler `define` map. */
  readonly define?: Readonly<Record<string, string>>;
  /** Vite's build block (target, source maps); the input, output names and folder are the preset's. */
  readonly build?: UserConfig["build"];
  /** The output root; the bundle goes to `<outDir>/<surface>/<version>/`. Default `dist/bundles`. */
  readonly outDir?: string;
  /**
   * Product CI without the HeroUI Pro licence (owner point 16.8, off until decided): Pro is resolved for types only,
   * left external even when this import map does not map it, and the bundle manifest says the shell must serve it.
   */
  readonly proTypesOnly?: boolean;
};
