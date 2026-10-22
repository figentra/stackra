/**
 * Stackra file contract:
 * Purpose: unit tests of the generated `_headers` file: CORS on every path, Cache-Control only on exact versions,
 *          and the Cloudflare rule cap.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 4); ADR 0022 (test placement).
 */
// @covers sta-322:FR-002 sta-322:P-002
import { renderHeaders } from "#src/site/render-headers";

describe("renderHeaders", () => {
  it("sends CORS for every path and no Cache-Control on moving paths", () => {
    const text = renderHeaders([]);
    expect(text).toContain("/*\n  Access-Control-Allow-Origin: *\n");
    expect(text).not.toContain("Cache-Control");
  });

  it("gives each release tree its own immutable rule", () => {
    const text = renderHeaders(["1.4.0", "1.3.2"]);
    expect(text.match(/Cache-Control: public, max-age=31536000, immutable/g)).toHaveLength(2);
    expect(text).toContain("/schemas/1.4.0/*\n");
    expect(text).toContain("/schemas/1.3.2/*\n");
  });

  it("refuses more rules than Cloudflare allows", () => {
    const versions = Array.from({ length: 100 }, (_, i) => `0.0.${i}`);
    expect(() => renderHeaders(versions)).toThrow(/Cloudflare allows 100/);
    expect(() => renderHeaders(versions.slice(1))).not.toThrow();
  });
});
