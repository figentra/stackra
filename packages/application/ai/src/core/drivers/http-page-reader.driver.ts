/**
 * Stackra file contract:
 * Purpose: `HttpPageReaderDriver`, the `PageReader` that fetches a page over https within a `PageReaderPolicy`: every
 *          URL and every redirect target passes `checkEgress` first; redirects are followed by hand up to the limit;
 *          only an HTML response is read, up to the byte limit, within the time limit; the body is decoded by its
 *          declared charset and read with `parsePage`.
 * Boundary: built by `within(policy, fetcher?)`; its constructor takes nothing so gen can name it, and a reader built
 *           without a policy is unusable (the policy comes from settings, never a default). GET only, no cookies, no credentials, no script run, nothing stored or logged. A refusal carries the code
 *           and, for an error answer, the status; never a body or header. The fetch function is injected (the
 *           platform `fetch` by default) so the service can pass its egress-proxied client and tests a stub. Server
 *           only (Node, Workers): it needs `redirect: "manual"` to return the 3xx answer, which a browser hides.
 * Runtime: node
 * Governing contract: ADR 0450 (decisions 1 and 3); ADR 0308 (rule 19); STA-904 (page reader).
 */
import { Driver } from "@stackra/container";

import { PageReadRefusal } from "#contracts/enums/page-read-refusal.enum";
import { PageReader } from "#contracts/ports/page-reader.port";
import type { PageReadResult } from "#contracts/types/page-read-result.type";
import { checkEgress } from "#core/functions/check-egress.function";
import { parsePage } from "#core/functions/parse-page.function";
import type { PageReaderPolicy } from "#core/types/page-reader-policy.type";

/** The content types read as HTML. */
const HTML_TYPE = /^\s*(?:text\/html|application\/xhtml\+xml)\b/i;

/** The body of `response`, or undefined once it passes `maxBytes`. */
async function bodyOf(response: Response, maxBytes: number): Promise<Uint8Array | undefined> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (response.body !== null) {
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(value);
    }
  }
  const body = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    body.set(chunk, at);
    at += chunk.byteLength;
  }
  return body;
}

/** `body` decoded by the charset `contentType` declares, UTF-8 when it declares none or one unknown here. */
function textOf(body: Uint8Array, contentType: string): string {
  const charset = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(charset).decode(body);
  } catch {
    return new TextDecoder().decode(body);
  }
}

/**
 * Fetches pages within an egress bound.
 *
 * @example
 * container.bind(PageReader, () => HttpPageReaderDriver.within(settings.pageReader));
 */
export class HttpPageReaderDriver extends Driver(PageReader) {
  /** The egress bound and limits; set by `within`. */
  private policy!: PageReaderPolicy;

  /** The fetch function. */
  private fetcher: typeof fetch = (input, init) => fetch(input, init);

  /**
   * A reader bound by `policy`.
   *
   * @param policy - the egress bound and limits, from settings.
   * @param fetcher - the fetch function; the platform `fetch` when left out.
   * @returns the driver.
   */
  static within(policy: PageReaderPolicy, fetcher?: typeof fetch): HttpPageReaderDriver {
    const driver = new HttpPageReaderDriver();
    driver.policy = policy;
    if (fetcher !== undefined) driver.fetcher = fetcher;
    return driver;
  }

  /** Fetches `url` within the policy, following each checked redirect by hand, and answers the page or the refusal. */
  async read(url: string): Promise<PageReadResult> {
    let target = url;
    for (let hop = 0; hop <= this.policy.maxRedirects; hop += 1) {
      const refused = checkEgress(target, this.policy);
      if (refused !== undefined) return { ok: false, refusal: refused };
      try {
        const response = await this.fetcher(target, {
          method: "GET",
          redirect: "manual",
          credentials: "omit",
          signal: AbortSignal.timeout(this.policy.timeoutMs),
          headers: {
            accept: "text/html,application/xhtml+xml",
            "user-agent": this.policy.userAgent,
          },
        });
        const { status } = response;
        if (status >= 300 && status < 400) {
          const location = response.headers.get("location");
          await response.body?.cancel();
          if (location === null) return { ok: false, refusal: PageReadRefusal.HttpError, status };
          target = new URL(location, target).href;
          continue;
        }
        if (status < 200 || status >= 300) {
          await response.body?.cancel();
          return { ok: false, refusal: PageReadRefusal.HttpError, status };
        }
        const contentType = response.headers.get("content-type") ?? "";
        if (!HTML_TYPE.test(contentType)) {
          await response.body?.cancel();
          return { ok: false, refusal: PageReadRefusal.NotHtml, status };
        }
        if (Number(response.headers.get("content-length") ?? 0) > this.policy.maxBytes) {
          await response.body?.cancel();
          return { ok: false, refusal: PageReadRefusal.TooLarge, status };
        }
        const body = await bodyOf(response, this.policy.maxBytes);
        if (body === undefined) return { ok: false, refusal: PageReadRefusal.TooLarge, status };
        const html = textOf(body, contentType);
        return {
          ok: true,
          page: Object.freeze({
            url: target,
            status,
            ...parsePage(html, target, this.policy.maxTextChars),
          }),
        };
      } catch (error) {
        // `AbortSignal.timeout` rejects with a DOMException named TimeoutError, not always an `Error` subclass.
        const timedOut =
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          error.name === "TimeoutError";
        return {
          ok: false,
          refusal: timedOut ? PageReadRefusal.Timeout : PageReadRefusal.Unreachable,
        };
      }
    }
    return { ok: false, refusal: PageReadRefusal.TooManyRedirects };
  }
}
