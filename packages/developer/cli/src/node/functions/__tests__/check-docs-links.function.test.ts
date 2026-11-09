/**
 * Stackra file contract:
 * Purpose: unit tests of `checkDocsLinks`: a site whose links resolve (pages, files, redirects, anchors, relative
 *          links, external URLs skipped) gives nothing, and a link to no page, a missing image and an anchor with no
 *          element are each named by page.
 * Boundary: test only; writes a throwaway built site in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2026 (FR-005, AC-003).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { checkDocsLinks } from "#node/functions/check-docs-links.function";

let client: string;

beforeEach(() => {
  client = mkdtempSync(join(tmpdir(), "stackra-docs-links-"));
});

afterEach(() => {
  rmSync(client, { recursive: true, force: true });
});

const write = (path: string, content = ""): void => {
  mkdirSync(dirname(join(client, path)), { recursive: true });
  writeFileSync(join(client, path), content);
};

const html = (body: string): string => `<!doctype html><html><body>${body}</body></html>`;

describe("checkDocsLinks", () => {
  it("passes a site whose links all resolve", () => {
    write(
      "index.html",
      html(
        [
          '<a href="/adr/0001-x">ADR</a>',
          '<a href="/adr/0001-x/#why">Why</a>',
          '<a href="quickstart?tab=a">Start</a>',
          '<img src="/assets/logo.svg" alt="">',
          '<a href="/licensing">Licence</a>',
          '<a href="https://example.com/x">Out</a>',
          '<a href="mailto:a@example.com">Mail</a>',
          '<a href="#top">Top</a>',
          '<h1 id="top">Home</h1>',
        ].join(""),
      ),
    );
    write("adr/0001-x/index.html", html('<h2 id="why">Why</h2><a href="../">Up</a>'));
    write("quickstart/index.html", html("<h1>Start</h1>"));
    write("assets/logo.svg", "<svg/>");
    write("_redirects", "/licensing /customers/install 301\n");
    expect(checkDocsLinks(client)).toEqual([]);
  });

  it("serves an HTML file under assets/ as a file and does not check its own links", () => {
    write("index.html", html('<a href="/assets/brand/welcome-en.html">welcome mail</a>'));
    write(
      "assets/brand/welcome-en.html",
      html('<a href="[docs URL]">docs</a><img src="../logos/x.png">'),
    );
    expect(checkDocsLinks(client)).toEqual([]);
  });

  it("names each broken link by page", () => {
    write(
      "index.html",
      html('<a href="/adr/9999-missing">Gone</a><img src="/assets/gone.png" alt="">'),
    );
    write("guides/x/index.html", html('<a href="/#nowhere">Home</a><a href="/#nowhere">Again</a>'));
    expect(checkDocsLinks(client)).toEqual([
      { page: "/guides/x", link: "/#nowhere", reason: 'no element with id "nowhere" on /' },
      { page: "/", link: "/adr/9999-missing", reason: "no page or file" },
      { page: "/", link: "/assets/gone.png", reason: "no page or file" },
    ]);
  });
});
