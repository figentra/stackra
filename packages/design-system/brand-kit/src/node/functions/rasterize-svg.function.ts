/**
 * Stackra file contract:
 * Purpose: `rasterizeSvg(svg, width)`, the PNG of an SVG at a pixel width (the height follows its aspect), rendered by
 *          resvg from its packaged WebAssembly, which starts once per process.
 * Boundary: no browser and no system font: every SVG the generator makes is paths and embedded PNGs only, so the
 *           output is the same on every machine. A failed start is forgotten, so the next call tries again.
 * Runtime: node
 * Governing contract: ADR 0441 (decision 5); the resvg start of @stackra/seo's `renderOgImage`.
 */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { initWasm, Resvg } from "@resvg/resvg-wasm";

/** resvg's start, once per process. */
let started: Promise<void> | undefined;

/** Starts resvg from its packaged WebAssembly. */
function startResvg(): Promise<void> {
  started ??= readFile(createRequire(import.meta.url).resolve("@resvg/resvg-wasm/index_bg.wasm"))
    .then((wasm) => initWasm(wasm))
    .catch((error: unknown) => {
      started = undefined;
      throw error;
    });
  return started;
}

/**
 * The PNG bytes of `svg` at `width` pixels.
 *
 * @throws Error when resvg cannot start or cannot read the SVG.
 * @example
 * await writeFile("icon-512.png", await rasterizeSvg(svg, 512));
 */
export async function rasterizeSvg(svg: string, width: number): Promise<Uint8Array> {
  await startResvg();
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  try {
    return resvg.render().asPng();
  } finally {
    resvg.free();
  }
}
