/**
 * Stackra file contract:
 * Purpose: proves that `@sentry/vite-plugin` and `vite-plugin-pwa` are optional peers of @stackra/vite-plugin, never
 *          dependencies, so a member that uploads no source maps installs no Sentry CLI binary and one that builds no PWA
 *          installs no workbox tree; and that the source loads each one only lazily, in the one file that wires it.
 * Boundary: reads package.json and the files under src/ from disk; asserts nothing about behaviour at build time.
 * Runtime: node (vitest)
 * Governing contract: ADR 0184 (telemetry: Sentry only where it is on); ADR 0022 (test placement); STA-2782, STA-2776.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "@stackra/testing";

/** The member root, three folders above this file. */
const ROOT = fileURLToPath(new URL("../../..", import.meta.url));

/** The peers a member adds only when it uses the feature, and the one source file that loads each. */
const OPTIONAL_PEERS = {
  "@sentry/vite-plugin": "core/functions/sentry-plugin.function.ts",
  "vite-plugin-pwa": "core/functions/pwa-plugin.function.ts",
} as const;

/** The parts of package.json this test reads. */
type Manifest = Partial<
  Record<"dependencies" | "devDependencies" | "peerDependencies", Record<string, string>>
> & { peerDependenciesMeta?: Record<string, { optional?: boolean }> };

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as Manifest;

/** Every authored source file outside the tests, relative to src/ with forward slashes, its comments stripped. */
const sources = readdirSync(join(ROOT, "src"), { recursive: true, encoding: "utf8" })
  .filter((path) => path.endsWith(".ts") && !path.split(/[\\/]/).includes("__tests__"))
  .map((path) => ({
    path: path.replaceAll("\\", "/"),
    text: readFileSync(join(ROOT, "src", path), "utf8").replaceAll(
      /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      "",
    ),
  }));

describe("the optional peers of @stackra/vite-plugin", () => {
  for (const [name, loader] of Object.entries(OPTIONAL_PEERS)) {
    it(`lists ${name} as an optional peer and never as a dependency`, () => {
      expect(Object.keys(pkg.dependencies ?? {})).not.toContain(name);
      expect(pkg.peerDependencies?.[name]).toBeDefined();
      expect(pkg.peerDependenciesMeta?.[name]).toEqual({ optional: true });
      expect(pkg.devDependencies?.[name]).toBe(pkg.peerDependencies?.[name]);
    });

    it(`loads ${name} only through a dynamic import in ${loader}`, () => {
      const escaped = name.replaceAll(/[/.]/g, "\\$&");
      const valueImport = new RegExp(String.raw`^import (?!type )[^;]*from "${escaped}"`, "m");
      const dynamicImport = new RegExp(String.raw`import\("${escaped}"\)`);
      for (const { path, text } of sources)
        expect({ path, valueImport: valueImport.test(text) }).toEqual({ path, valueImport: false });
      const loaders = sources
        .filter(({ text }) => dynamicImport.test(text))
        .map(({ path }) => path);
      expect(loaders).toEqual([loader]);
    });
  }
});
