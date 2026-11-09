/**
 * Stackra file contract:
 * Purpose: `emitE2ePageFiles`, the files of a package's end-to-end tier gen writes into `.stackra/`: a tiny Vite app
 *          (`e2e/index.html`, `e2e/main.tsx`, `e2e/vite.config.ts`) that renders the `<name>.e2e.page.tsx` whose name
 *          is the URL path, and `playwright.e2e.config.ts`, which serves that app and runs the `.e2e.test.ts` specs.
 *          Nobody authors them.
 * Boundary: pure. The caller decides whether the package has an e2e page (it reads the disk). The member root is
 *           resolved from each file's own location, so no absolute path is written. `@stackra/testing/e2e` supplies
 *           `packageE2eVite` and `packageE2ePreset`.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 5: gen writes every tool file into `.stackra/`); ADR 0022 (the 2026-11-09
 *                     amendment: package e2e); ADR 0182 (decision 1: test tiers).
 */
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";

/** The page loaders, the document language and the render, as the browser runs them. */
const MAIN = [
  'import { createElement, type ComponentType } from "react";',
  'import { createRoot } from "react-dom/client";',
  "",
  "type Page = () => Promise<{ default: ComponentType }>;",
  "",
  "const pages: Record<string, Page> =",
  "  // @ts-ignore -- reason: `import.meta.glob` is Vite's; the member's tsconfig has no Vite types",
  '  import.meta.glob("../../src/**/__tests__/*.e2e.page.tsx");',
  "",
  "const RIGHT_TO_LEFT = /^(ar|he|fa|ur)/i;",
  "const language = navigator.language;",
  "document.documentElement.lang = language;",
  'document.documentElement.dir = RIGHT_TO_LEFT.test(language) ? "rtl" : "ltr";',
  "",
  "const name = location.pathname.slice(1);",
  'const key = Object.keys(pages).find((path) => path.split("/").at(-1) === `${name}.e2e.page.tsx`);',
  'const container = document.getElementById("root");',
  "",
  "if (container !== null) {",
  "  const root = createRoot(container);",
  "  const load = key === undefined ? undefined : pages[key];",
  "  if (load === undefined) {",
  "    console.error(`no e2e page ${name}`);",
  "    root.render(`no e2e page ${name}`);",
  "  } else {",
  "    const module = await load();",
  "    root.render(createElement(module.default));",
  "  }",
  "}",
  "",
].join("\n");

/**
 * The end-to-end tier files of a package.
 *
 * @param packageName - the member's package name, for the headers.
 * @example
 * emitE2ePageFiles("@stackra/ui").map((file) => file.path); // [".stackra/e2e/index.html", ...]
 */
export function emitE2ePageFiles(packageName: string): readonly GeneratedFile[] {
  return [
    {
      path: ".stackra/e2e/index.html",
      content: [
        `<!-- ${GENERATED_NOTICE}; from the \`.e2e.page.tsx\` files under src/ -->`,
        "<!doctype html>",
        "<html>",
        "  <head>",
        '    <meta charset="utf-8" />',
        `    <title>${packageName} e2e</title>`,
        "  </head>",
        "  <body>",
        '    <div id="root"></div>',
        '    <script type="module" src="./main.tsx"></script>',
        "  </body>",
        "</html>",
        "",
      ].join("\n"),
    },
    {
      path: ".stackra/e2e/main.tsx",
      content: [
        generatedHeader({
          from: "the `.e2e.page.tsx` files under src/",
          purpose: `the browser entry of the e2e pages of ${packageName}: renders the page named by the URL path.`,
          boundary:
            "`/<name>` renders `<name>.e2e.page.tsx`; an unknown path logs a console error so the spec fails.",
          runtime: "isomorphic",
        }),
        MAIN,
      ].join("\n"),
    },
    {
      path: ".stackra/e2e/vite.config.ts",
      content: [
        generatedHeader({
          from: "the `.e2e.page.tsx` files under src/",
          purpose: `the Vite config that serves the e2e pages of ${packageName}.`,
          boundary: "served by the Playwright config's web server; the root is the member.",
          runtime: "node",
        }),
        'import { fileURLToPath } from "node:url";',
        "",
        'import { packageE2eVite } from "@stackra/testing/e2e";',
        "",
        'export default packageE2eVite({ root: fileURLToPath(new URL("../..", import.meta.url)) });',
        "",
      ].join("\n"),
    },
    {
      path: ".stackra/playwright.e2e.config.ts",
      content: [
        generatedHeader({
          from: "the `.e2e.page.tsx` and `.e2e.test.ts` files under src/",
          purpose: `the Playwright config of the e2e tests of ${packageName}.`,
          boundary:
            "run by `stackra test --tier e2e`; serves .stackra/e2e and runs the `.e2e.test.ts` specs.",
          runtime: "node",
        }),
        'import { fileURLToPath } from "node:url";',
        "",
        'import { packageE2ePreset } from "@stackra/testing/e2e";',
        "",
        "export default packageE2ePreset({",
        '  root: fileURLToPath(new URL("..", import.meta.url)),',
        `  package: ${JSON.stringify(packageName)},`,
        "});",
        "",
      ].join("\n"),
    },
  ];
}
