/**
 * Stackra file contract:
 * Purpose: `generatedModulesPlugin`, the Vite plugin that serves `#stackra/<name>` from the real file gen wrote,
 *          `.stackra/gen/<name>.ts` (or `.tsx`, or `<name>/index.ts`) under the Vite root, so a Vite app, Metro, Node,
 *          tests and agents all read the same file. Vite watches the resolved file, so `stackra gen --watch` rewriting
 *          it hot-updates the app.
 * Boundary: a thin view (ADR 0261): it adds no export of its own and never generates; a specifier with no generated
 *           file fails with what to run. It resolves before the package `imports` map, so a member whose map is
 *           missing still gets the same file.
 * Runtime: node
 * Governing contract: ADR 0261 (decisions 1 to 4), ADR 0233 (the `#stackra/*` alias).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { Plugin } from "vite";

/** The specifier prefix of a generated module. */
const PREFIX = "#stackra/";

/** Where gen writes the modules, relative to the member root. */
const FOLDER = ".stackra/gen";

/**
 * The plugin that resolves `#stackra/*` to gen's files.
 *
 * @example
 * generatedModulesPlugin(); // `import { wiring } from "#stackra/wiring"` → <root>/.stackra/gen/wiring.ts
 */
export function generatedModulesPlugin(): Plugin {
  let root = process.cwd();
  return {
    name: "stackra:generated-modules",
    enforce: "pre",
    configResolved(config) {
      root = config.root;
    },
    resolveId(source) {
      if (!source.startsWith(PREFIX)) return null;
      const base = join(root, FOLDER, source.slice(PREFIX.length));
      const file = [`${base}.ts`, `${base}.tsx`, join(base, "index.ts")].find((candidate) =>
        existsSync(candidate),
      );
      if (file === undefined) {
        this.error(
          `"${source}" has no generated file in ${FOLDER}/: run \`stackra gen\` (or keep \`stackra dev\` running)`,
        );
      }
      return file;
    },
  };
}
