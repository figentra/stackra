/**
 * Stackra file contract:
 * Purpose: unit tests of `emitDocsSite`: a clean source gives `docs.json` (owned keys, `raw` passed through, folders
 *          expanded `index` first, assets under `/assets/`), the pages at the site root, the snippets, the asset copies,
 *          `llms.txt` in navigation order and an API reference tab from a service manifest; and each refusal
 *          (`docs_source_misplaced`, `docs_page_outside`, `docs_page_missing`, `docs_page_unlisted`,
 *          `docs_asset_missing`, `docs_asset_unreferenced`, `docs_owned_key`, `docs_service_unknown`) returns nothing
 *          to write; with `locales`, translations served under their locale with a page tree, font and interface
 *          strings per locale, an untranslated page only warned, and an orphan translation, a page in a locale's
 *          folder and malformed locales refused, while an empty `locales` leaves the site byte-identical; and with a
 *          docs member's `source`, the refusals and generated-file headers name `content/`, `docs.yaml` and
 *          `content/**\/meta.json`.
 * Boundary: test only; plain inputs, no file system.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0002 (2026-10-27 amendment); STA-1316.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DOCS_MEMBER_SOURCE } from "#core/constants/docs-member-source.constant";
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
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
  redirects: [],
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

describe("emitDocsSite with the fumadocs renderer", () => {
  const FUMADOCS_FILES: DocsSiteInput["files"] = [
    { path: "config/docs.config.ts" },
    {
      path: "docs/index.mdx",
      content: page("Introduction", "![hero](/assets/hero.png)\n\n<Note>Read this first.</Note>"),
    },
    {
      path: "docs/quickstart.mdx",
      content: page(
        "Quickstart",
        [
          'import Steps from "/snippets/steps.mdx";',
          "",
          "<Steps />",
          "",
          "```mdx",
          'import Steps from "/snippets/steps.mdx";',
          "<Widget />",
          "```",
          "",
          "Write `Array<Order>` as code.",
        ].join("\n"),
      ),
    },
    { path: "docs/adr/0002-docs.mdx", content: page("0002") },
    { path: "docs/adr/0001-layout.mdx", content: page("0001") },
    { path: "docs/adr/index.mdx", content: page("Decisions") },
    { path: "assets/hero.png" },
    { path: "assets/logo/light.svg" },
    { path: "assets/logo/dark.svg" },
    { path: "assets/favicon.svg" },
    { path: "snippets/steps.mdx", content: "<Tip>Install first.</Tip>\n" },
  ];

  const fumadocs = (patch: Partial<DocsSiteInput> = {}) =>
    emitDocsSite({ config: CONFIG, files: FUMADOCS_FILES, services: [], ...patch }, "fumadocs");

  const fumadocsCodes = (patch: Partial<DocsSiteInput>) =>
    fumadocs(patch).errors.map((error) => error.code);

  const text = (site: ReturnType<typeof fumadocs>, path: string): string =>
    site.files.find((file) => file.path === path)?.content ?? "";

  it("assembles the Fumadocs site, and no docs.json", () => {
    const site = fumadocs();
    expect(site.errors).toEqual([]);
    expect(site.files.map((file) => file.path)).toEqual([
      "app/app.css",
      "app/components/footer.tsx",
      "app/components/search.tsx",
      "app/entry.server.tsx",
      "app/lib/layout.tsx",
      "app/lib/source.ts",
      "app/mdx-components.tsx",
      "app/root.tsx",
      "app/routes.ts",
      "app/routes/not-found.tsx",
      "app/routes/page.tsx",
      "app/routes/search.ts",
      "app/site.json",
      "app/theme.css",
      "content/adr/0001-layout.mdx",
      "content/adr/0002-docs.mdx",
      "content/adr/index.mdx",
      "content/index.mdx",
      "content/quickstart.mdx",
      "public/_redirects",
      "public/llms-full.txt",
      "public/llms.txt",
      "react-router.config.ts",
      "snippets/steps.mdx",
      "tsconfig.json",
      "vite.config.ts",
    ]);
    expect(site.copies.map((copy) => copy.to)).toEqual([
      "public/assets/favicon.svg",
      "public/assets/hero.png",
      "public/assets/logo/dark.svg",
      "public/assets/logo/light.svg",
    ]);
    expect(fumadocs()).toEqual(site);
  });

  /** The splat does not match "/"; without the index route the home page prerendered as an empty shell. */
  it("routes the site root to the page module and fails a build that prerenders a bare shell", () => {
    const site = fumadocs();
    const routes = text(site, "app/routes.ts");
    const config = text(site, "react-router.config.ts");
    expect(routes).toContain('index("routes/page.tsx", { id: "routes/home" })');
    expect(routes.indexOf("index(")).toBeLessThan(routes.indexOf('route("*"'));
    expect(config).toContain("<title>([^<]*)<[/]title>");
    expect(config).toContain("throw new Error(");
  });

  /** "Figentra Geo · Figentra Geo": the home page's own words are the site's name, so it is titled by them alone. */
  it("titles the home page by its own words and fails a build whose title repeats a part", () => {
    const site = fumadocs();
    const route = text(site, "app/routes/page.tsx");
    const config = text(site, "react-router.config.ts");
    expect(route).toContain("const HOME_PAGE = /^index(\\.[A-Za-z-]+)?\\.mdx?$/;");
    expect(route).toContain('HOME_PAGE.test(path) ? page.title : page.title + " · " + site.name');
    expect(config).toContain('title.split(" · ")');
    expect(config).toContain("titles repeat a part: ");
  });

  it("writes the navigation as a page tree, and every page path to prerender", () => {
    const site = JSON.parse(text(fumadocs(), "app/site.json"));
    expect(Object.keys(site)).toEqual([
      "name",
      "description",
      "logo",
      "favicon",
      "links",
      "footer",
      "layout",
      "paths",
      "tree",
    ]);
    expect(site.paths).toEqual(["/", "/adr", "/adr/0001-layout", "/adr/0002-docs", "/quickstart"]);
    expect(site.logo).toEqual({
      light: "/assets/logo/light.svg",
      dark: "/assets/logo/dark.svg",
      href: "/",
    });
    expect(site.tree).toEqual({
      name: "Handbook",
      children: [
        {
          $id: "tab.0",
          type: "folder",
          name: "Guides",
          root: true,
          children: [
            { $id: "tab.0.0", type: "separator", name: "Start" },
            { type: "page", name: "Introduction", url: "/" },
            { type: "page", name: "Quickstart", url: "/quickstart" },
            { $id: "tab.0.1", type: "separator", name: "Decisions" },
            { type: "page", name: "Decisions", url: "/adr" },
            { type: "page", name: "0001", url: "/adr/0001-layout" },
            { type: "page", name: "0002", url: "/adr/0002-docs" },
          ],
        },
      ],
    });
  });

  it("keeps llms.txt as the Mintlify site had it, and adds llms-full.txt and the redirects", () => {
    const site = fumadocs({
      config: { ...CONFIG, redirects: [{ from: "/licensing", to: "/quickstart" }] },
    });
    expect(text(site, "public/llms.txt")).toBe(
      run().files.find((file) => file.path === "llms.txt")?.content,
    );
    const full = text(site, "public/llms-full.txt");
    expect(full.startsWith("# Handbook\n\n# Introduction\n\nSource: /\n\n![hero]")).toBe(true);
    expect(full).toContain("# 0002\n\nSource: /adr/0002-docs\n");
    expect(text(site, "public/_redirects")).toBe("/licensing /quickstart 301\n");
  });

  it("turns a snippet import into an include, outside code only", () => {
    const quickstart = text(fumadocs(), "content/quickstart.mdx");
    expect(quickstart).toContain("<include>../snippets/steps.mdx</include>");
    expect(quickstart.slice(0, quickstart.indexOf("```"))).not.toContain("import Steps");
    expect(quickstart).toContain(
      '```mdx\nimport Steps from "/snippets/steps.mdx";\n<Widget />\n```',
    );
  });

  it("writes the colours and the Mintlify component map", () => {
    const site = fumadocs();
    expect(text(site, "app/theme.css")).toContain("--color-fd-primary: #0B0D0F;");
    const map = text(site, "app/mdx-components.tsx");
    for (const name of [
      "Note",
      "Info",
      "Tip",
      "Warning",
      "Card",
      "CardGroup",
      "Steps",
      "Step",
      "Tabs",
      "Tab",
      "Accordion",
      "AccordionGroup",
      "Frame",
      "CodeGroup",
    ])
      expect(map).toMatch(new RegExp(`^  ${name}[:,]`, "m"));
    expect(text(site, "vite.config.ts").startsWith("// generated by stackra gen")).toBe(true);
  });

  it("adds a page for the API reference of a consumed service", () => {
    const manifest = {
      member: "orders",
      package: "@acme/service-orders",
      actions: [],
      schemas: {},
    };
    const site = fumadocs({
      config: { ...CONFIG, apiReference: ["orders"] },
      services: [{ member: "orders", manifest: manifest as unknown as StackraManifest }],
    });
    expect(site.errors).toEqual([]);
    expect(site.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        "content/api-reference/orders.mdx",
        "public/api-reference/orders/openapi.json",
      ]),
    );
    expect(JSON.parse(text(site, "app/site.json")).paths).toContain("/api-reference/orders");
  });

  it("refuses an unknown component, but not an imported one or one in code", () => {
    const refused = fumadocs({
      files: [
        ...FUMADOCS_FILES,
        { path: "docs/extra.mdx", content: page("Extra", "<Widget />\n\n<Panel.Body />") },
      ],
      config: {
        ...CONFIG,
        navigation: [
          {
            tab: "Guides",
            groups: [
              { group: "Start", pages: ["index", "quickstart", "extra", { folder: "adr" }] },
            ],
          },
        ],
      },
    });
    expect(refused.errors.map((error) => [error.code, error.subject])).toEqual([
      ["docs_component_unknown", "Widget"],
      ["docs_component_unknown", "Panel"],
    ]);
    expect(refused.files).toEqual([]);
    const imported = fumadocs({
      files: [
        ...FUMADOCS_FILES,
        {
          path: "docs/extra.mdx",
          content: page("Extra", 'import { Chart, type Row } from "@acme/charts";\n\n<Chart />'),
        },
      ],
      config: {
        ...CONFIG,
        navigation: [
          {
            tab: "Guides",
            groups: [
              { group: "Start", pages: ["index", "quickstart", "extra", { folder: "adr" }] },
            ],
          },
        ],
      },
    });
    expect(imported.errors).toEqual([]);
  });

  it("refuses a redirect from a page and one to nowhere, and an owned layout key", () => {
    expect(
      fumadocsCodes({
        config: {
          ...CONFIG,
          raw: { nav: {} },
          redirects: [
            { from: "/quickstart", to: "/" },
            { from: "/old", to: "/gone" },
            { from: "/site", to: "https://example.com" },
          ],
        },
      }),
    ).toEqual(["docs_owned_key", "docs_redirect_shadows_page", "docs_redirect_target_missing"]);
  });

  it("names a docs member's own source in its refusals and generated-file headers (ADR 0514, 2026-11-09)", () => {
    const refused = fumadocs({
      source: DOCS_MEMBER_SOURCE,
      config: { ...CONFIG, favicon: "gone.svg" },
      files: [
        ...FUMADOCS_FILES,
        { path: "docs/orphan.mdx", content: page("Orphan") },
        { path: "docs/diagram.png" },
      ],
    });
    expect(refused.errors.map((error) => [error.code, error.file, error.fix])).toEqual([
      [
        "docs_source_misplaced",
        "content/diagram.png",
        "move it to content/assets/ and reference it as /assets/diagram.png",
      ],
      [
        "docs_page_unlisted",
        "content/orphan.mdx",
        'list "orphan" (or its folder) in a group of content/**/meta.json, or delete the page',
      ],
      [
        "docs_asset_missing",
        "docs.yaml",
        "add content/assets/gone.svg, or name an asset that exists",
      ],
      [
        "docs_asset_unreferenced",
        "content/assets/favicon.svg",
        "reference it as /assets/favicon.svg, or delete it",
      ],
    ]);

    const site = fumadocs({ source: DOCS_MEMBER_SOURCE });
    expect(site.errors).toEqual([]);
    expect(text(site, "app/theme.css").split("\n")[0]).toBe(
      `/* ${GENERATED_NOTICE}; from docs.yaml */`,
    );
    expect(text(site, "app/root.tsx").split("\n")[0]).toBe(
      `// ${GENERATED_NOTICE}; from docs.yaml`,
    );
    expect(text(fumadocs(), "app/root.tsx").split("\n")[0]).toBe(
      `// ${GENERATED_NOTICE}; from src/config/docs.config.ts`,
    );
    expect(site.copies).toEqual(fumadocs().copies);
  });
});

/** A Fumadocs site in English and Arabic: the home page and the quickstart translated, the decisions not. */
describe("emitDocsSite with locales", () => {
  const LOCALES: NonNullable<DocsSiteInput["config"]["locales"]> = [
    { code: "en", label: "English", default: true },
    { code: "ar", label: "العربية", dir: "rtl", labels: { Guides: "الأدلة", Start: "البداية" } },
  ];
  const FILES_EN_AR: DocsSiteInput["files"] = [
    { path: "config/docs.config.ts" },
    { path: "docs/index.mdx", content: page("Introduction", "![hero](/assets/hero.png)") },
    { path: "docs/index.ar.mdx", content: page("مقدمة", "اقرأ <bdi>RAGI2929</bdi> أولًا.") },
    { path: "docs/quickstart.mdx", content: page("Quickstart") },
    { path: "docs/quickstart.ar.mdx", content: page("البدء السريع") },
    { path: "docs/adr/0001-layout.mdx", content: page("0001") },
    { path: "docs/adr/index.mdx", content: page("Decisions") },
    { path: "assets/hero.png" },
    { path: "assets/logo/light.svg" },
    { path: "assets/logo/dark.svg" },
    { path: "assets/favicon.svg" },
  ];
  const site = (patch: Partial<DocsSiteInput["config"]> = {}, files = FILES_EN_AR) =>
    emitDocsSite(
      { config: { ...CONFIG, raw: {}, locales: LOCALES, ...patch }, files, services: [] },
      "fumadocs",
    );
  const text = (result: ReturnType<typeof site>, path: string): string =>
    result.files.find((file) => file.path === path)?.content ?? "";

  /** An empty `locales` is the single-language site, byte for byte. */
  it("keeps a single-language site byte-identical when locales is empty", () => {
    const files = FILES_EN_AR.filter((file) => !file.path.includes(".ar."));
    expect(site({ locales: [] }, files)).toEqual(
      emitDocsSite({ config: { ...CONFIG, raw: {} }, files, services: [] }, "fumadocs"),
    );
  });

  /** Translations become pages under their locale; the shell switches to the multi-language files. */
  it("serves each translation under its locale, with the multi-language shell", () => {
    const result = site();
    expect(result.errors).toEqual([]);
    expect(result.files.map((file) => file.path)).toEqual([
      "app/app.css",
      "app/components/footer.tsx",
      "app/components/search.tsx",
      "app/entry.server.tsx",
      "app/lib/layout.tsx",
      "app/lib/locale.ts",
      "app/lib/source.ts",
      "app/mdx-components.tsx",
      "app/root.tsx",
      "app/routes.ts",
      "app/routes/not-found.tsx",
      "app/routes/page.tsx",
      "app/routes/search.ts",
      "app/site.json",
      "app/theme.css",
      "content/adr/0001-layout.mdx",
      "content/adr/index.mdx",
      "content/ar/index.mdx",
      "content/ar/quickstart.mdx",
      "content/index.mdx",
      "content/quickstart.mdx",
      "public/_redirects",
      "public/llms-full.txt",
      "public/llms.txt",
      "react-router.config.ts",
      "tsconfig.json",
      "vite.config.ts",
    ]);
    expect(text(result, "content/ar/index.mdx")).toContain("<bdi>RAGI2929</bdi>");
    expect(text(result, "app/root.tsx")).toContain("dir={locale.dir}");
    expect(text(result, "app/lib/layout.tsx")).toContain("i18n: true");
    expect(text(result, "app/theme.css")).toContain(
      'html[lang="ar"] body {\n  font-family: "IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif;',
    );
    // llms.txt stays the default locale's.
    expect(text(result, "public/llms.txt")).not.toContain("/ar");
  });

  /** One tree per locale: translated pages under /ar with their own titles, the rest linking to English. */
  it("writes the locales, a page tree per locale and every path to prerender", () => {
    const json = JSON.parse(text(site(), "app/site.json"));
    expect(Object.keys(json)).toEqual([
      "name",
      "description",
      "logo",
      "favicon",
      "links",
      "footer",
      "layout",
      "paths",
      "tree",
      "locales",
      "trees",
      "translations",
    ]);
    expect(json.paths).toEqual([
      "/",
      "/adr",
      "/adr/0001-layout",
      "/ar",
      "/ar/quickstart",
      "/quickstart",
    ]);
    expect(json.locales).toEqual([
      { code: "en", label: "English", dir: "ltr", prefix: "", font: null },
      {
        code: "ar",
        label: "العربية",
        dir: "rtl",
        prefix: "ar",
        font: {
          family: "IBM Plex Sans Arabic",
          href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap",
        },
      },
    ]);
    expect(json.trees.en).toEqual(json.tree);
    expect(json.trees.ar.children[0].name).toBe("الأدلة");
    expect(json.trees.ar.children[0].children).toEqual([
      { $id: "tab.0.0", type: "separator", name: "البداية" },
      { type: "page", name: "مقدمة", url: "/ar" },
      { type: "page", name: "البدء السريع", url: "/ar/quickstart" },
      { $id: "tab.0.1", type: "separator", name: "Decisions" },
      { type: "page", name: "Decisions", url: "/adr" },
      { type: "page", name: "0001", url: "/adr/0001-layout" },
    ]);
    expect(json.translations.ar.toc).toBe("في هذه الصفحة");
    expect(json.translations.en).toEqual({});
  });

  /** An untranslated default page is a warning, never a refusal: the site is still written. */
  it("warns, without refusing, for each default page that has no translation", () => {
    const result = site();
    expect(result.files.length).toBeGreaterThan(0);
    expect(
      result.warnings?.map((warning) => [warning.code, warning.subject, warning.severity]),
    ).toEqual([
      ["docs_locale_page_untranslated", "ar/adr/index", "warning"],
      ["docs_locale_page_untranslated", "ar/adr/0001-layout", "warning"],
    ]);
  });

  /** A translation without its default page, a page in a locale's folder, and malformed locales are refused. */
  it("refuses an orphan translation, a page in a locale's folder and malformed locales", () => {
    const refusals = (patch: Partial<DocsSiteInput["config"]>, files = FILES_EN_AR) =>
      site(patch, files).errors.map((error) => error.code);
    expect(
      refusals({}, [...FILES_EN_AR, { path: "docs/pricing.ar.mdx", content: page("الأسعار") }]),
    ).toEqual(["docs_locale_page_orphan"]);
    expect(
      refusals(
        {
          navigation: [
            {
              tab: "Guides",
              groups: [
                { group: "Start", pages: ["index", "quickstart", "ar/legacy"] },
                { group: "Decisions", pages: [{ folder: "adr" }] },
              ],
            },
          ],
        },
        [...FILES_EN_AR, { path: "docs/ar/legacy.mdx", content: page("Legacy") }],
      ),
    ).toEqual(["docs_locale_path_taken"]);
    const english = FILES_EN_AR.filter((file) => !file.path.includes(".ar."));
    expect(
      refusals({ locales: [{ code: "EN", label: "English", default: true }] }, english),
    ).toEqual(["docs_locales_invalid"]);
    expect(
      refusals({
        locales: [
          { code: "en", label: "English" },
          { code: "ar", label: "العربية" },
        ],
      }),
    ).toEqual(["docs_locales_invalid"]);
    expect(
      emitDocsSite({
        config: { ...CONFIG, locales: LOCALES },
        files: FILES,
        services: [],
      }).errors.map((error) => error.code),
    ).toContain("docs_locales_unsupported");
  });
});
