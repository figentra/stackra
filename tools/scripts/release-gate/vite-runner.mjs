/**
 * Stackra file contract:
 * Purpose: the Vite leg of the release gate's packed-tarball smoke (ADR 0177 PK4). Copied into the throwaway
 *   consumer by `release-gate.mjs smoke`; builds, for the browser, one entry file per spec in the specs file
 *   (`import * as m from "<spec>"`, kept, so nothing is shaken out before it is resolved) with the consumer's Vite,
 *   and prints one JSON line per entry: `{ "spec": "...", "ok": true }` or `{ ..., "ok": false, "error": "..." }`.
 *   A missing file, a bad `exports` target, a static import of an uninstalled module or a syntax Vite cannot read
 *   fails the entry; a Node built-in that Vite externalizes for the browser is left to the package's tests.
 * Boundary: writes the entry files under `vite-entries/` in the consumer; the bundle is never written (`write: false`).
 * Runtime: node
 * Governing contract: ADR 0177 (decision 4); STA-2705.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "vite";

const specs = JSON.parse(readFileSync(process.argv[2], "utf8"));
const root = process.cwd();
mkdirSync(join(root, "vite-entries"), { recursive: true });

/** The first line of a build error, without the consumer's long store paths. */
function firstError(error) {
  return String(error?.message ?? error)
    .split("\n")
    .filter((line) => line.trim() !== "")
    .slice(0, 2)
    .join(" ")
    .replaceAll(/\/[^\s'"]*\/node_modules\/\.pnpm\/[^/]+\/node_modules\//g, "")
    .slice(0, 600);
}

for (const [index, spec] of specs.entries()) {
  const input = join(root, "vite-entries", `entry-${index}.js`);
  writeFileSync(
    input,
    `import * as m from ${JSON.stringify(spec)};\nglobalThis.__stackraSmoke = m;\n`,
  );
  try {
    await build({
      configFile: false,
      logLevel: "silent",
      root,
      build: { write: false, minify: false, emptyOutDir: false, rollupOptions: { input } },
    });
    console.log(JSON.stringify({ spec, ok: true }));
  } catch (error) {
    console.log(JSON.stringify({ spec, ok: false, error: firstError(error) }));
  }
}
