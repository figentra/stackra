/**
 * Stackra file contract:
 * Purpose: proves every preset in package.json `exports` exists, that base.jsonc loads every house JS plugin from a
 *          source file that exists and turns on every `stackra/*` rule at error, that @stackra/coding-standard is a
 *          peer, and that the boundary preset still carries the two non-negotiable patterns (packages never import
 *          apps/services; no deep src imports).
 * Boundary: test only; reads the preset files and the plugin's source as text, imports no workspace package.
 * Runtime: node (vitest)
 * Governing contract: ADR 0129; ADR 0421; docs/constitution/boundaries.md.
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
    expect(paths).toHaveLength(2);
    for (const path of paths) expect(existsSync(join(root, "src", path))).toBe(true);
    expect(text).toContain('"feature-flags/no-plan-targeting": "error"');
  });

  it("base.jsonc turns on every rule @stackra/coding-standard registers, at error", () => {
    const text = readFileSync(join(root, "src", "base.jsonc"), "utf8");
    const plugin = readFileSync(
      join(
        root,
        "..",
        "..",
        "developer",
        "coding-standard",
        "src",
        "core",
        "constants",
        "stackra-plugin.constant.ts",
      ),
      "utf8",
    );
    const registered = [...plugin.matchAll(/^ {4}"([a-z-]+)": [A-Z_]+_RULE,$/gm)].map(
      (match) => match[1],
    );
    const enabled = [...text.matchAll(/"stackra\/([a-z-]+)": "error"/g)].map((match) => match[1]);
    expect(registered.length).toBeGreaterThan(0);
    expect(enabled.toSorted()).toEqual(registered.toSorted());
  });

  it("package.json names @stackra/coding-standard as a peer, so a consumer installs the plugin", () => {
    const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      peerDependencies?: Record<string, string>;
    };
    expect(manifest.peerDependencies?.["@stackra/coding-standard"]).toBeDefined();
  });

  it("boundaries.jsonc keeps the tier rule", () => {
    const text = readFileSync(join(root, "src", "boundaries.jsonc"), "utf8");
    expect(text).toContain('"**/apps/**"');
    expect(text).toContain('"@stackra/*/src/*"');
  });
});
