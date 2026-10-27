/**
 * Stackra file contract:
 * Purpose: `bundlePlugin`, the Vite plugin of the extension-bundle build: it reads the shell line the member targets on
 *          its surface and its version from the committed `stackra.manifest.json`, writes the bundle to
 *          `<outDir>/<surface>/<version>/`, refuses a bundle that carries its own copy of a package the shell's import
 *          map supplies or any HeroUI Pro code, and emits `bundle.manifest.json` (targets, entry, modulepreload list,
 *          stylesheets, the import-map specifiers used).
 * Boundary: build only. Leaving the shared specifiers external is `bundleConfig`'s; this plugin checks the output,
 *           read as rolldown's `OutputChunk` (with Vite's `viteMetadata`), never a hand-written copy of its shape.
 *           A member with no manifest, or one that targets no shell on the surface, fails before the build with what
 *           to run. Pro is refused inside the bundle whatever the flag: the licence is held once, at the shell (D12).
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 4, 5 and 9; enforcement: a bundle that imports a shared dependency instead
 *                     of the import-map external fails); app-shells-edge-and-extension.md 4.2, 15 (points 7 and 8) and
 *                     16 (point 8); owner decision D12.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { StackraManifest } from "@stackra/contracts";
import type { ExtensionBundleManifest, SurfaceTarget } from "@stackra/gen";
import type { Plugin, Rolldown } from "vite";

import { PRO_IMPORTS } from "#core/constants/pro-imports.constant";
import { importMapResolves } from "#core/functions/import-map-resolves.function";
import type { ImportMap } from "#core/types/import-map.type";

/** The bundle manifest's file name, beside the bundle. */
const BUNDLE_MANIFEST = "bundle.manifest.json";

/** The package a module id under `node_modules` belongs to, or undefined for the member's own files. */
function packageOf(id: string): string | undefined {
  const at = id.lastIndexOf("/node_modules/");
  if (at < 0) return undefined;
  const [first, second] = id.slice(at + "/node_modules/".length).split("/");
  return first?.startsWith("@") === true ? `${first}/${second ?? ""}` : first;
}

/** Whether `map` supplies `pkg` or any path of it. */
function supplies(map: ImportMap, pkg: string): boolean {
  return importMapResolves(map, pkg) || `${pkg}/` in map.imports;
}

/**
 * The extension-bundle plugin.
 *
 * @param options - the surface, the shell's import map, the output root and the Pro types-only flag.
 * @example
 * bundlePlugin({ surface: "console", importMap, outDir: "dist/bundles" });
 * // dist/bundles/console/1.4.0/console.<hash>.js and bundle.manifest.json
 */
export function bundlePlugin(options: {
  readonly surface: string;
  readonly importMap: ImportMap;
  readonly outDir: string;
  readonly proTypesOnly?: boolean;
}): Plugin {
  const { surface, importMap } = options;
  let target: { readonly package: string; readonly version: string; readonly targets: string };
  return {
    name: "stackra:bundle",
    apply: "build",
    config(config) {
      const path = resolve(config.root ?? process.cwd(), "stackra.manifest.json");
      if (!existsSync(path))
        throw new Error(`The extension bundle needs ${path}: run \`stackra gen\` first`);
      const manifest = JSON.parse(readFileSync(path, "utf8")) as StackraManifest;
      const found = ((manifest["surfaces"] ?? []) as readonly SurfaceTarget[]).find(
        (entry) => entry.surface === surface,
      );
      if (found === undefined)
        throw new Error(
          `${manifest.package} targets no ${surface} shell: depend on the ${surface} shell package (its slots name ` +
            "the surface) and run `stackra gen`",
        );
      target = { package: manifest.package, version: manifest.version, targets: found.targets };
      return {
        build: { outDir: join(options.outDir, surface, manifest.version), emptyOutDir: true },
      };
    },
    generateBundle(_output, bundle) {
      const chunks = Object.values(bundle).filter(
        (item): item is Rolldown.OutputChunk => item.type === "chunk",
      );
      for (const chunk of chunks)
        for (const id of chunk.moduleIds) {
          const pkg = packageOf(id);
          if (pkg === undefined) continue;
          if (supplies(PRO_IMPORTS, pkg))
            this.error(
              `The ${surface} bundle carries HeroUI Pro code (${id}): Pro reaches a product only through the ` +
                "shell's import map; import it by a specifier the map maps, or set `proTypesOnly` in product CI",
            );
          if (supplies(importMap, pkg))
            this.error(
              `The ${surface} bundle carries its own copy of ${pkg} (${id}), which the shell's import map supplies: ` +
                "import it by a specifier the map maps",
            );
        }

      const entry = chunks.find((chunk) => chunk.isEntry && chunk.name === surface);
      if (entry === undefined)
        this.error(`The ${surface} bundle has no entry chunk named ${surface}`);
      const files = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
      const preload: string[] = [];
      const visit = (chunk: Rolldown.OutputChunk): void => {
        if (preload.includes(chunk.fileName)) return;
        preload.push(chunk.fileName);
        for (const file of chunk.imports) {
          const next = files.get(file);
          if (next !== undefined) visit(next);
        }
      };
      visit(entry);
      const imports = new Set(
        chunks.flatMap((chunk) =>
          [...chunk.imports, ...chunk.dynamicImports].filter((file) => !files.has(file)),
        ),
      );
      const manifest: ExtensionBundleManifest = {
        package: target.package,
        surface,
        targets: target.targets,
        version: target.version,
        entry: entry.fileName,
        modulepreload: preload,
        css: [...(entry.viteMetadata?.importedCss ?? [])],
        imports: [...imports].sort(),
        ...(options.proTypesOnly === true ? { pro: "types-only" as const } : {}),
      };
      this.emitFile({
        type: "asset",
        fileName: BUNDLE_MANIFEST,
        source: `${JSON.stringify(manifest, null, 2)}\n`,
      });
    },
  };
}
