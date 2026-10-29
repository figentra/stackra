/**
 * Stackra file contract:
 * Purpose: `viteBundler`, the `SurfaceBundler` `stackra build --product` gives Runway: builds one surface's generated
 *          entry with Vite into ES modules, every import the shell's import map resolves left external (an exact key, or
 *          a key ending in `/` as a prefix), content-hashed names, and answers the entry, the chunks to preload, the
 *          stylesheets and the bare specifiers left to the import map.
 * Boundary: build only, no dev server; writes the output folder. The bundle manifest is Runway's to write.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4: extension bundles with the shell's shared dependencies as externals).
 */
import type { SurfaceBundleFiles, SurfaceBundleJob, SurfaceBundler } from "@stackra/runway/node";
import { build } from "vite";
import type { Rolldown } from "vite";

/** Whether `map` resolves bare `specifier`. */
function resolves(map: SurfaceBundleJob["importMap"], specifier: string): boolean {
  if (/^[./#\0]/.test(specifier) || /^[a-z][a-z0-9+.-]*:/i.test(specifier)) return false;
  return Object.keys(map.imports).some(
    (key) => key === specifier || (key.endsWith("/") && specifier.startsWith(key)),
  );
}

/** Vite's metadata of a chunk: the stylesheets it imports. */
const meta = (chunk: Rolldown.OutputChunk) =>
  (chunk as Rolldown.OutputChunk & { viteMetadata?: { importedCss: Set<string> } }).viteMetadata;

/**
 * Builds one surface bundle.
 *
 * @example
 * await buildProduct({ repository: ".", scope: "@figentra", bundle: viteBundler });
 */
export const viteBundler: SurfaceBundler = async (job) => {
  const result = await build({
    configFile: false,
    root: job.root,
    logLevel: "warn",
    base: "./",
    build: {
      outDir: job.outDir,
      emptyOutDir: true,
      manifest: false,
      modulePreload: { polyfill: false },
      rolldownOptions: {
        input: { [job.surface]: job.entry },
        external: (id) => resolves(job.importMap, id),
        preserveEntrySignatures: "strict",
        output: {
          format: "es",
          entryFileNames: "[name].[hash].js",
          chunkFileNames: "chunks/[name].[hash].js",
          assetFileNames: "assets/[name].[hash][extname]",
        },
      },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]) as Rolldown.RolldownOutput[];
  const chunks = outputs
    .flatMap((output) => output.output)
    .filter((item): item is Rolldown.OutputChunk => item.type === "chunk");
  const entry = chunks.find((chunk) => chunk.isEntry);
  if (entry === undefined) throw new Error(`The ${job.surface} bundle has no entry chunk`);
  const files: SurfaceBundleFiles = {
    entry: entry.fileName,
    modulepreload: chunks.filter((chunk) => chunk !== entry).map((chunk) => chunk.fileName),
    css: [...new Set(chunks.flatMap((chunk) => [...(meta(chunk)?.importedCss ?? [])]))],
    imports: [
      ...new Set(
        chunks.flatMap((chunk) => chunk.imports.filter((id) => resolves(job.importMap, id))),
      ),
    ],
  };
  return files;
};
