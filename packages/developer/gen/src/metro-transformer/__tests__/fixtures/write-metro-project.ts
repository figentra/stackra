/**
 * Stackra file contract:
 * Purpose: `writeMetroProject`, an app root for the Metro transformer tests: a package.json and a stand-in upstream
 *          transformer (`@expo/metro-config/babel-transformer`) that echoes what it receives and reports a cache key.
 * Boundary: test data only; writes under `<gen>/.cache/fixtures/` (gitignored).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0127 2026-10-24 note (the metro-transformer tool hook).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Counts the projects this process wrote. */
let written = 0;

/**
 * Writes an app root with a stand-in upstream transformer and returns it.
 *
 * @example
 * const projectRoot = writeMetroProject();
 */
export function writeMetroProject(): string {
  written += 1;
  const root = fileURLToPath(
    new URL(`../../../../.cache/fixtures/metro-${process.pid}-${written}/`, import.meta.url),
  );
  const files: Record<string, string> = {
    "package.json": JSON.stringify({ name: "@fixture/mobile", version: "1.0.0" }),
    // Expo's path is the first candidate, so the stand-in wins over anything an ancestor folder installs.
    "node_modules/@expo/metro-config/package.json": JSON.stringify({ name: "@expo/metro-config" }),
    "node_modules/@expo/metro-config/babel-transformer.js":
      'module.exports = { transform: (params) => ({ received: params }), getCacheKey: () => "rn-key" };\n',
  };
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  return root.replace(/\/$/, "");
}
