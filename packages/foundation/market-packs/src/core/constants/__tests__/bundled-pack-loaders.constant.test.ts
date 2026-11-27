/**
 * Stackra file contract:
 * Purpose: proves `BUNDLED_PACK_LOADERS` loads the same JSON as the shipped pack files on each target that reads this
 *          source: through Vite (vitest runs the web bundler's transform), in Node's own ESM loader (a child `node`
 *          strips the types and resolves the JSON import attribute itself), with one loader per pack file. Metro, the
 *          mobile target, is covered in @figentra/mobile (its Babel config test, STA-2893).
 * Boundary: test only; the real `assets/data/packs/` files.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0386 (as amended 2026-11-09).
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { BUNDLED_PACK_LOADERS } from "#core/constants/bundled-pack-loaders.constant";

/** The shipped pack files. */
const PACKS = new URL("../../../../assets/data/packs/", import.meta.url);

/** The loaders' own source file, for the Node run. */
const LOADERS = new URL("../bundled-pack-loaders.constant.ts", import.meta.url);

/** Market code to the parsed content of its shipped file. */
function shipped(): Record<string, unknown> {
  return Object.fromEntries(
    readdirSync(PACKS)
      .filter((file) => file.endsWith(".json"))
      .map((file) => [
        file.slice(0, -".json".length),
        JSON.parse(readFileSync(new URL(file, PACKS), "utf8")) as unknown,
      ]),
  );
}

describe("BUNDLED_PACK_LOADERS", () => {
  it("has one loader per shipped pack file", () => {
    expect(Object.keys(BUNDLED_PACK_LOADERS).toSorted()).toEqual(Object.keys(shipped()).toSorted());
  });

  it("loads each pack as shipped through Vite, the web bundler's transform", async () => {
    const loaded = Object.fromEntries(
      await Promise.all(
        Object.entries(BUNDLED_PACK_LOADERS).map(
          async ([market, load]) => [market, (await load()).default] as const,
        ),
      ),
    );

    expect(loaded).toEqual(shipped());
  });

  it("loads each pack as shipped in Node's own ESM loader", () => {
    const script = [
      `const { BUNDLED_PACK_LOADERS } = await import(${JSON.stringify(LOADERS.href)});`,
      "const entries = await Promise.all(",
      "  Object.entries(BUNDLED_PACK_LOADERS).map(async ([market, load]) => [market, (await load()).default]),",
      ");",
      "process.stdout.write(JSON.stringify(Object.fromEntries(entries)));",
    ].join("\n");
    const output = execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
      cwd: fileURLToPath(new URL("../../../../", import.meta.url)),
      encoding: "utf8",
    });

    expect(JSON.parse(output)).toEqual(shipped());
  });
});
