/**
 * Stackra file contract:
 * Purpose: unit tests of `bundleFileUrl`: a bundle path maps into the renderer folder, the bare origin maps to
 *          `index.html`, a folder URL without its trailing slash still works, and another host, a `..` escape
 *          (encoded or not) and a malformed escape map to nothing.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0251 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { bundleFileUrl } from "#desktop/functions/bundle-file-url.function";

const renderer = new URL("file:///Applications/Acme.app/renderer/");

describe("bundleFileUrl", () => {
  it("maps a bundle path into the renderer folder", () => {
    expect(bundleFileUrl("app://bundle/assets/app.js", renderer)?.href).toBe(
      "file:///Applications/Acme.app/renderer/assets/app.js",
    );
  });

  it("maps the bare origin to index.html", () => {
    expect(bundleFileUrl("app://bundle/", renderer)?.href).toBe(
      "file:///Applications/Acme.app/renderer/index.html",
    );
  });

  it("accepts a renderer folder URL without its trailing slash", () => {
    expect(bundleFileUrl("app://bundle/a.css", new URL("file:///srv/renderer"))?.href).toBe(
      "file:///srv/renderer/a.css",
    );
  });

  it("maps another host to nothing", () => {
    expect(bundleFileUrl("app://evil/index.html", renderer)).toBeUndefined();
  });

  it("never leaves the renderer folder", () => {
    // dot segments in the request URL itself resolve inside app://bundle before the mapping
    for (const request of [
      "app://bundle/%2e%2e/secrets.json",
      "app://bundle/assets/%2E%2E/%2E%2E/main.js",
      "app://bundle/../../main.js",
    ])
      expect(bundleFileUrl(request, renderer)?.href.startsWith(renderer.href)).toBe(true);
    // an encoded slash survives the URL parser, so the decoded path is what must be checked
    expect(bundleFileUrl("app://bundle/..%2f..%2fmain.js", renderer)).toBeUndefined();
    expect(bundleFileUrl("app://bundle/..%5C..%5Cmain.js", renderer)).toBeUndefined();
  });

  it("maps a malformed escape to nothing", () => {
    expect(bundleFileUrl("app://bundle/%E0%A4%A", renderer)).toBeUndefined();
  });
});
