/**
 * Stackra file contract:
 * Purpose: unit tests of `generateBrand`: a run writes the planned set and its `outputs.json` index outside the kit,
 *          real PNGs and an ICO included; a second run replaces its own folder; a folder of someone else's files is
 *          never emptied.
 * Boundary: test only; writes in the system temporary folder and rasterises with resvg's WebAssembly.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decisions 5 and 7).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { InvalidKitError } from "#core/errors/invalid-kit.error";
import { pngSize } from "#core/functions/png-size.function";
import { generateBrand } from "#node/functions/generate-brand.function";
import { makeKitFolder } from "#node/functions/__tests__/fixtures/kit-folder.fixture";

describe("generateBrand", () => {
  it("writes the set and its index", async () => {
    const { root, kit } = makeKitFolder("acme");
    const out = join(root, ".stackra", "brand");
    const result = await generateBrand({ kit, out });
    expect(result.kit).toBe("acme");
    expect(result.files).toContain("favicon/favicon.ico");
    expect(JSON.parse(readFileSync(join(out, "outputs.json"), "utf8"))).toEqual(result);
    expect(pngSize(readFileSync(join(out, "icons/app-icon-1024.png")))).toEqual({
      width: 1024,
      height: 1024,
    });
    expect(readFileSync(join(out, "favicon/favicon.ico")).readUInt16LE(4)).toBe(3);

    writeFileSync(join(out, "stale.txt"), "old");
    await generateBrand({ kit, out });
    expect(existsSync(join(out, "stale.txt"))).toBe(false);
  });

  it("never empties a folder it did not write", async () => {
    const { root, kit } = makeKitFolder("acme");
    const out = join(root, "docs");
    mkdirSync(out);
    writeFileSync(join(out, "keep.md"), "mine");
    await expect(generateBrand({ kit, out })).rejects.toThrow(InvalidKitError);
    expect(readFileSync(join(out, "keep.md"), "utf8")).toBe("mine");
  });
});
