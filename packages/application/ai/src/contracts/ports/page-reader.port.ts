/**
 * Stackra file contract:
 * Purpose: the `PageReader` port: reads one web page by URL into readable text and structured product hints, for an
 *          agent or a flow that starts from a URL (Commerce's store from a URL).
 * Boundary: an abstract class that is its own token, keyed `ai.PageReader`. The memory driver in `.` serves tests,
 *           evals and local runs from fixed HTML; `HttpPageReaderDriver` in `.` fetches within an egress bound the
 *           service passes from settings (`PageReaderPolicy`). The port fetches one page: no crawl, no script run, no
 *           cookies or credentials sent, nothing stored.
 * Runtime: isomorphic
 * Governing contract: ADR 0450; ADR 0100 (decision 3: a tool is an action, so the action that reads a page injects
 *                     this port); STA-904 (page reader).
 */
import { Port } from "@stackra/contracts";

import type { PageReadResult } from "#contracts/types/page-read-result.type";

/**
 * Reads web pages.
 *
 * @example
 * const result = await pages.read("https://shop.example.com/products/abaya");
 * if (result.ok) draftProducts(result.page.products);
 */
export abstract class PageReader extends Port {
  /** Type-only port key, so `DriverName<PageReader>` narrows to this port's drivers. */
  declare readonly "~key": "ai.PageReader";

  /** Reads the page at `url`; a refusal when it is outside the egress bound or cannot be read. */
  abstract read(url: string): Promise<PageReadResult>;
}
