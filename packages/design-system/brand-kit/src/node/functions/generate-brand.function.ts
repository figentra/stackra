/**
 * Stackra file contract:
 * Purpose: `generateBrand(options)`, one generator run: reads the kit, its theme (over the stackra theme, so a
 *          changes-only file works) and its symbol, plans the generated set (`planBrand`, plus the store frames when
 *          captured screens are given), empties the output folder, writes every file (text as is, PNGs through resvg,
 *          the ICO from its PNGs) and an `outputs.json` index, and answers the record.
 * Boundary: writes only under `options.out`, which must sit outside the kit (generated files are never committed
 *           beside their sources). An existing output folder is emptied only when it holds this generator's
 *           `outputs.json`, so a mistyped `--out` never deletes someone's folder.
 * Runtime: node
 * Governing contract: ADR 0441 (decisions 5 and 7: generated sets are build artefacts, never committed).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

import { parseThemeJson, STACKRA_THEME } from "@stackra/tokens";

import type { BrandOutput } from "#contracts/types/brand-output.type";
import type { GenerateResult } from "#contracts/types/generate-result.type";
import { InvalidKitError } from "#core/errors/invalid-kit.error";
import { icoOf } from "#core/functions/ico-of.function";
import { planBrand } from "#core/functions/plan-brand.function";
import { planStoreFrames } from "#node/functions/plan-store-frames.function";
import { rasterizeSvg } from "#node/functions/rasterize-svg.function";
import { readKit } from "#node/functions/read-kit.function";

/** The index the generator writes beside its outputs, and looks for before emptying a folder. */
const INDEX = "outputs.json";

/** The bytes or text of one planned output. */
async function contentOf(output: BrandOutput): Promise<string | Uint8Array> {
  if (output.kind === "text") return output.text;
  if (output.kind === "png") return rasterizeSvg(output.svg, output.width);
  const images = [];
  for (const size of output.sizes) images.push({ size, png: await rasterizeSvg(output.svg, size) });
  return icoOf(images);
}

/**
 * Generates the kit at `options.kit` into `options.out`.
 *
 * @param options.kit - the kit folder (`<repo>/assets/brand`).
 * @param options.out - the output folder, outside the kit (Runway passes `.stackra/brand`, which is gitignored).
 * @param options.screenshots - captured screens, `<app>/<locale>/<name>.png`; no frames without it.
 * @param options.store - the store tree with the captions; the kit's sibling `store` folder when absent.
 * @throws InvalidKitError when the kit, its symbol or a caption breaks a rule, or `out` sits inside the kit or holds
 *         files this generator did not write.
 * @throws InvalidThemeError (from @stackra/tokens) when the theme file is unusable.
 * @example
 * const result = await generateBrand({ kit: "assets/brand", out: ".stackra/brand" });
 */
export async function generateBrand(options: {
  readonly kit: string;
  readonly out: string;
  readonly screenshots?: string | undefined;
  readonly store?: string | undefined;
}): Promise<GenerateResult> {
  const located = readKit(options.kit);
  const out = resolve(options.out);
  const inside = relative(located.dir, out);
  if (inside === "" || (!inside.startsWith("..") && !isAbsolute(inside)))
    throw new InvalidKitError(options.kit, [
      `the output folder ${options.out} is inside the kit; generated files are never committed beside their sources`,
    ]);
  if (existsSync(out) && readdirSync(out).length > 0 && !existsSync(join(out, INDEX)))
    throw new InvalidKitError(options.kit, [
      `${options.out} holds files this generator did not write; pick an empty folder`,
    ]);

  const { kit, dir } = located;
  const theme = parseThemeJson(readFileSync(join(dir, kit.theme), "utf8"), STACKRA_THEME);
  const outputs = planBrand(kit, theme, readFileSync(join(dir, kit.symbol), "utf8"));
  if (options.screenshots !== undefined)
    outputs.push(
      ...planStoreFrames(located, theme, {
        screenshots: options.screenshots,
        store: options.store ?? join(dir, "..", "store"),
      }),
    );

  await rm(out, { recursive: true, force: true });
  for (const output of outputs) {
    const file = join(out, output.path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, await contentOf(output));
  }
  const files = outputs.map((output) => output.path).sort();
  const result: GenerateResult = { kit: kit.id, out: options.out, files };
  await writeFile(join(out, INDEX), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
