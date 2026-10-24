/**
 * Stackra file contract:
 * Purpose: unit tests of `renderOgCard`: the card's tree, size and fonts reach the layout engine, its SVG reaches the
 *          rasteriser at the card's width, the bytes come back as a fresh `Uint8Array`, and a size outside 200 to
 *          4096 whole pixels is refused before any fetch.
 * Boundary: test only; the font loader is mocked and both engines are fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 7).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import type { OgCard } from "#contracts/types/og-card.type";
import { loadOgFonts } from "#core/functions/load-og-fonts.function";
import { renderOgCard } from "#core/functions/render-og-card.function";

vi.mock("#core/functions/load-og-fonts.function", () => ({
  loadOgFonts: vi.fn(async () => [
    { name: "Inter", data: new ArrayBuffer(1), weight: 700, style: "normal" },
  ]),
}));

/** A product card. */
const CARD: OgCard = {
  template: "product",
  width: 1200,
  height: 630,
  title: "Blue mug",
  siteName: "Acme",
  dir: "ltr",
  brand: {},
  logo: "",
};

describe("renderOgCard", () => {
  it("lays the card out and rasterises it at its width", async () => {
    const layout = vi.fn(async () => "<svg/>");
    const rasterize = vi.fn(() => new Uint8Array([137, 80, 78, 71]));
    const png = await renderOgCard(CARD, layout, rasterize);
    expect(layout).toHaveBeenCalledWith(expect.objectContaining({ type: "div" }), {
      width: 1200,
      height: 630,
      fonts: [{ name: "Inter", data: expect.any(ArrayBuffer), weight: 700, style: "normal" }],
    });
    expect(rasterize).toHaveBeenCalledWith("<svg/>", 1200);
    expect(png).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(png.buffer).toBeInstanceOf(ArrayBuffer);
  });

  it("refuses a size outside 200 to 4096 whole pixels before fetching fonts", async () => {
    vi.mocked(loadOgFonts).mockClear();
    for (const size of [{ width: 199 }, { height: 4097 }, { width: 1200.5 }]) {
      await expect(renderOgCard({ ...CARD, ...size }, vi.fn(), vi.fn())).rejects.toThrow(
        RangeError,
      );
    }
    expect(loadOgFonts).not.toHaveBeenCalled();
  });

  it("throws what an engine throws", async () => {
    const layout = vi.fn(async () => {
      throw new Error("layout failed");
    });
    await expect(renderOgCard(CARD, layout, vi.fn())).rejects.toThrow("layout failed");
  });
});
