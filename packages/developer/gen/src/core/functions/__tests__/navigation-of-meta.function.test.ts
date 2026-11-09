/**
 * Stackra file contract:
 * Purpose: unit tests of `navigationOfMeta`: with no meta.json, one tab named after the site in the default order
 *          (`index` first, subfolders as nested groups); `root` folders as tabs in the root meta's order, with titles,
 *          icons, separators and nested folders whose separators nest further; `...` as the rest in default order;
 *          and the refusals `docs_meta_root_nested`, `docs_meta_invalid` and `docs_meta_entry_invalid`.
 * Boundary: test only; plain inputs, no file system.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0514 (amendment of 2026-11-09: the docs member).
 */
import { describe, expect, it } from "@stackra/testing";

import { navigationOfMeta } from "#core/functions/navigation-of-meta.function";

describe("navigationOfMeta", () => {
  it("lists every page in the default order under one tab when no meta.json exists", () => {
    const { navigation, errors } = navigationOfMeta({
      name: "Pay",
      pages: ["quickstart", "guides/setup", "index", "guides/index"],
      folders: [],
      metas: {},
    });
    expect(errors).toEqual([]);
    expect(navigation).toEqual([
      {
        tab: "Pay",
        groups: [
          {
            group: "Pay",
            pages: [
              "index",
              { group: "guides", pages: ["guides/index", "guides/setup"] },
              "quickstart",
            ],
          },
        ],
      },
    ]);
  });

  it("makes root folders tabs in the root meta's order, with separators and nested folders", () => {
    const { navigation, errors } = navigationOfMeta({
      name: "Pay",
      pages: [
        "index",
        "quickstart",
        "api/index",
        "api/auth",
        "guides/index",
        "guides/setup",
        "guides/advanced/index",
        "guides/advanced/caching",
      ],
      folders: ["api", "guides", "guides/advanced"],
      metas: {
        "": {
          title: "Docs",
          icon: "book",
          pages: ["index", "---Start---", "quickstart", "guides", "api"],
        },
        guides: {
          title: "Guides",
          root: true,
          pages: ["index", "---Basics---", "setup", "advanced"],
        },
        api: { root: true, icon: "code", defaultOpen: true },
        "guides/advanced": { title: "Advanced", pages: ["index", "---Tuning---", "caching"] },
      },
    });
    expect(errors).toEqual([]);
    expect(navigation).toEqual([
      {
        tab: "Docs",
        icon: "book",
        groups: [
          { group: "Docs", pages: ["index"] },
          { group: "Start", pages: ["quickstart"] },
        ],
      },
      {
        tab: "Guides",
        groups: [
          { group: "Guides", pages: ["guides/index"] },
          {
            group: "Basics",
            pages: [
              "guides/setup",
              {
                group: "Advanced",
                pages: [
                  "guides/advanced/index",
                  { group: "Tuning", pages: ["guides/advanced/caching"] },
                ],
              },
            ],
          },
        ],
      },
      { tab: "api", icon: "code", groups: [{ group: "api", pages: ["api/index", "api/auth"] }] },
    ]);
  });

  it("puts the root folders the root meta leaves out after the named ones, by name", () => {
    const { navigation } = navigationOfMeta({
      name: "Pay",
      pages: ["b/index", "a/index", "c/index"],
      folders: [],
      metas: { "": { pages: ["c"] }, a: { root: true }, b: { root: true }, c: { root: true } },
    });
    expect(navigation.map((tab) => tab.tab)).toEqual(["c", "a", "b"]);
  });

  it("expands `...` to the pages and folders named nowhere else, in the default order", () => {
    const { navigation, errors } = navigationOfMeta({
      name: "Site",
      pages: ["index", "a", "b", "c", "sub/x"],
      folders: ["sub"],
      metas: { "": { pages: ["c", "...", "a"] } },
    });
    expect(errors).toEqual([]);
    expect(navigation).toEqual([
      {
        tab: "Site",
        groups: [
          {
            group: "Site",
            pages: ["c", "index", "b", { group: "sub", pages: ["sub/x"] }, "a"],
          },
        ],
      },
    ]);
  });

  it("refuses a nested root, a malformed meta.json and the entries gen does not support", () => {
    const { errors } = navigationOfMeta({
      name: "Site",
      pages: ["index", "guides/deep/x", "api/y"],
      folders: [],
      metas: {
        "guides/deep": { root: true },
        "": { pages: ["!hidden", "z...a", "[Blog](https://example.com)", "missing", "index"] },
        guides: "nope",
        api: { title: 3, collapsible: true },
      },
    });
    expect(errors.map((error) => [error.code, error.file, error.subject])).toEqual([
      [
        "docs_meta_root_nested",
        "content/guides/deep/meta.json",
        "content/guides/deep/meta.json#root",
      ],
      ["docs_meta_invalid", "content/guides/meta.json", "content/guides/meta.json"],
      ["docs_meta_invalid", "content/api/meta.json", "content/api/meta.json#title"],
      ["docs_meta_invalid", "content/api/meta.json", "content/api/meta.json#collapsible"],
      ["docs_meta_entry_invalid", "content/meta.json", "!hidden"],
      ["docs_meta_entry_invalid", "content/meta.json", "z...a"],
      ["docs_meta_entry_invalid", "content/meta.json", "[Blog](https://example.com)"],
      ["docs_meta_entry_invalid", "content/meta.json", "missing"],
    ]);
    expect(errors.every((error) => error.fix !== "")).toBe(true);
  });

  it("refuses `root` on content/meta.json", () => {
    const { errors } = navigationOfMeta({
      name: "Site",
      pages: ["index"],
      folders: [],
      metas: { "": { root: true } },
    });
    expect(errors.map((error) => error.code)).toEqual(["docs_meta_invalid"]);
  });
});
