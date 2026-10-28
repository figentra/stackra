/**
 * Stackra file contract:
 * Purpose: unit tests of `HttpPageReaderDriver` over a stub fetch: it reads an HTML page with the policy's headers and
 *          text limit, follows a redirect and checks its target against the egress bound, stops at the redirect limit,
 *          and refuses an egress-bound URL (without fetching), an error status, a non-HTML answer, an oversize body
 *          (declared or streamed), a timeout and an unreachable host.
 * Boundary: test only; no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0450 (decisions 1 and 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { PageReader } from "#contracts/ports/page-reader.port";
import { HttpPageReaderDriver } from "#core/drivers/http-page-reader.driver";
import type { PageReaderPolicy } from "#core/types/page-reader-policy.type";

const POLICY: PageReaderPolicy = {
  maxBytes: 1000,
  timeoutMs: 5000,
  maxRedirects: 1,
  maxTextChars: 100,
  userAgent: "StackraPageReader/1.0",
};

/** An HTML answer. */
function html(body: string, headers: Record<string, string> = {}): Response {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8", ...headers },
  });
}

/** A fetch stub that answers with `answers` in turn (the last one repeated) and records each call. */
function stub(...answers: Response[]): typeof fetch & { readonly calls: [string, RequestInit][] } {
  const calls: [string, RequestInit][] = [];
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    calls.push([String(input), init ?? {}]);
    const answer = answers[Math.min(calls.length, answers.length) - 1];
    if (answer === undefined) throw new TypeError("no answer");
    return answer.clone();
  };
  return Object.assign(fetcher, { calls });
}

/** A redirect answer to `location`. */
function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { location } });
}

describe(HttpPageReaderDriver, () => {
  it("reads an HTML page within the policy", async () => {
    const fetcher = stub(html("<title>Shop</title><p>Welcome</p>"));
    const pages = HttpPageReaderDriver.within(POLICY, fetcher);
    expect(pages).toBeInstanceOf(PageReader);
    const result = await pages.read("https://shop.example.com/");
    expect(result).toEqual({
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
    expect(fetcher.calls[0]?.[1]).toMatchObject({
      method: "GET",
      redirect: "manual",
      credentials: "omit",
      headers: { "user-agent": "StackraPageReader/1.0" },
    });
  });

  it("follows a redirect and checks its target", async () => {
    const followed = HttpPageReaderDriver.within(
      POLICY,
      stub(redirect("/home"), html("<p>Home</p>")),
    );
    const read = await followed.read("https://shop.example.com/");
    expect(read.ok && read.page.url).toBe("https://shop.example.com/home");

    const internal = stub(redirect("https://10.0.0.1/admin"));
    expect(
      await HttpPageReaderDriver.within(POLICY, internal).read("https://shop.example.com/"),
    ).toEqual({
      ok: false,
      refusal: "egress_refused",
    });
    expect(internal.calls).toHaveLength(1);

    const loop = stub(redirect("/again"));
    expect(
      await HttpPageReaderDriver.within(POLICY, loop).read("https://shop.example.com/"),
    ).toEqual({
      ok: false,
      refusal: "too_many_redirects",
    });
  });

  it("refuses an egress-bound URL without fetching it", async () => {
    const fetcher = stub();
    const pages = HttpPageReaderDriver.within(
      { ...POLICY, allowHosts: ["shop.example.com"] },
      fetcher,
    );
    expect(await pages.read("https://other.example.com/")).toEqual({
      ok: false,
      refusal: "egress_refused",
    });
    expect(fetcher.calls).toHaveLength(0);
  });

  it.each([
    [new Response("gone", { status: 404 }), { refusal: "http_error", status: 404 }],
    [new Response(null, { status: 301 }), { refusal: "http_error", status: 301 }],
    [
      new Response("{}", { headers: { "content-type": "application/json" } }),
      { refusal: "not_html", status: 200 },
    ],
    [html("<p>x</p>", { "content-length": "5000" }), { refusal: "too_large", status: 200 }],
    [html(`<p>${"x".repeat(2000)}</p>`), { refusal: "too_large", status: 200 }],
  ])("refuses a bad answer", async (answer, refusal) => {
    const pages = HttpPageReaderDriver.within(POLICY, async () => answer);
    expect(await pages.read("https://shop.example.com/")).toEqual({ ok: false, ...refusal });
  });

  it("refuses a timeout and an unreachable host", async () => {
    const slow = HttpPageReaderDriver.within(POLICY, async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    expect(await slow.read("https://shop.example.com/")).toEqual({ ok: false, refusal: "timeout" });
    const down = HttpPageReaderDriver.within(POLICY, async () => {
      throw new TypeError("fetch failed");
    });
    expect(await down.read("https://shop.example.com/")).toEqual({
      ok: false,
      refusal: "unreachable",
    });
  });

  it("cuts the text at the policy's limit", async () => {
    const pages = HttpPageReaderDriver.within(POLICY, async () =>
      html(`<p>${"a".repeat(150)}</p>`),
    );
    const result = await pages.read("https://shop.example.com/");
    expect(result.ok && result.page.text.length).toBe(100);
    expect(result.ok && result.page.truncated).toBe(true);
  });
});
