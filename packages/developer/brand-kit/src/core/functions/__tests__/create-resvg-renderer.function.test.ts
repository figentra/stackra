/**
 * Stackra file contract:
 * Purpose: unit tests of `createResvgRenderer`: resvg's WebAssembly is read and started once per process however many renderers are
 *          made; a failed start is forgotten, so the next call tries again; the renderer fits the SVG to the width asked for,
 *          sets text in the kit's fonts only, returns the PNG, and frees the resvg instance whether the render worked or threw.
 * Boundary: test only; `@resvg/resvg-wasm` and `node:fs/promises` are fakes, so nothing is rendered; the module is loaded fresh per test
 *           because it keeps the start in module state.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended: deterministic output).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

const resvg = vi.hoisted(() => ({
  initWasm: vi.fn(async (_wasm: unknown) => undefined),
  readFile: vi.fn(async (_path: string) => new Uint8Array([0, 97, 115, 109])),
  instances: [] as Array<{
    svg: string;
    options: Record<string, unknown>;
    freed: boolean;
    fail: boolean;
  }>,
  failRender: false,
}));

vi.mock("node:fs/promises", () => ({ readFile: resvg.readFile }));
vi.mock("@resvg/resvg-wasm", () => ({
  initWasm: resvg.initWasm,
  Resvg: class {
    private readonly record: (typeof resvg.instances)[number];

    constructor(svg: string, options: Record<string, unknown>) {
      this.record = { svg, options, freed: false, fail: resvg.failRender };
      resvg.instances.push(this.record);
    }

    render() {
      if (this.record.fail) throw new Error("bad svg");
      return { asPng: () => new Uint8Array([137, 80, 78, 71]) };
    }

    free() {
      this.record.freed = true;
    }
  },
}));

/** A fresh copy of the module, with no start remembered. */
const load = async () => {
  vi.resetModules();
  return (await import("#core/functions/create-resvg-renderer.function")).createResvgRenderer;
};

beforeEach(() => {
  resvg.initWasm.mockReset().mockResolvedValue(undefined);
  resvg.readFile.mockReset().mockResolvedValue(new Uint8Array([0, 97, 115, 109]));
  resvg.instances.length = 0;
  resvg.failRender = false;
});

describe("createResvgRenderer", () => {
  it("reads resvg's wasm and starts it once, however many renderers are made", async () => {
    const createResvgRenderer = await load();
    await createResvgRenderer([]);
    await createResvgRenderer([]);
    await Promise.all([createResvgRenderer([]), createResvgRenderer([])]);

    expect(resvg.readFile).toHaveBeenCalledTimes(1);
    expect(String(resvg.readFile.mock.calls[0]?.[0])).toMatch(/index_bg\.wasm$/);
    expect(resvg.initWasm).toHaveBeenCalledTimes(1);
    expect(resvg.initWasm).toHaveBeenCalledWith(new Uint8Array([0, 97, 115, 109]));
  });

  it("forgets a failed start, rejects with its error, and tries again on the next call", async () => {
    const createResvgRenderer = await load();
    resvg.initWasm.mockRejectedValueOnce(new Error("wasm refused"));

    await expect(createResvgRenderer([])).rejects.toThrow("wasm refused");
    await expect(createResvgRenderer([])).resolves.toBeTypeOf("function");
    expect(resvg.initWasm).toHaveBeenCalledTimes(2);
    expect(resvg.readFile).toHaveBeenCalledTimes(2);
  });

  it("forgets a failed read of the wasm file as well", async () => {
    const createResvgRenderer = await load();
    resvg.readFile.mockRejectedValueOnce(new Error("ENOENT"));

    await expect(createResvgRenderer([])).rejects.toThrow("ENOENT");
    await expect(createResvgRenderer([])).resolves.toBeTypeOf("function");
  });

  it("renders the PNG fitted to the width, in the kit's fonts and no others, and frees the instance", async () => {
    const createResvgRenderer = await load();
    const fonts = [new Uint8Array([1]), new Uint8Array([2])];
    const render = await createResvgRenderer(fonts);

    expect(await render("<svg/>", 512)).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(resvg.instances).toHaveLength(1);
    expect(resvg.instances[0]).toMatchObject({
      svg: "<svg/>",
      options: { fitTo: { mode: "width", value: 512 }, font: { fontBuffers: fonts } },
      freed: true,
    });
    // No system fonts: the font options name only the buffers.
    expect(Object.keys((resvg.instances[0]?.options["font"] as object) ?? {})).toEqual([
      "fontBuffers",
    ]);
  });

  it("frees the instance when the render throws, and passes the error on", async () => {
    const createResvgRenderer = await load();
    const render = await createResvgRenderer([]);
    resvg.failRender = true;

    await expect(render("<svg", 64)).rejects.toThrow("bad svg");
    expect(resvg.instances[0]?.freed).toBe(true);
  });

  it("takes a width per render and copies the fonts it was given", async () => {
    const createResvgRenderer = await load();
    const fonts = [new Uint8Array([9])];
    const render = await createResvgRenderer(fonts);
    await render("<svg/>", 16);
    await render("<svg/>", 32);

    expect(resvg.instances.map((instance) => instance.options["fitTo"])).toEqual([
      { mode: "width", value: 16 },
      { mode: "width", value: 32 },
    ]);
    const used = (resvg.instances[0]?.options["font"] as { fontBuffers: unknown[] } | undefined)
      ?.fontBuffers;
    expect(used).toEqual(fonts);
    expect(used).not.toBe(fonts);
  });
});
