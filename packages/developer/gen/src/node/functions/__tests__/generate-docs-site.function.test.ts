/**
 * Stackra file contract:
 * Purpose: unit tests of the docs-site run: `generate` on a docs app (one with `src/config/docs.config.ts`) writes the
 *          Mintlify root into `.stackra/site/` (docs.json, the pages at the root, the copied assets), a second run
 *          changes nothing, a deleted page is removed from the site, the manifest pass writes nothing, a check run
 *          writes nothing, a refusal writes nothing, and a config exporting two classes is `docs_config_invalid`. On a
 *          docs member (`"stackra": { "kind": "docs" }`), it writes the Fumadocs site from `content/`, `docs.yaml` and
 *          the `meta.json` tabs, assets copied from `content/assets`, writes nothing in the manifest pass or a check
 *          run, and refuses an unreached page (naming `content/**\/meta.json`), `theme` and `navigation` in
 *          `docs.yaml` and a meta.json that is not JSON.
 * Boundary: test only; writes docs members under `<gen>/.cache/fixtures/` and runs gen on them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0002 (2026-10-27 amendment); STA-1316; ADR 0514 (amendment of
 *                     2026-11-09: the docs member).
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { generate } from "#node/functions/generate.function";

/** The gen package root. */
const GEN_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

let written = 0;

/** A plain data class: gen reads the fields of the one exported class, whatever its base. */
const CONFIG = `export class HandbookDocsConfig {
  name = "Handbook";
  theme = "mint";
  colors = { primary: "#0B0D0F" };
  favicon = "favicon.svg";
  navigation = [{ tab: "Guides", groups: [{ group: "Start", pages: ["index", { folder: "guides" }] }] }];
}
`;

/** A docs member on disk with `files` (paths relative to the member root). */
function writeDocsMember(files: Readonly<Record<string, string>>): string {
  written += 1;
  const root = join(GEN_ROOT, ".cache", "fixtures", `docs-${process.pid}-${written}`);
  rmSync(root, { recursive: true, force: true });
  for (const [path, content] of Object.entries({
    "package.json": JSON.stringify({ name: "@acme/handbook", version: "0.0.1", type: "module" }),
    "src/config/docs.config.ts": CONFIG,
    "src/docs/index.mdx": '---\ntitle: "Home"\n---\n\nHello.\n',
    "src/docs/guides/setup.mdx": '---\ntitle: "Setup"\n---\n\n![x](/assets/shot.png)\n',
    "src/assets/favicon.svg": "<svg/>",
    "src/assets/shot.png": "png",
    ...files,
  })) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

describe("generate on a docs app", () => {
  it("assembles .stackra/site, then finds nothing to change, then prunes a deleted page", async () => {
    const root = writeDocsMember({});
    const first = await generate(root);
    expect(first.errors).toEqual([]);
    expect(first.changed).toEqual([
      ".stackra/site/assets/favicon.svg",
      ".stackra/site/assets/shot.png",
      ".stackra/site/docs.json",
      ".stackra/site/guides/setup.mdx",
      ".stackra/site/index.mdx",
      ".stackra/site/llms.txt",
    ]);
    const docs = JSON.parse(readFileSync(join(root, ".stackra/site/docs.json"), "utf8"));
    expect(docs.navigation.tabs[0].groups[0].pages).toEqual(["index", "guides/setup"]);
    expect(existsSync(join(root, "src/docs.json"))).toBe(false);

    expect((await generate(root)).changed).toEqual([]);

    rmSync(join(root, "src/docs/guides/setup.mdx"));
    rmSync(join(root, "src/assets/shot.png"));
    writeFileSync(join(root, "src/docs/guides/start.mdx"), '---\ntitle: "Start"\n---\n');
    const third = await generate(root);
    expect(third.errors).toEqual([]);
    expect(third.changed).toContain(".stackra/site/guides/setup.mdx");
    expect(existsSync(join(root, ".stackra/site/guides/setup.mdx"))).toBe(false);
    expect(existsSync(join(root, ".stackra/site/assets/shot.png"))).toBe(false);
  });

  it("builds a Fumadocs site for an app that depends on fumadocs-ui, and keeps its build output (STA-2026)", async () => {
    const root = writeDocsMember({
      "package.json": JSON.stringify({
        name: "@acme/handbook",
        version: "0.0.1",
        type: "module",
        dependencies: { "fumadocs-ui": "16.17.9" },
      }),
    });
    const first = await generate(root);
    expect(first.errors).toEqual([]);
    expect(existsSync(join(root, ".stackra/site/docs.json"))).toBe(false);
    expect(existsSync(join(root, ".stackra/site/app/site.json"))).toBe(true);
    expect(existsSync(join(root, ".stackra/site/react-router.config.ts"))).toBe(true);
    mkdirSync(join(root, ".stackra/site/build/client"), { recursive: true });
    writeFileSync(join(root, ".stackra/site/build/client/index.html"), "<html></html>");
    expect((await generate(root)).changed).toEqual([]);
    expect(existsSync(join(root, ".stackra/site/build/client/index.html"))).toBe(true);
  });

  it("writes nothing in the manifest pass or a check run", async () => {
    const root = writeDocsMember({});
    expect(await generate(root, { pass: "manifests" })).toEqual({
      errors: [],
      files: [],
      changed: [],
    });
    const check = await generate(root, { check: true });
    expect(check.errors).toEqual([]);
    expect(check.changed).toEqual([]);
    expect(existsSync(join(root, ".stackra/site"))).toBe(false);
  });

  it("refuses a docs.json under src/ and writes nothing", async () => {
    const root = writeDocsMember({ "src/docs.json": "{}" });
    const result = await generate(root);
    expect(result.errors.map((error) => error.code)).toEqual(["docs_source_misplaced"]);
    expect(existsSync(join(root, ".stackra/site"))).toBe(false);
  });

  it("refuses a config that exports two classes", async () => {
    const root = writeDocsMember({
      "src/config/docs.config.ts": `${CONFIG}export class Other {}\n`,
    });
    expect((await generate(root)).errors.map((error) => error.code)).toEqual([
      "docs_config_invalid",
    ]);
  });
});

/** A docs member (ADR 0514 amendment of 2026-11-09) on disk with `files` (paths relative to the member root). */
function writeContentMember(files: Readonly<Record<string, string>>): string {
  written += 1;
  const root = join(GEN_ROOT, ".cache", "fixtures", `docs-member-${process.pid}-${written}`);
  rmSync(root, { recursive: true, force: true });
  for (const [path, content] of Object.entries({
    "package.json": JSON.stringify({
      name: "@acme/docs",
      version: "0.0.1",
      private: true,
      stackra: { kind: "docs" },
    }),
    "docs.yaml": 'name: Acme\ncolors:\n  primary: "#0B0D0F"\nfavicon: favicon.svg\n',
    "content/meta.json": JSON.stringify({
      title: "Acme",
      pages: ["index", "quickstart", "guides"],
    }),
    "content/index.mdx": '---\ntitle: "Home"\n---\n\nHello.\n',
    "content/quickstart.mdx": '---\ntitle: "Quickstart"\n---\n\nStart.\n',
    "content/guides/meta.json": JSON.stringify({ title: "Guides", root: true }),
    "content/guides/index.mdx": '---\ntitle: "Guides"\n---\n',
    "content/guides/setup.mdx": '---\ntitle: "Setup"\n---\n\n![x](/assets/shot.png)\n',
    "content/assets/favicon.svg": "<svg/>",
    "content/assets/shot.png": "png",
    ...files,
  })) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

describe("generate on a docs member", () => {
  it("assembles the Fumadocs site from content/, docs.yaml and meta.json, then finds nothing to change", async () => {
    const root = writeContentMember({});
    const first = await generate(root);
    expect(first.errors).toEqual([]);
    expect(first.changed).toContain(".stackra/site/content/index.mdx");
    expect(first.changed).toContain(".stackra/site/content/guides/setup.mdx");
    expect(first.changed).toContain(".stackra/site/public/assets/shot.png");
    expect(first.changed).toContain(".stackra/site/public/assets/favicon.svg");
    expect(existsSync(join(root, ".stackra/site/docs.json"))).toBe(false);
    expect(existsSync(join(root, ".stackra/site/content/meta.json"))).toBe(false);
    expect(readFileSync(join(root, ".stackra/site/public/assets/shot.png"), "utf8")).toBe("png");
    const site = JSON.parse(readFileSync(join(root, ".stackra/site/app/site.json"), "utf8"));
    expect(site.name).toBe("Acme");
    expect(site.favicon).toBe("/assets/favicon.svg");
    expect(
      site.tree.children.map((tab: { name: string; children: { name: string }[] }) => [
        tab.name,
        tab.children.map((node) => node.name),
      ]),
    ).toEqual([
      ["Acme", ["Acme", "Home", "Quickstart"]],
      ["Guides", ["Guides", "Guides", "Setup"]],
    ]);
    expect(readFileSync(join(root, ".stackra/site/app/theme.css"), "utf8")).toMatch(
      /^\/\* .*; from docs\.yaml \*\/\n/,
    );

    expect((await generate(root)).changed).toEqual([]);
  });

  it("writes nothing in the manifest pass or a check run", async () => {
    const root = writeContentMember({});
    expect(await generate(root, { pass: "manifests" })).toEqual({
      errors: [],
      files: [],
      changed: [],
    });
    const check = await generate(root, { check: true });
    expect(check.errors).toEqual([]);
    expect(check.files.map((file) => file.path)).toContain(".stackra/site/app/site.json");
    expect(existsSync(join(root, ".stackra/site"))).toBe(false);
  });

  it("refuses a page no meta.json reaches, naming the member's own files", async () => {
    const root = writeContentMember({
      "content/guides/meta.json": JSON.stringify({ root: true, pages: ["index", "setup"] }),
      "content/guides/extra.mdx": '---\ntitle: "Extra"\n---\n',
    });
    const result = await generate(root);
    expect(result.errors.map((error) => [error.code, error.file, error.fix])).toEqual([
      [
        "docs_page_unlisted",
        "content/guides/extra.mdx",
        'list "guides/extra" (or its folder) in a group of content/**/meta.json, or delete the page',
      ],
    ]);
    expect(existsSync(join(root, ".stackra/site"))).toBe(false);
  });

  it("refuses theme and navigation in docs.yaml, and a meta.json that is not JSON, and writes nothing", async () => {
    const root = writeContentMember({
      "docs.yaml": 'name: Acme\ncolors:\n  primary: "#0B0D0F"\ntheme: mint\nnavigation: []\n',
      "content/guides/meta.json": '{ "root": true, }',
    });
    const result = await generate(root);
    expect(result.errors.map((error) => [error.code, error.file, error.subject])).toEqual([
      ["docs_config_invalid", "docs.yaml", "theme"],
      ["docs_config_invalid", "docs.yaml", "navigation"],
      ["docs_meta_invalid", "content/guides/meta.json", "content/guides/meta.json"],
    ]);
    expect(result.errors[1]?.fix).toContain("content/**/meta.json");
    expect(existsSync(join(root, ".stackra/site"))).toBe(false);
  });
});
