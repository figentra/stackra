/**
 * Stackra file contract:
 * Purpose: `renderOgImage`, the Open Graph image of a card on a server runtime: the card laid out by satori and
 *          rasterised to PNG by resvg, with resvg's WebAssembly read from its package once per process.
 * Boundary: Node only: it reads the WebAssembly file through `node:fs`. A Cloudflare Worker cannot compile
 *           WebAssembly from bytes; there the `OgRenderer` port with `SatoriOgRendererDriver` (`./worker`) renders the
 *           same card. A failed start is forgotten, so the next call tries again.
 * Runtime: node
 * Governing contract: ADR 0301 (decision 7); ADR 0127 2026-10-24 note (`./server` entry).
 */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { initWasm, Resvg } from "@resvg/resvg-wasm";
import satori from "satori";

import type { OgCard } from "#contracts/types/og-card.type";
import { renderOgCard } from "#core/functions/render-og-card.function";

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
 * The PNG of `card`.
 *
 * @example
 * const png = await renderOgImage({ template: OgKind.Site, width: 1200, height: 630, title, siteName, dir, brand, logo });
 * return new Response(png, { headers: { "Content-Type": "image/png" } });
 * @throws RangeError when the card size is not whole pixels from 200 to 4096.
 * @throws Error when resvg cannot start, a font cannot be fetched or the card cannot be laid out.
 */
export async function renderOgImage(card: OgCard): Promise<Uint8Array<ArrayBuffer>> {
  await startResvg();
  return renderOgCard(
    card,
    (tree, options) => satori(tree as Parameters<typeof satori>[0], options),
    (svg, width) => {
      const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
      try {
        return resvg.render().asPng();
      } finally {
        resvg.free();
      }
    },
  );
}
