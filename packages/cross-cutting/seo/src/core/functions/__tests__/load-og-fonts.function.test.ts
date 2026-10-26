/**
 * Stackra file contract:
 * Purpose: unit tests of `loadOgFonts` and `OG_FONTS`: every face fetched with its name, weight and style, each URL
 *          fetched once per isolate, a failed fetch thrown and retried on the next call, and the faces pinned to an
 *          exact version.
 * Boundary: test only; `fetch` is stubbed and the module is reloaded per test, so the isolate cache starts empty.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 7).
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { OG_FONTS } from "#core/constants/og-fonts.constant";

/** The module under test, fresh for each test. */
async function load() {
  return (await import("#core/functions/load-og-fonts.function")).loadOgFonts;
}

describe("loadOgFonts", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pins every face to an exact version of a WOFF file", () => {
    for (const face of OG_FONTS) expect(face.url).toMatch(/@\d+\.\d+\.\d+\/files\/.+\.woff$/);
    expect(OG_FONTS.map((face) => `${face.name} ${face.weight}`)).toEqual([
      "Inter 400",
      "Inter 700",
      "Noto Sans Arabic 400",
      "Noto Sans Arabic 700",
    ]);
  });

  it("answers every face with its bytes", async () => {
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])));
    vi.stubGlobal("fetch", fetchMock);
    const fonts = await (await load())();
    expect(fonts).toHaveLength(OG_FONTS.length);
    expect(fonts[0]).toMatchObject({ name: "Inter", weight: 400, style: "normal" });
    expect(new Uint8Array(fonts[0]?.data ?? new ArrayBuffer(0))).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("fetches each URL once per isolate", async () => {
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([1])));
    vi.stubGlobal("fetch", fetchMock);
    const loadOgFonts = await load();
    await loadOgFonts();
    await loadOgFonts();
    expect(fetchMock).toHaveBeenCalledTimes(OG_FONTS.length);
  });

  it("throws a failed fetch and tries again on the next call", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      // A fresh Response per call: a body reads once.
      .mockImplementation(async () => new Response(new Uint8Array([1])))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const loadOgFonts = await load();
    await expect(loadOgFonts()).rejects.toThrow(/HTTP 503/);
    await expect(loadOgFonts()).resolves.toHaveLength(OG_FONTS.length);
  });
});
