/**
 * Proves every preset in package.json `exports` exists and parses (JSONC line comments allowed), so a broken
 * preset fails here, not in the first consumer.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  exports: Record<string, string>;
};

/** Strip `//` line comments so a .jsonc preset parses with JSON.parse. */
function readJsonc(path: string): unknown {
  const text = readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
  return JSON.parse(text);
}

describe("@stackra/{{NAME}}-config presets", () => {
  for (const [subpath, file] of Object.entries(pkg.exports)) {
    it(`${subpath} → ${file} exists and parses`, () => {
      const path = join(root, file);
      expect(existsSync(path), `${path} missing`).toBe(true);
      expect(() => readJsonc(path)).not.toThrow();
    });
  }
});
