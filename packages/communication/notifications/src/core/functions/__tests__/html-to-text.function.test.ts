/**
 * Stackra file contract:
 * Purpose: unit tests of `htmlToText`: block breaks, links with their address, entities decoded after tags are
 *          stripped, Outlook conditional comments and the head dropped, and whitespace collapsed.
 * Boundary: test only; the inputs are shaped like React Email's rendered markup.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0223 (mail bodies rendered to HTML and text).
 */
import { describe, expect, it } from "@stackra/testing";

import { htmlToText } from "#core/functions/html-to-text.function";

describe("htmlToText", () => {
  it("breaks lines at blocks and keeps a link's address", () => {
    const html =
      '<!DOCTYPE html><html lang="en"><head><title>x</title><style>p{}</style></head><body>' +
      '<p style="margin:0">Total &amp; tax</p><a href="https://acme.example/o/1" style="x"><span>View order</span></a>' +
      "</body></html>";
    expect(htmlToText(html)).toBe("Total & tax\n\nView order (https://acme.example/o/1)");
  });

  it("decodes entities only after tags are stripped", () => {
    expect(htmlToText("<p>&lt;b&gt; &#x27;quoted&#39; &#1576;</p>")).toBe("<b> 'quoted' ب");
  });

  it("drops comments and collapses whitespace", () => {
    const html =
      "<p>  one <!--[if mso]><i>&#8202;</i><![endif]-->  two&nbsp; </p><br/><div>three</div>";
    expect(htmlToText(html)).toBe("one two\n\nthree");
  });

  it("prints a bare link as its address", () => {
    expect(htmlToText('<a href="https://acme.example">https://acme.example</a>')).toBe(
      "https://acme.example",
    );
  });

  it("keeps Arabic text and separates table cells", () => {
    expect(htmlToText("<table><tr><td>3 بنود</td><td>SAR 12.00</td></tr></table>")).toBe(
      "3 بنود SAR 12.00",
    );
  });
});
