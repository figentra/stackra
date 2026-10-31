/**
 * Stackra file contract:
 * Purpose: `pnpm -F @stackra/showcase gen [--check]`: regenerate the registry barrel (with the module kits' entries,
 *          ADR 0503), `api/**` (+ index and the en `api::` seed), `search/index.json` and the mobile demo `.code.ts`
 *          files; with `--check`, write nothing and exit 1 on any drift (CI). Warnings (props folder without entry, missing part) print but do not fail.
 * Boundary: the only writer of those generated files; runs the TS sources with node's type stripping, resolving the
 *           package's `#src/*` imports through a module hook.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2 step 8.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const showcase = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(showcase, "../../..");
const isCheck = process.argv.includes("--check");

// `#src/a/b` -> `src/a/b.ts` (or `/index.ts`): node does not try the fallbacks of the package `imports` array
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("#src/")) return nextResolve(specifier, context);
    const base = join(showcase, "src", specifier.slice(5));
    const file = [base, `${base}.ts`, join(base, "index.ts")].find(
      (path) => existsSync(path) && statSync(path).isFile(),
    );
    return nextResolve(file ? pathToFileURL(file).href : specifier, context);
  },
});

const { loadEntries } = await import("./load-entries.function.ts");
const { loadKitEntries } = await import("./load-kit-entries.function.ts");
const { genBarrel } = await import("./gen-barrel.ts");
const { genApi } = await import("./gen-api.ts");
const { genSearch } = await import("./gen-search.ts");
const { genNativeSources } = await import("./gen-native-sources.ts");
const { genNativeDemos } = await import("./gen-native-demos.ts");
const { stableJson } = await import("./stable-json.function.ts");
const { compareEntries } = await import("../src/registry/compare-entries.function.ts");

const loaded = [...(await loadEntries(showcase)), ...loadKitEntries(root)];
const entries = loaded.map(({ entry }) => entry).toSorted(compareEntries);
const api = genApi(showcase, entries);
const catalogue = (lang: string) =>
  JSON.parse(readFileSync(join(showcase, "assets/lang", lang, "showcase.json"), "utf8")) as unknown;

/**
 * Runs `content` through oxfmt with the repository config (one process for every file, in a temp copy), so a
 * generated file is byte-identical to what `format:check` wants and `--check` never fights the formatter.
 */
function formatted(files: Map<string, string>): Map<string, string> {
  const bin = [
    join(showcase, "node_modules/.bin/oxfmt"),
    join(root, "node_modules/.bin/oxfmt"),
  ].find(existsSync);
  if (!bin) {
    console.warn("warn: oxfmt not installed; generated files are unformatted");
    return files;
  }
  const temp = mkdtempSync(join(tmpdir(), "showcase-gen-"));
  try {
    for (const [path, content] of files) {
      const copy = join(temp, relative(root, path));
      mkdirSync(dirname(copy), { recursive: true });
      writeFileSync(copy, content);
    }
    const run = spawnSync(bin, [`--config=${join(root, ".oxfmtrc.jsonc")}`, "--write", temp], {
      encoding: "utf8",
    });
    if (run.status !== 0) throw new Error(`oxfmt failed: ${run.stderr || run.stdout}`);
    return new Map(
      [...files.keys()].map((path) => [
        path,
        readFileSync(join(temp, relative(root, path)), "utf8"),
      ]),
    );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

/** Absolute path -> content of every generated file. */
const outputs = formatted(
  new Map<string, string>([
    [join(showcase, "src/registry/components.generated.ts"), genBarrel(loaded, compareEntries)],
    ...[...api.files].map(([path, content]) => [join(showcase, path), content] as [string, string]),
    [
      join(showcase, "search/index.json"),
      stableJson(genSearch(entries, api.docs, { en: catalogue("en"), ar: catalogue("ar") })),
    ],
    [
      join(root, "apps/mobile/src/demos/index.generated.ts"),
      genNativeDemos(join(root, "apps/mobile/src/demos"), join(showcase, "api/native"), entries),
    ],
    ...[...genNativeSources(root, join(root, "apps/mobile/src/demos"))].map(
      ([path, content]) => [join(root, path), content] as [string, string],
    ),
  ]),
);

/** Generated JSON under `api/` no longer produced (a deleted props folder). */
const stale = (() => {
  const dir = join(showcase, "api");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((file) => join(dir, file))
    .filter((path) => path.endsWith(".json") && !outputs.has(path));
})();

for (const warning of api.warnings) console.warn(`warn: ${warning}`);
const drift = [...outputs].filter(
  ([path, content]) => !existsSync(path) || readFileSync(path, "utf8") !== content,
);
if (isCheck) {
  for (const [path] of drift) console.error(`drift: ${relative(root, path)}`);
  for (const path of stale) console.error(`stale: ${relative(root, path)}`);
  if (drift.length > 0 || stale.length > 0) {
    console.error("generated files are out of date: run `pnpm -F @stackra/showcase gen`");
    process.exit(1);
  }
  console.log(`gen --check: ${outputs.size} files up to date`);
} else {
  for (const [path, content] of drift) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  for (const path of stale) rmSync(path);
  console.log(
    `gen: ${drift.length} written, ${stale.length} removed, ${outputs.size - drift.length} unchanged`,
  );
}
