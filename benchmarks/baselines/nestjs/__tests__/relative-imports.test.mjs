/**
 * Stackra file contract:
 * Purpose: proves the NestJS baseline's TypeScript, the starting app and every scripted solution, imports its own files
 *   with explicit extensions. The official starter compiles as ESM (`module` and `moduleResolution` `nodenext`), where
 *   `import "./tasks.service"` is error TS2835/TS2307 and `nest build` fails before any acceptance test can run; an
 *   extensionless import also makes `instanceof` stop narrowing, which shows as unrelated "of type 'unknown'" errors.
 * Boundary: reads the baseline's own `.ts` files; no build, no network, no container.
 * Runtime: node (node --test)
 * Governing contract: STA-2709 (fair baselines: the starter's own idiom); benchmarks/baselines/nestjs/create.mjs.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const baseline = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The relative module specifiers a source file imports or re-exports. */
const relativeSpecifiers = (source) =>
  [...source.matchAll(/\bfrom\s+["'](\.{1,2}\/[^"']*)["']/g)].map((match) => match[1]);

describe("the NestJS baseline's relative imports", () => {
  const files = [
    ...readdirSync(join(baseline, "starting-app"), { recursive: true, withFileTypes: true }),
    ...readdirSync(join(baseline, "solutions"), { recursive: true, withFileTypes: true }),
  ]
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => join(entry.parentPath, entry.name));

  it("finds the starting app and the scripted solutions", () => {
    assert.ok(files.length >= 5, `expected the baseline's .ts files, found ${files.length}`);
    assert.ok(files.some((file) => file.includes("starting-app")));
    assert.ok(files.some((file) => file.includes("solutions")));
  });

  it("names a file extension on every relative import", () => {
    const bare = files.flatMap((file) =>
      relativeSpecifiers(readFileSync(file, "utf8"))
        .filter((specifier) => !/\.(js|json)$/.test(specifier))
        .map((specifier) => `${file.slice(baseline.length + 1)}: ${specifier}`),
    );
    assert.deepEqual(bare, []);
  });
});
