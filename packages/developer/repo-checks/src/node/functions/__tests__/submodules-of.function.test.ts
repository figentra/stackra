/**
 * Stackra file contract:
 * Purpose: unit tests of `submodulesOf`: every `[submodule "<name>"]` section with its path and url, in file order;
 *          comments, quotes, other sections and a missing key are read the way git reads them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0526 (decision 4); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { submodulesOf } from "#node/functions/submodules-of.function";

describe("submodulesOf", () => {
  it("reads each submodule section with its path and url", () => {
    const text = [
      "# vendored sources",
      '[submodule "vendor/a"]',
      "\tpath = vendor/a",
      "\turl = https://example.com/a.git",
      '[submodule "b"]',
      '\tpath = "third party/b" ; a comment',
      "\tURL = ../b.git",
      "",
    ].join("\n");
    expect(submodulesOf(text)).toEqual([
      { name: "vendor/a", path: "vendor/a", url: "https://example.com/a.git" },
      { name: "b", path: "third party/b", url: "../b.git" },
    ]);
  });

  it("skips other sections and fills a missing path or url", () => {
    const text = '[core]\n\turl = nope\n[submodule "only-name"]\n\tbranch = main\n';
    expect(submodulesOf(text)).toEqual([{ name: "only-name", path: "only-name", url: "" }]);
  });

  it("reads an empty file as no submodule", () => {
    expect(submodulesOf("")).toEqual([]);
  });
});
