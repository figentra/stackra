/**
 * Stackra file contract:
 * Purpose: unit tests of the docs-site run: `generate` on a docs app (one with `src/config/docs.config.ts`) writes the
 *          Mintlify root into `.stackra/site/` (docs.json, the pages at the root, the copied assets), a second run
 *          changes nothing, a deleted page is removed from the site, the manifest pass writes nothing, a check run
 *          writes nothing, a refusal writes nothing, and a config exporting two classes is `docs_config_invalid`.
 * Boundary: test only; writes a docs member under `<gen>/.cache/fixtures/` and runs gen on it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0002 (2026-10-27 amendment); STA-1316.
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
