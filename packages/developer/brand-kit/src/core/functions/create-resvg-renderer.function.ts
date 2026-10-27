/**
 * Stackra file contract:
 * Purpose: `createResvgRenderer`, the default `SvgRenderer`: resvg (WebAssembly) with the kit's fonts and no system
 *          fonts, so the same SVG gives the same PNG on every machine.
 * Boundary: Node only: it reads resvg's WebAssembly through `node:fs`, once per process (the @stackra/seo pattern); a
 *           failed start is forgotten so the next call tries again.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: deterministic output).
 */
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { initWasm, Resvg } from "@resvg/resvg-wasm";

import type { SvgRenderer } from "#contracts/types/svg-renderer.type";

/** resvg's start, once per process. */
let started: Promise<void> | undefined;

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
 * A renderer that sets text in `fonts`.
 *
 * @example
 * const render = await createResvgRenderer(input.fonts);
 * const png = await render(svg, 1024);
 * @throws Error when resvg cannot start.
 */
export async function createResvgRenderer(fonts: readonly Uint8Array[]): Promise<SvgRenderer> {
  await startResvg();
  return async (svg, width) => {
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: width },
      font: { fontBuffers: [...fonts] },
    });
    try {
      return resvg.render().asPng();
    } finally {
      resvg.free();
    }
  };
}
