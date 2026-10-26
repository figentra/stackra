/**
 * Proves every preset in package.json `exports` exists and that the boundary preset still carries the two
 * non-negotiable patterns (packages never import apps/services; no deep src imports).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  exports: Record<string, string>;
};

describe("@stackra/oxlint-config presets", () => {
  for (const [subpath, file] of Object.entries(pkg.exports)) {
    it(`${subpath} → ${file} exists`, () => {
      expect(existsSync(join(root, file))).toBe(true);
    });
  }

  it("base.jsonc loads every JS plugin from a source file that exists", () => {
    const text = readFileSync(join(root, "src", "base.jsonc"), "utf8");
    const plugins = /"jsPlugins":\s*\[([^\]]*)\]/.exec(text)?.[1] ?? "";
    const paths = [...plugins.matchAll(/"([^"]+)"/g)].map((match) => match[1] ?? "");
    expect(paths).toHaveLength(1);
    for (const path of paths) expect(existsSync(join(root, "src", path))).toBe(true);
    expect(text).toContain('"feature-flags/no-plan-targeting": "error"');
  });

  it("boundaries.jsonc keeps the tier rule", () => {
    const text = readFileSync(join(root, "src", "boundaries.jsonc"), "utf8");
    expect(text).toContain('"**/apps/**"');
    expect(text).toContain('"@stackra/*/src/*"');
  });
});
