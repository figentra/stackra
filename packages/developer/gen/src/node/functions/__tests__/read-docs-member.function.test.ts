/**
 * Stackra file contract:
 * Purpose: unit tests of `readDocsMember` and `isDocsMember`: a docs member's `docs.yaml` settings with the
 *          navigation of its meta.json files (a translation left out of it), every file under `content/` mapped to the
 *          emitter's layout with the meta.json files consumed, the member's source paths, `resolve` back to
 *          `content/`, and the refusals of a meta.json gen does not support; `isDocsMember` by the package.json kind.
 * Boundary: test only; writes docs members under `<gen>/.cache/fixtures/` and reads them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0514 (amendment of 2026-11-09: the docs member).
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { DOCS_MEMBER_SOURCE } from "#core/constants/docs-member-source.constant";
import { isDocsMember } from "#node/functions/is-docs-member.function";
import { readDocsMember } from "#node/functions/read-docs-member.function";

/** The gen package root. */
const GEN_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

let written = 0;

/** A member on disk with `files` (paths relative to the member root). */
function writeMember(files: Readonly<Record<string, string>>): string {
  written += 1;
  const root = join(GEN_ROOT, ".cache", "fixtures", `read-docs-member-${process.pid}-${written}`);
  rmSync(root, { recursive: true, force: true });
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

/** A docs member in English and Arabic, with a tab, a snippet and assets. */
const MEMBER: Readonly<Record<string, string>> = {
  "package.json": JSON.stringify({ name: "@acme/docs", stackra: { kind: "docs" } }),
  "docs.yaml": [
    "# yaml-language-server: $schema=https://static.stackra.figentra.com/schemas/docs.json",
    "name: Acme",
    "description: The Acme docs.",
    "colors:",
    '  primary: "#0B0D0F"',
    "favicon: favicon.svg",
    "locales:",
    "  - code: en",
    "    label: English",
    "    default: true",
    "  - code: ar",
    "    label: العربية",
    "    dir: rtl",
    "",
  ].join("\n"),
  "content/meta.json": JSON.stringify({ pages: ["index", "..."] }),
  "content/index.mdx": "# Home\n",
  "content/index.ar.mdx": "# الرئيسية\n",
  "content/quickstart.mdx": "# Start\n",
  "content/guides/meta.json": JSON.stringify({ title: "Guides", icon: "book", root: true }),
  "content/guides/setup.mdx": "# Setup\n",
  "content/assets/favicon.svg": "<svg/>",
  "content/snippets/note.mdx": "A note.\n",
};

describe("readDocsMember", () => {
  it("reads docs.yaml, the meta.json navigation and content/ in the emitter's layout", () => {
    const root = writeMember(MEMBER);
    const member = readDocsMember(root);
    if ("errors" in member) throw new Error(JSON.stringify(member.errors));
    expect(member.config).toEqual({
      name: "Acme",
      description: "The Acme docs.",
      colors: { primary: "#0B0D0F" },
      favicon: "favicon.svg",
      locales: [
        { code: "en", label: "English", default: true },
        { code: "ar", label: "العربية", dir: "rtl" },
      ],
      apiReference: [],
      redirects: [],
      raw: {},
      theme: "mint",
      navigation: [
        { tab: "Acme", groups: [{ group: "Acme", pages: ["index", "quickstart"] }] },
        { tab: "Guides", icon: "book", groups: [{ group: "Guides", pages: ["guides/setup"] }] },
      ],
    });
    expect(member.files).toEqual([
      { path: "assets/favicon.svg" },
      { path: "docs/guides/setup.mdx", content: "# Setup\n" },
      { path: "docs/index.ar.mdx", content: "# الرئيسية\n" },
      { path: "docs/index.mdx", content: "# Home\n" },
      { path: "docs/quickstart.mdx", content: "# Start\n" },
      { path: "snippets/note.mdx", content: "A note.\n" },
    ]);
    expect(member.source).toEqual(DOCS_MEMBER_SOURCE);
    expect(member.resolve("assets/favicon.svg")).toBe(join(root, "content/assets/favicon.svg"));
    expect(member.resolve("snippets/note.mdx")).toBe(join(root, "content/snippets/note.mdx"));
  });

  it("refuses a missing docs.yaml and the meta.json entries gen does not support", () => {
    const { "docs.yaml": _settings, ...rest } = MEMBER;
    const root = writeMember({
      ...rest,
      "content/meta.json": JSON.stringify({ pages: ["index", "!quickstart", "..."] }),
      "content/guides/meta.json": JSON.stringify({ root: true, collapsible: false }),
    });
    const member = readDocsMember(root);
    expect(
      "errors" in member ? member.errors.map((error) => [error.code, error.file]) : [],
    ).toEqual([
      ["docs_config_invalid", "docs.yaml"],
      ["docs_meta_invalid", "content/guides/meta.json"],
      ["docs_meta_entry_invalid", "content/meta.json"],
    ]);
  });
});

describe("isDocsMember", () => {
  it("is true only for a package.json whose stackra.kind is docs", () => {
    expect(isDocsMember(writeMember(MEMBER))).toBe(true);
    expect(
      isDocsMember(
        writeMember({ "package.json": JSON.stringify({ stackra: { kind: "package" } }) }),
      ),
    ).toBe(false);
    expect(isDocsMember(writeMember({ "package.json": "{ not json" }))).toBe(false);
    expect(isDocsMember(writeMember({ "docs.yaml": "name: x\n" }))).toBe(false);
  });
});
