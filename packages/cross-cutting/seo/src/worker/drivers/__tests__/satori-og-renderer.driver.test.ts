/**
 * Stackra file contract:
 * Purpose: unit tests of `SatoriOgRendererDriver`: it is the `OgRenderer` port, both engines start once per isolate
 *          from their bundled modules, the card goes through satori and resvg at its width, resvg's memory is freed,
 *          a failed start is retried on the next card, and the `./worker` barrel exports exactly this driver.
 * Boundary: test only; satori's standalone build, resvg, the `.wasm` modules and the fonts are mocked, so no network or
 *           engine runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 7); ADR 0294 (decision 17).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { OgCard } from "#contracts/types/og-card.type";

/** The fakes the mocked modules share with the tests. */
const engines = vi.hoisted(() => ({
  satori: vi.fn(async () => "<svg/>"),
  initSatori: vi.fn(async () => undefined),
  initWasm: vi.fn(async () => undefined),
  free: vi.fn(),
  options: [] as unknown[],
  yoga: { module: "yoga" },
  resvg: { module: "resvg" },
}));

vi.mock("satori/standalone", () => ({ default: engines.satori, init: engines.initSatori }));
vi.mock("satori/yoga.wasm", () => ({ default: engines.yoga }));
vi.mock("@resvg/resvg-wasm/index_bg.wasm", () => ({ default: engines.resvg }));
vi.mock("@resvg/resvg-wasm", () => ({
  initWasm: engines.initWasm,
  Resvg: class {
    constructor(_svg: string, options: unknown) {
      engines.options.push(options);
    }
    render = () => ({ asPng: () => new Uint8Array([137, 80, 78, 71]) });
    free = engines.free;
  },
}));
vi.mock("#core/functions/load-og-fonts.function", () => ({ loadOgFonts: vi.fn(async () => []) }));

/** A product card on a right-to-left site. */
const CARD: OgCard = {
  template: "product",
  width: 1200,
  height: 630,
  title: "كوب أزرق",
  siteName: "Acme",
  dir: "rtl",
  brand: {},
  logo: "",
  image: "https://cdn.acme.test/mug.jpg",
};

/** The driver class, from a fresh module so the start state is new. */
async function load() {
  return (await import("#worker/drivers/satori-og-renderer.driver")).SatoriOgRendererDriver;
}

describe("SatoriOgRendererDriver", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    engines.options.length = 0;
  });

  it("is the OgRenderer port", async () => {
    const Driver = await load();
    // the same module instance as the freshly loaded driver's
    const { OgRenderer } = await import("#contracts/ports/og-renderer.port");
    expect(new Driver()).toBeInstanceOf(OgRenderer);
  });

  it("renders the card through satori and resvg at its width", async () => {
    const Driver = await load();
    const png = await new Driver().render(CARD);
    expect(Array.from(png)).toEqual([137, 80, 78, 71]);
    expect(engines.initSatori).toHaveBeenCalledWith(engines.yoga);
    expect(engines.initWasm).toHaveBeenCalledWith(engines.resvg);
    expect(engines.satori).toHaveBeenCalledWith(expect.objectContaining({ type: "div" }), {
      width: 1200,
      height: 630,
      fonts: [],
    });
    expect(engines.options).toEqual([{ fitTo: { mode: "width", value: 1200 } }]);
    expect(engines.free).toHaveBeenCalledTimes(1);
  });

  it("starts both engines once per isolate", async () => {
    const Driver = await load();
    await new Driver().render(CARD);
    await new Driver().render(CARD);
    expect(engines.initSatori).toHaveBeenCalledTimes(1);
    expect(engines.initWasm).toHaveBeenCalledTimes(1);
  });

  it("tries a failed start again on the next card", async () => {
    engines.initSatori.mockRejectedValueOnce(new Error("no yoga"));
    const driver = new (await load())();
    await expect(driver.render(CARD)).rejects.toThrow("no yoga");
    await expect(driver.render(CARD)).resolves.toBeInstanceOf(Uint8Array);
  });

  it("is the one export of the ./worker entry", async () => {
    const worker = await import("#worker/index");
    expect(Object.keys(worker)).toEqual(["SatoriOgRendererDriver"]);
  });
});
