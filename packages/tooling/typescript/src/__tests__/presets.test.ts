/**
 * Proves every preset listed in package.json `exports` exists, parses as JSONC, and resolves its
 * `extends` chain back to base.json — so a broken preset fails here, not in the first consumer's typecheck.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  exports: Record<string, string>;
};

/** Strip `//` line comments so JSONC presets parse with JSON.parse. */
function readJsonc(path: string): { extends?: string; compilerOptions?: Record<string, unknown> } {
  const text = readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
  return JSON.parse(text);
}

describe("@stackra/typescript-config presets", () => {
  for (const [subpath, file] of Object.entries(pkg.exports)) {
    it(`${subpath} → ${file} exists and chains to base.json`, () => {
      let current = join(root, file);
      const seen = new Set<string>();
      while (true) {
        expect(existsSync(current), `${current} missing`).toBe(true);
        expect(seen.has(current), `cycle at ${current}`).toBe(false);
        seen.add(current);
        const preset = readJsonc(current);
        if (!preset.extends) {
          expect(current.endsWith("base.json")).toBe(true);
          break;
        }
        current = join(dirname(current), preset.extends);
      }
    });
  }

  it("base keeps the non-negotiable strictness flags", () => {
    const base = readJsonc(join(root, "src", "base.json")).compilerOptions ?? {};
    for (const flag of [
      "strict",
      "noUncheckedIndexedAccess",
      "exactOptionalPropertyTypes",
      "isolatedModules",
      "verbatimModuleSyntax",
    ]) {
      expect(base[flag], flag).toBe(true);
    }
  });
});
