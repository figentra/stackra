/**
 * Stackra file contract:
 * Purpose: unit tests of `renderOgImage`: resvg starts once per process from its packaged WebAssembly, the card goes
 *          through satori and resvg at its width, resvg's memory is freed even when rendering throws, a failed start
 *          is retried on the next call, and the `./server` barrel exports exactly this function.
 * Boundary: test only; satori, resvg, the WebAssembly read and the fonts are mocked, so no network or engine runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 7).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { OgCard } from "#contracts/types/og-card.type";

/** The fakes the mocked modules share with the tests. */
const engines = vi.hoisted(() => ({
  satori: vi.fn(async () => "<svg/>"),
  initWasm: vi.fn(async () => undefined),
  render: vi.fn(() => ({ asPng: () => new Uint8Array([137, 80, 78, 71]) })),
  free: vi.fn(),
  options: [] as unknown[],
  readFile: vi.fn(async () => new Uint8Array([0, 97, 115, 109])),
}));

vi.mock("satori", () => ({ default: engines.satori }));
vi.mock("@resvg/resvg-wasm", () => ({
  initWasm: engines.initWasm,
  Resvg: class {
    render = engines.render;

    free = engines.free;

    constructor(_svg: string, options: unknown) {
      engines.options.push(options);
    }
  },
}));
vi.mock("node:fs/promises", () => ({ readFile: engines.readFile }));
vi.mock("node:module", () => ({
  createRequire: () => ({ resolve: (id: string) => `/node_modules/${id}` }),
}));
vi.mock("#core/functions/load-og-fonts.function", () => ({ loadOgFonts: vi.fn(async () => []) }));

/** A site card. */
const CARD: OgCard = {
  template: "site",
  width: 1200,
  height: 630,
  title: "Acme",
  siteName: "Acme",
  dir: "ltr",
  brand: {},
  logo: "",
};

/** The function under test, from a fresh module so the start state is new. */
async function load() {
  return (await import("#server/functions/render-og-image.function")).renderOgImage;
}

describe("renderOgImage", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    engines.options.length = 0;
  });

  it("renders the card through satori and resvg at its width", async () => {
    const png = await (await load())(CARD);
    expect(Array.from(png)).toEqual([137, 80, 78, 71]);
    expect(engines.readFile).toHaveBeenCalledWith("/node_modules/@resvg/resvg-wasm/index_bg.wasm");
    expect(engines.satori).toHaveBeenCalledWith(expect.objectContaining({ type: "div" }), {
      width: 1200,
      height: 630,
      fonts: [],
    });
    expect(engines.options).toEqual([{ fitTo: { mode: "width", value: 1200 } }]);
    expect(engines.free).toHaveBeenCalledTimes(1);
  });

  it("starts resvg once per process", async () => {
    const renderOgImage = await load();
    await renderOgImage(CARD);
    await renderOgImage(CARD);
    expect(engines.initWasm).toHaveBeenCalledTimes(1);
  });

  it("frees resvg when rendering throws", async () => {
    engines.render.mockImplementationOnce(() => {
      throw new Error("render failed");
    });
    await expect((await load())(CARD)).rejects.toThrow("render failed");
    expect(engines.free).toHaveBeenCalledTimes(1);
  });

  it("tries a failed start again on the next call", async () => {
    engines.initWasm.mockRejectedValueOnce(new Error("no wasm"));
    const renderOgImage = await load();
    await expect(renderOgImage(CARD)).rejects.toThrow("no wasm");
    await expect(renderOgImage(CARD)).resolves.toBeInstanceOf(Uint8Array);
    expect(engines.initWasm).toHaveBeenCalledTimes(2);
  });

  it("is the one export of the ./server entry", async () => {
    const server = await import("#server/index");
    expect(Object.keys(server)).toEqual(["renderOgImage"]);
  });
});
