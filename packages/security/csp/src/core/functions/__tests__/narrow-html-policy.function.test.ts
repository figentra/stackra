/**
 * Stackra file contract:
 * Purpose: unit tests of `narrowHtmlPolicy`: a tag survives only when the base allows it too, an attribute only when
 *          both allow it, content is dropped wherever either drops it, the result is frozen and the inputs untouched,
 *          and a policy run through it cannot make `sanitizeHtml` keep an image, a tracking `src` or a link `target`
 *          that the rich-text default refuses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); OWASP XSS prevention;
 *                     STA-2582.
 */
import { describe, expect, it } from "@stackra/testing";

import { RICH_TEXT_HTML_POLICY } from "#core/constants/rich-text-html-policy.constant";
import { narrowHtmlPolicy } from "#core/functions/narrow-html-policy.function";
import { sanitizeHtml } from "#core/functions/sanitize-html.function";
import type { HtmlPolicy } from "#core/types/html-policy.type";

/** A host policy that tries to widen the default: an image, a tracking source, a link target, a table. */
const WIDER: HtmlPolicy = {
  tags: {
    p: ["dir", "class"],
    a: ["href", "target", "ping"],
    img: ["src", "alt"],
    video: ["src", "poster"],
    table: [],
  },
  dropWithContent: ["details"],
};

describe("narrowHtmlPolicy", () => {
  it("keeps only the tags and attributes the base allows too", () => {
    expect(narrowHtmlPolicy(WIDER).tags).toEqual({ p: ["dir"], a: ["href"] });
  });

  it("drops content wherever either policy drops it", () => {
    const { dropWithContent } = narrowHtmlPolicy(WIDER);
    expect(dropWithContent).toEqual([...RICH_TEXT_HTML_POLICY.dropWithContent, "details"]);
    expect(narrowHtmlPolicy({ tags: {}, dropWithContent: ["script"] }).dropWithContent).toEqual(
      RICH_TEXT_HTML_POLICY.dropWithContent,
    );
  });

  it("intersects with a base the caller passes", () => {
    const base: HtmlPolicy = { tags: { p: [], em: [] }, dropWithContent: ["style"] };
    expect(
      narrowHtmlPolicy({ tags: { p: ["dir"], strong: [] }, dropWithContent: [] }, base),
    ).toEqual({
      tags: { p: [] },
      dropWithContent: ["style"],
    });
  });

  it("never reads an inherited key as a tag", () => {
    const tags = Object.create({ img: ["src"] }) as Record<string, readonly string[]>;
    tags["toString"] = [];
    expect(narrowHtmlPolicy({ tags, dropWithContent: [] }).tags).toEqual({});
  });

  it("returns a frozen policy and leaves its inputs as they were", () => {
    const before = structuredClone(WIDER);
    const narrowed = narrowHtmlPolicy(WIDER);
    expect(Object.isFrozen(narrowed)).toBe(true);
    expect(Object.isFrozen(narrowed.tags)).toBe(true);
    expect(Object.isFrozen(narrowed.tags["a"])).toBe(true);
    expect(Object.isFrozen(narrowed.dropWithContent)).toBe(true);
    expect(WIDER).toEqual(before);
  });

  it("stops a wider host policy from keeping an image, a tracking source or a link target", () => {
    const html =
      '<p class="x">Hi <img src="https://tracker.example/pixel.gif" alt="">' +
      '<a href="https://club.example" target="_blank" ping="https://tracker.example">kit</a></p>' +
      "<table>t</table><details>hidden</details>";
    expect(sanitizeHtml(html, WIDER)).toContain("tracker.example");
    expect(sanitizeHtml(html, narrowHtmlPolicy(WIDER))).toBe(
      '<p>Hi <a href="https://club.example">kit</a></p>t',
    );
  });
});
