/**
 * Stackra file contract:
 * Purpose: `MemoryPageReaderDriver`, the in-process `PageReader`: pages are fixed HTML by URL, read through the same
 *          `parsePage` as the HTTP driver, for tests, evals and local runs.
 * Boundary: no network. Built with no arguments (it holds no page) so the container can make it; `of(pages)` holds
 *           the given pages. A URL it does not hold is `Unreachable`; every page it holds reads with status 200 and no text
 *           limit. It applies no egress check: the URLs are the test's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0450 (decision 1); STA-904 (page reader).
 */
import { Driver } from "@stackra/container";

import { PageReadRefusal } from "#contracts/enums/page-read-refusal.enum";
import { PageReader } from "#contracts/ports/page-reader.port";
import type { PageReadResult } from "#contracts/types/page-read-result.type";
import { parsePage } from "#core/functions/parse-page.function";

/**
 * Reads pages from memory.
 *
 * @example
 * const pages = MemoryPageReaderDriver.of({ "https://shop.example.com/": "<title>Shop</title>" });
 * await pages.read("https://shop.example.com/"); // { ok: true, page: { title: "Shop", ... } }
 */
export class MemoryPageReaderDriver extends Driver(PageReader) {
  /** The HTML by URL. */
  private pages: ReadonlyMap<string, string> = new Map();

  /**
   * A reader that serves `pages`.
   *
   * @param pages - the HTML of each URL the driver serves.
   * @returns the driver.
   */
  static of(pages: Readonly<Record<string, string>>): MemoryPageReaderDriver {
    const driver = new MemoryPageReaderDriver();
    driver.pages = new Map(Object.entries(pages));
    return driver;
  }

  /** Answers the page held for `url` with status 200, or the `Unreachable` refusal when none is held. */
  async read(url: string): Promise<PageReadResult> {
    const html = this.pages.get(url);
    if (html === undefined) return { ok: false, refusal: PageReadRefusal.Unreachable };
    return { ok: true, page: Object.freeze({ url, status: 200, ...parsePage(html, url) }) };
  }
}
