/**
 * Stackra file contract:
 * Purpose: `SatoriOgRendererDriver` (`satori`), the `OgRenderer` driver for a Cloudflare Worker: the card laid out by
 *          satori's standalone build and rasterised to PNG by resvg, both started from WebAssembly modules wrangler
 *          bundles (a Worker cannot compile WebAssembly from bytes).
 * Boundary: both engines start once per isolate, on the first card; a failed start is forgotten, so the next card
 *           tries again. Fonts are fetched once per isolate. It renders only; the route sets the caching.
 * Runtime: worker
 * Governing contract: ADR 0301 (decision 7); ADR 0294 (decision 17); ADR 0127 2026-10-24 note (`./worker` entry).
 */
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import { Driver } from "@stackra/container";
import satori, { init as initSatori } from "satori/standalone";
import yogaWasm from "satori/yoga.wasm";

import { OgRenderer } from "#contracts/ports/og-renderer.port";
import type { OgCard } from "#contracts/types/og-card.type";
import { renderOgCard } from "#core/functions/render-og-card.function";

/** Both engines' start, once per isolate. */
let started: Promise<void> | undefined;

/** Starts satori's layout engine and resvg from their bundled modules. */
function startEngines(): Promise<void> {
  started ??= Promise.all([initSatori(yogaWasm), initWasm(resvgWasm)]).then(
    () => undefined,
    (error: unknown) => {
      started = undefined;
      throw error;
    },
  );
  return started;
}

/**
 * Open Graph images on a Worker.
 *
 * @example
 * // generated wiring, web worker
 * { port: OgRenderer, candidates: { satori: () => import("@stackra/seo/worker").then((m) => m.SatoriOgRendererDriver) } }
 */
export class SatoriOgRendererDriver extends Driver(OgRenderer) {
  /**
   * The PNG of `card`.
   *
   * @throws RangeError when the card size is not whole pixels from 200 to 4096.
   * @throws Error when an engine cannot start, a font cannot be fetched or the card cannot be laid out.
   */
  async render(card: OgCard): Promise<Uint8Array<ArrayBuffer>> {
    await startEngines();
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
}
