/**
 * Stackra file contract:
 * Purpose: unit tests of `robotsTxt`: one block per crawler group so a rule never crosses to another crawler, an empty
 *          group still valid, the disallow-all body of a preview host, one or several sitemap links, and the refusal
 *          of a line break or an empty user agent.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { robotsTxt } from "#core/functions/robots-txt.function";

describe("robotsTxt", () => {
  it("writes one block per crawler and the sitemap link", () => {
    expect(
      robotsTxt({
        groups: [
          { userAgent: "*", allow: ["/"], disallow: ["/store?q=", "/*?preview="] },
          { userAgent: "GPTBot", allow: [], disallow: ["/store"] },
        ],
        sitemap: "https://acme.test/sitemap.xml",
      }),
    ).toBe(
      "User-agent: *\nAllow: /\nDisallow: /store?q=\nDisallow: /*?preview=\n\n" +
        "User-agent: GPTBot\nDisallow: /store\n\n" +
        "Sitemap: https://acme.test/sitemap.xml\n",
    );
  });

  it("keeps a crawler's rule out of every other group", () => {
    const text = robotsTxt({
      groups: [
        { userAgent: "*", allow: ["/"], disallow: [] },
        { userAgent: "GPTBot", allow: [], disallow: ["/store"] },
      ],
    });
    const [everyone] = text.split("\n\n");
    expect(everyone).not.toContain("/store");
  });

  it("writes an empty Disallow for a group with no rules", () => {
    expect(robotsTxt({ groups: [{ userAgent: "*", allow: [], disallow: [] }] })).toBe(
      "User-agent: *\nDisallow:\n",
    );
  });

  it("writes the disallow-all body of a preview host", () => {
    expect(robotsTxt({ groups: [{ userAgent: "*", allow: [], disallow: ["/"] }] })).toBe(
      "User-agent: *\nDisallow: /\n",
    );
  });

  it("writes several sitemap links", () => {
    const text = robotsTxt({
      groups: [],
      sitemap: ["https://a.test/s.xml", "https://b.test/s.xml"],
    });
    expect(text).toBe("Sitemap: https://a.test/s.xml\nSitemap: https://b.test/s.xml\n");
  });

  it("refuses a value with a line break and an empty user agent", () => {
    expect(() =>
      robotsTxt({ groups: [{ userAgent: "*", allow: ["/\nUser-agent: x"], disallow: [] }] }),
    ).toThrow(TypeError);
    expect(() => robotsTxt({ groups: [{ userAgent: "a\rb", allow: [], disallow: [] }] })).toThrow(
      TypeError,
    );
    expect(() => robotsTxt({ groups: [{ userAgent: " ", allow: [], disallow: [] }] })).toThrow(
      TypeError,
    );
    expect(() => robotsTxt({ groups: [], sitemap: "https://a.test/\n" })).toThrow(TypeError);
  });
});
