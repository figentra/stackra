/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPageReaderDriver`: it is a `PageReader`, reads a page it holds through `parsePage`, and
 *          refuses a URL it does not hold as unreachable.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0450 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { PageReader } from "#contracts/ports/page-reader.port";
import { MemoryPageReaderDriver } from "#core/drivers/memory-page-reader.driver";

describe(MemoryPageReaderDriver, () => {
  it("reads the pages it holds", async () => {
    const pages = new MemoryPageReaderDriver({
      "https://shop.example.com/": "<title>Shop</title><p>Welcome</p>",
    });
    expect(pages).toBeInstanceOf(PageReader);
    expect(await pages.read("https://shop.example.com/")).toEqual({
      ok: true,
      page: {
        url: "https://shop.example.com/",
        status: 200,
        title: "Shop",
        text: "Welcome",
        truncated: false,
        products: [],
      },
    });
    expect(await pages.read("https://shop.example.com/missing")).toEqual({
      ok: false,
      refusal: "unreachable",
    });
  });
});
