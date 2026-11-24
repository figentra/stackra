/**
 * Stackra file contract:
 * Purpose: `pnpm showcase:coverage`: lists the built react entries of the registry whose web showcase lacks a playground
 *          route, a demo, an English or an Arabic title label, or a test, prints the count per gap and exits 1 when
 *          there is any. It reports; it fixes nothing.
 * Boundary: reads the registry entries, the two showcase catalogues and file names under `apps/playground` and
 *           `packages/design-system/ui`; writes nothing. Runs the TS sources with node's type stripping, resolving the
 *           package's `#src/*` imports through the same module hook as `gen.ts`.
 * Runtime: node
 * Governing contract: STA-2738 (the `showcase:coverage` script), a child of STA-2705.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const showcase = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(showcase, "../../..");

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
const { findShowcaseMisses } = await import("./find-showcase-misses.function.ts");

const playground = join(root, "apps/playground");
const uiReact = join(root, "packages/design-system/ui/src/react");

/** The names directly inside `dir`, or none when it does not exist. */
const names = (dir: string) => (existsSync(dir) ? readdirSync(dir) : []);

const catalogue = (lang: string) =>
  JSON.parse(readFileSync(join(showcase, "assets/lang", lang, "showcase.json"), "utf8")) as unknown;

const entries = [...(await loadEntries(showcase)), ...loadKitEntries(root)].map(
  ({ entry }) => entry,
);

const demos = new Set<string>();
for (const tier of names(join(playground, "src/demos")).filter(
  (name) => name === "free" || name === "pro",
)) {
  for (const slug of names(join(playground, "src/demos", tier))) {
    if (names(join(playground, "src/demos", tier, slug)).some((file) => file.endsWith(".tsx"))) {
      demos.add(`${tier}/${slug}`);
    }
  }
}

// A test: a component test file in the ui react folder, or the playground's own `<slug>.e2e.test.ts`.
// `playground.e2e.test.ts` walks every route and so proves nothing about one entry.
const tests = new Set<string>();
for (const slug of names(uiReact)) {
  if (names(join(uiReact, slug, "__tests__")).some((file) => /\.test\.tsx?$/.test(file))) {
    tests.add(slug);
  }
}
for (const file of names(join(playground, "e2e/__tests__"))) {
  if (file.endsWith(".e2e.test.ts") && file !== "playground.e2e.test.ts") {
    tests.add(file.slice(0, -".e2e.test.ts".length));
  }
}

const misses = findShowcaseMisses({
  entries,
  catalogues: { en: catalogue("en"), ar: catalogue("ar") },
  routes: new Set(names(join(playground, "src/routes"))),
  demos,
  tests,
});

const counted = entries.filter(
  (entry) => entry.status !== "planned" && entry.platforms.includes("react"),
).length;
const perGap = new Map<string, number>();
for (const miss of misses) {
  for (const gap of miss.gaps) perGap.set(gap, (perGap.get(gap) ?? 0) + 1);
  console.log(`${miss.key}: ${miss.gaps.join(", ")}`);
}
console.log(
  `showcase:coverage: ${misses.length} of ${counted} built react entries have a gap ` +
    `(skipped ${entries.length - counted}: planned or not on react)`,
);
for (const gap of ["route", "demo", "en", "ar", "test"]) {
  console.log(`  ${gap}: ${perGap.get(gap) ?? 0}`);
}
process.exit(misses.length > 0 ? 1 : 0);
