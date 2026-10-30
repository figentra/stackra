/**
 * Stackra file contract:
 * Purpose: unit tests of the host's one HTML page: generated as index.html and 404.html, branded (wordmark, footer),
 *          self-contained, free of any schema listing, and served for unknown paths by wrangler.jsonc's `404-page`.
 * Boundary: pure, apart from reading the member's wrangler.jsonc.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files); ADR 0022 (test placement).
 */
// @covers sta-401:FR-001 sta-401:FR-002 sta-401:P-001 sta-401:P-002
import { readFileSync } from "node:fs";

import type { SchemaSource } from "#src/interfaces";
import { planSite } from "#src/site/plan-site";
import { renderPage } from "#src/site/render-page";

const schema: SchemaSource = {
  file: "tools/schemas/runway-app.schema.json",
  text: JSON.stringify({
    $id: "https://static.stackra.figentra.com/schemas/runway/app.json",
    title: "Runway app",
  }),
};

describe("renderPage", () => {
  it("is generated as both index.html and 404.html", () => {
    const files = new Map(
      planSite([schema], [{ version: "1.0.0", schemas: [schema] }]).map((file) => [
        file.path,
        file.body,
      ]),
    );
    expect(files.get("/index.html")).toBe(renderPage());
    expect(files.get("/404.html")).toBe(renderPage());
  });

  it("lists no schema, even when the site has some", () => {
    const page = renderPage();
    expect(page).not.toContain("/schemas");
    expect(page).not.toContain("Runway app");
    expect(page).not.toContain(".json");
  });

  it("carries the Stackra wordmark, the docs link and the legal footer", () => {
    const page = renderPage();
    expect(page).toMatch(/<svg [^>]*role="img" aria-label="Stackra">/);
    expect(page).toContain('<a href="https://docs.stackra.figentra.com">');
    expect(page).toContain("<footer>© Fulers Technologies L.L.C.</footer>");
    expect(page).toContain('<html lang="en">');
    expect(page).toContain("@media (prefers-color-scheme: dark)");
  });

  it("runs no script and loads nothing", () => {
    const page = renderPage();
    expect(page).not.toMatch(/<script|<link|<img|<iframe|\ssrc=|url\(|@import/i);
    expect(page).toContain("default-src 'none'");
  });
});

describe("wrangler.jsonc", () => {
  it("serves the generated 404.html for unknown paths", () => {
    const config = readFileSync(new URL("../../../wrangler.jsonc", import.meta.url), "utf8");
    expect(config).toMatch(/"not_found_handling":\s*"404-page"/);
  });
});
