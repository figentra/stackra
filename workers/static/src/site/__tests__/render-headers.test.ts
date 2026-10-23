/**
 * Stackra file contract:
 * Purpose: unit tests of the generated `_headers` file: CORS on every path, Cache-Control only on the landing page
 *          and exact versions, and the Cloudflare rule cap.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decision 4); ADR 0022 (test placement).
 */
// @covers sta-322:FR-002 sta-322:P-002 sta-401:FR-002 sta-401:P-002
import { renderHeaders } from "#src/site/render-headers";

describe("renderHeaders", () => {
  it("sends CORS for every path and Cache-Control only on the landing page when there are no releases", () => {
    const text = renderHeaders([]);
    expect(text).toContain("/*\n  Access-Control-Allow-Origin: *\n");
    expect(text).toContain("\n/\n  Cache-Control: public, max-age=300\n");
    expect(text.match(/Cache-Control/g)).toHaveLength(1);
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
    expect(() => renderHeaders(versions.slice(2))).not.toThrow();
  });
});
