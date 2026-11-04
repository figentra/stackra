/**
 * Stackra file contract:
 * Purpose: unit tests of `renderShellPage`: the import map, the startup record under `#stackra-startup`, one
 *          `modulepreload` per distinct URL (shell entry first), the shell's stylesheets before the bundle's, the root
 *          element and the shell entry as a module script, never indexed; JSON cannot close its element and the
 *          title, language and URLs are escaped.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decisions 2.5 and 3); STA-1676.
 */
import { describe, expect, it } from "@stackra/testing";

import { renderShellPage } from "#node/functions/render-shell-page.function";
import type { EdgeRelease } from "#node/types/edge-release.type";
import type { EdgeShellRelease } from "#node/types/edge-shell-release.type";
import type { StartupRecord } from "#node/types/startup-record.type";

const SHELL: EdgeShellRelease = {
  version: "3.1.0",
  entry: "/assets/shells/console/3.1.0/main.js",
  css: ["/assets/shells/console/3.1.0/shell.css"],
  importMap: { imports: { react: "/assets/shells/console/3.1.0/react.js" } },
};

const BASE = "/assets/mezzora/console/1.2.0/";

const RELEASE: EdgeRelease = {
  version: "1.2.0",
  url: `${BASE}entry.js`,
  base: BASE,
  targets: "console@3",
  modulepreload: [`${BASE}entry.js`, SHELL.entry],
  css: [`${BASE}bundle.css`],
};

const RECORD: StartupRecord = {
  product: "mezzora",
  surface: "console",
  locales: { default: "en", enabled: ["en", "ar"] },
  shell: { major: 3, version: "3.1.0" },
  bundles: [`${BASE}entry.js`],
};

describe("renderShellPage", () => {
  it("writes the page in the edge Worker's order", () => {
    const html = renderShellPage({
      shell: SHELL,
      release: RELEASE,
      record: RECORD,
      title: "Mezzora",
    });

    expect(html).toMatch(/^<!doctype html><html lang="en"><head>/);
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain(`<script type="importmap">${JSON.stringify(SHELL.importMap)}</script>`);
    expect(html).toContain(
      `<script type="application/json" id="stackra-startup">${JSON.stringify(RECORD)}</script>`,
    );
    const preloads = [...html.matchAll(/rel="modulepreload" crossorigin href="([^"]+)"/g)];
    expect(preloads.map((match) => match[1])).toEqual([SHELL.entry, `${BASE}entry.js`]);
    const styles = [...html.matchAll(/rel="stylesheet" crossorigin href="([^"]+)"/g)];
    expect(styles.map((match) => match[1])).toEqual([
      "/assets/shells/console/3.1.0/shell.css",
      `${BASE}bundle.css`,
    ]);
    expect(
      html.endsWith(
        `<div id="root"></div><script type="module" crossorigin src="${SHELL.entry}"></script>` +
          "</body></html>",
      ),
    ).toBe(true);
  });

  it("escapes the title, the language and the inline JSON", () => {
    const { css: _css, ...shellWithoutCss } = SHELL;
    const html = renderShellPage({
      shell: shellWithoutCss,
      release: RELEASE,
      record: { ...RECORD, product: "</script><b>", locales: { default: 'en"x', enabled: [] } },
      title: "A & B <i>",
    });

    expect(html).toContain("<title>A &amp; B &lt;i&gt;</title>");
    expect(html).toContain('<html lang="en&quot;x">');
    expect(html).not.toContain("</script><b>");
    expect(html).toContain("\\u003c/script>\\u003cb>");
    expect(html).not.toContain("shell.css");
  });
});
