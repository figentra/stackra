/**
 * Stackra file contract:
 * Purpose: unit tests of `emitDocsSite`: a clean source gives `docs.json` (owned keys, `raw` passed through, folders
 *          expanded `index` first, assets under `/assets/`), the pages at the site root, the snippets, the asset copies,
 *          `llms.txt` in navigation order and an API reference tab from a service manifest; and each refusal
 *          (`docs_source_misplaced`, `docs_page_outside`, `docs_page_missing`, `docs_page_unlisted`,
 *          `docs_asset_missing`, `docs_asset_unreferenced`, `docs_owned_key`, `docs_service_unknown`) returns nothing
 *          to write.
 * Boundary: test only; plain inputs, no file system.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0002 (2026-10-27 amendment); STA-1316.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { emitDocsSite } from "#core/functions/emit-docs-site.function";
import type { DocsSiteInput } from "#core/types/docs-site-input.type";

const CONFIG: DocsSiteInput["config"] = {
  name: "Handbook",
  description: "The handbook.",
  theme: "mint",
  colors: { primary: "#0B0D0F" },
  logo: { light: "logo/light.svg", dark: "logo/dark.svg", href: "/" },
  favicon: "favicon.svg",
  navigation: [
    {
      tab: "Guides",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Mintlify (Lucide) icon name in docs.json, not a Stackra icon key
      icon: "book-open",
      groups: [
        { group: "Start", pages: ["index", "quickstart"] },
        { group: "Decisions", pages: [{ folder: "adr" }] },
      ],
    },
  ],
  apiReference: [],
  raw: { fonts: { family: "Geist" } },
};

const page = (title: string, body = ""): string =>
  `---\ntitle: "${title}"\ndescription: "About ${title}."\n---\n\n${body}\n`;

const FILES: DocsSiteInput["files"] = [
  { path: "config/docs.config.ts" },
  { path: "docs/index.mdx", content: page("Introduction", "![hero](/assets/hero.png)") },
  { path: "docs/quickstart.mdx", content: page("Quickstart", '<Snippet file="steps.mdx" />') },
  { path: "docs/adr/0002-docs.mdx", content: page("0002") },
  { path: "docs/adr/0001-layout.mdx", content: page("0001") },
  { path: "docs/adr/index.mdx", content: page("Decisions") },
  { path: "assets/hero.png" },
  { path: "assets/logo/light.svg" },
  { path: "assets/logo/dark.svg" },
  { path: "assets/favicon.svg" },
  { path: "assets/brand/NOTICE" },
  { path: "snippets/steps.mdx", content: "1. Install\n" },
];

const run = (patch: Partial<DocsSiteInput> = {}) =>
  emitDocsSite({ config: CONFIG, files: FILES, services: [], ...patch });

const codes = (patch: Partial<DocsSiteInput>) => run(patch).errors.map((error) => error.code);

describe("emitDocsSite", () => {
  it("assembles a clean source", () => {
    const site = run();
    expect(site.errors).toEqual([]);
    expect(site.files.map((file) => file.path)).toEqual([
      "adr/0001-layout.mdx",
      "adr/0002-docs.mdx",
      "adr/index.mdx",
      "docs.json",
      "index.mdx",
      "llms.txt",
      "quickstart.mdx",
      "snippets/steps.mdx",
    ]);
    expect(site.copies.map((copy) => copy.to)).toEqual([
      "assets/brand/NOTICE",
      "assets/favicon.svg",
      "assets/hero.png",
      "assets/logo/dark.svg",
      "assets/logo/light.svg",
    ]);
    const docs = JSON.parse(site.files.find((file) => file.path === "docs.json")?.content ?? "{}");
    expect(Object.keys(docs)).toEqual([
      "$schema",
      "theme",
      "name",
      "description",
      "colors",
      "logo",
      "favicon",
      "fonts",
      "navigation",
    ]);
    expect(docs.logo).toEqual({
      light: "/assets/logo/light.svg",
      dark: "/assets/logo/dark.svg",
      href: "/",
    });
    expect(docs.favicon).toBe("/assets/favicon.svg");
    expect(docs.navigation.tabs[0].groups[1].pages).toEqual([
      "adr/index",
      "adr/0001-layout",
      "adr/0002-docs",
    ]);
  });

  it("writes llms.txt in navigation order with clean URLs", () => {
    const llms = run().files.find((file) => file.path === "llms.txt")?.content;
    expect(llms).toBe(
      [
        "# Handbook",
        "",
        "> The handbook.",
        "",
        "- [Introduction](/): About Introduction.",
        "- [Quickstart](/quickstart): About Quickstart.",
        "- [Decisions](/adr): About Decisions.",
        "- [0001](/adr/0001-layout): About 0001.",
        "- [0002](/adr/0002-docs): About 0002.",
        "",
      ].join("\n"),
    );
  });

  it("adds the API reference of a consumed service", () => {
    const manifest = {
      member: "orders",
      package: "@acme/service-orders",
      actions: [],
      schemas: {},
    };
    const site = run({
      config: { ...CONFIG, apiReference: ["orders"] },
      services: [{ member: "orders", manifest: manifest as unknown as StackraManifest }],
    });
    expect(site.errors).toEqual([]);
    expect(site.files.map((file) => file.path)).toContain("api-reference/orders/openapi.json");
    const docs = JSON.parse(site.files.find((file) => file.path === "docs.json")?.content ?? "{}");
    expect(docs.navigation.tabs.at(-1)).toEqual({
      tab: "API reference",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Mintlify (Lucide) icon name in docs.json, not a Stackra icon key
      icon: "code",
      groups: [{ group: "orders", openapi: "api-reference/orders/openapi.json" }],
    });
  });

  it("refuses a docs.json, a README.md and a stray file under src/", () => {
    expect(
      codes({
        files: [
          ...FILES,
          { path: "docs.json" },
          { path: "docs/README.md", content: "" },
          { path: "llms.txt" },
          { path: "docs/diagram.png" },
        ],
      }),
    ).toEqual([
      "docs_source_misplaced",
      "docs_source_misplaced",
      "docs_source_misplaced",
      "docs_source_misplaced",
    ]);
  });

  it("refuses a page outside src/docs", () => {
    expect(codes({ files: [...FILES, { path: "guide.mdx", content: "" }] })).toEqual([
      "docs_page_outside",
    ]);
  });

  it("refuses a missing and an unlisted page", () => {
    const missing = run({
      config: {
        ...CONFIG,
        navigation: [
          {
            tab: "Guides",
            groups: [{ group: "Start", pages: ["index", "nowhere", { folder: "adr" }] }],
          },
        ],
      },
      files: [...FILES, { path: "docs/orphan.mdx", content: page("Orphan") }],
    });
    expect(missing.errors.map((error) => [error.code, error.subject])).toEqual([
      ["docs_page_missing", "nowhere"],
      ["docs_page_unlisted", "orphan"],
      ["docs_page_unlisted", "quickstart"],
    ]);
    expect(missing.files).toEqual([]);
  });

  it("refuses a missing favicon and the unreferenced assets (the old favicon too), but not a NOTICE", () => {
    expect(
      codes({
        config: { ...CONFIG, favicon: "gone.svg" },
        files: [...FILES, { path: "assets/unused.png" }],
      }),
    ).toEqual(["docs_asset_missing", "docs_asset_unreferenced", "docs_asset_unreferenced"]);
  });

  it("refuses an owned key in raw and an unknown API reference service", () => {
    expect(
      codes({ config: { ...CONFIG, raw: { navigation: {} }, apiReference: ["billing"] } }),
    ).toEqual(["docs_owned_key", "docs_service_unknown"]);
  });
});
