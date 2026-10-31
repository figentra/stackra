/**
 * Stackra file contract:
 * Purpose: proves `sourceLinkOf` follows only web links, names a source by its domain, and draws its first letter.
 * Boundary: pure function test.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { sourceLinkOf } from "#core/functions/source-link-of.function";

describe("sourceLinkOf", () => {
  it("names a web source by its domain", () => {
    expect(sourceLinkOf({ key: "a", href: "https://www.example.com/a" })).toEqual({
      href: "https://www.example.com/a",
      title: "example.com",
      letter: "E",
    });
  });

  it("drops a link that is not a web address", () => {
    // oxlint-disable-next-line no-script-url -- reason: the case under test
    const link = sourceLinkOf({ key: "x", title: "report", href: "javascript:alert(1)" });
    expect(link).toEqual({ href: undefined, title: "report", letter: "R" });
  });

  it("falls back to the key for a document with no title", () => {
    expect(sourceLinkOf({ key: "q3.pdf" }).title).toBe("q3.pdf");
  });
});
