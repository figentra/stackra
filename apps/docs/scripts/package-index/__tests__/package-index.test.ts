/**
 * Stackra file contract:
 * Purpose: tests of the customer package index: `renderPackageIndex` groups by category and sorts by name whatever the
 *          input order, escapes cells so a summary never breaks the MDX table, lists a command-only package by its
 *          command, counts the packages and links stackra-inc; `collectPackageIndex` keeps published packages only,
 *          drops `./package.json` and refuses a package with no summary or a broken package.json, naming the file;
 *          `writePackageIndex` / `checkPackageIndex` round-trip; and the committed `customers/packages.mdx` is exactly
 *          what the writer produces from this repository's packages (the drift check).
 * Boundary: test only; fixtures are written to a temporary folder, and the drift check reads the real repository.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (amendment 2026-10-27); STA-2847.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { checkPackageIndex } from "../check-package-index";
import { collectPackageIndex } from "../collect-package-index";
import { PACKAGE_INDEX_PAGE } from "../package-index-page";
import type { PackageIndexRecord } from "../package-index-record";
import { PACKAGE_INDEX_REPOSITORY } from "../package-index-repository";
import { renderPackageIndex } from "../render-package-index";
import { writePackageIndex } from "../write-package-index";

const MONEY: PackageIndexRecord = {
  name: "@stackra/money",
  category: "commerce",
  folder: "money",
  summary: "Use it for money.",
  entries: ["./contracts", "."],
};
const CONTAINER: PackageIndexRecord = {
  name: "@stackra/container",
  category: "foundation",
  folder: "container",
  summary: "Use it to wire classes.",
  entries: ["."],
};
const ACTIONS: PackageIndexRecord = {
  name: "@stackra/actions",
  category: "commerce",
  folder: "actions",
  summary: "Use it for actions.",
  entries: ["."],
};

/** A temporary repository with the given `packages/<category>/<folder>/package.json` files. */
function repository(files: Record<string, unknown>): string {
  const root = mkdtempSync(join(tmpdir(), "package-index-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, "packages", path), { recursive: true });
    writeFileSync(
      join(root, "packages", path, "package.json"),
      typeof content === "string" ? content : JSON.stringify(content),
    );
  }
  return root;
}

describe("renderPackageIndex", () => {
  it("groups by category in alphabetical order and sorts rows by name, whatever the input order", () => {
    const page = renderPackageIndex([CONTAINER, MONEY, ACTIONS]);
    expect(page.indexOf("## `commerce`")).toBeLessThan(page.indexOf("## `foundation`"));
    expect(page.indexOf("`@stackra/actions`")).toBeLessThan(page.indexOf("`@stackra/money`"));
    expect(renderPackageIndex([ACTIONS, MONEY, CONTAINER])).toBe(page);
  });

  it("counts the packages, names no date and links README and CHANGELOG under stackra-inc", () => {
    const page = renderPackageIndex([MONEY, CONTAINER]);
    expect(page).toContain("published `@stackra` package (2)");
    // The file contract comment cites an ADR amendment by its date; the reader-facing text names none.
    expect(page.replaceAll(/\{\/\*[\s\S]*?\*\/\}/g, "")).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(PACKAGE_INDEX_REPOSITORY).toBe("https://github.com/stackra-inc/stackra");
    expect(page).toContain(
      "[README](https://github.com/stackra-inc/stackra/tree/main/packages/commerce/money#readme) · [CHANGELOG](https://github.com/stackra-inc/stackra/blob/main/packages/commerce/money/CHANGELOG.md)",
    );
  });

  it("sorts entry points and names a command-only package by its command", () => {
    const page = renderPackageIndex([
      MONEY,
      { ...CONTAINER, name: "@stackra/cli", entries: [], commands: ["stackra"] },
      { ...CONTAINER, name: "@stackra/bare", entries: [] },
    ]);
    expect(page).toContain("`.`, `./contracts`");
    expect(page).toContain("none; the `stackra` command");
    expect(page).toMatch(/`@stackra\/bare` +\| .* \| none +\|/);
  });

  it("escapes pipes, MDX expressions, tags and asterisks in a summary", () => {
    const page = renderPackageIndex([
      { ...MONEY, summary: "Splits a|b, reads {x} and <Tag/>, serves #stackra/* modules." },
    ]);
    expect(page).toContain(
      "Splits a\\|b, reads \\{x\\} and &lt;Tag/&gt;, serves #stackra/\\* modules.",
    );
  });

  it("pads every row of a table to the same width", () => {
    const table = renderPackageIndex([MONEY, ACTIONS])
      .split("\n")
      .filter((line) => line.startsWith("|"));
    expect(new Set(table.map((line) => line.length)).size).toBe(1);
  });

  it("says so when no package is published", () => {
    expect(renderPackageIndex([])).toContain("No `@stackra` package is published yet.");
  });
});

describe("collectPackageIndex", () => {
  it("keeps published packages, drops ./package.json and reads commands from bin", () => {
    const root = repository({
      "commerce/money": {
        name: "@stackra/money",
        private: false,
        exports: { ".": "./dist/index.mjs", "./package.json": "./package.json" },
        stackra: { summary: "  Use it for money.  " },
      },
      "developer/cli": {
        name: "@stackra/cli",
        private: false,
        exports: { "./package.json": "./package.json" },
        bin: { stackra: "./dist/stackra.mjs" },
        stackra: { summary: "The CLI." },
      },
      "design-system/showcase": { name: "@stackra/showcase", private: true },
    });
    expect(collectPackageIndex(root)).toEqual([
      {
        name: "@stackra/money",
        category: "commerce",
        folder: "money",
        summary: "Use it for money.",
        entries: ["."],
        commands: [],
      },
      {
        name: "@stackra/cli",
        category: "developer",
        folder: "cli",
        summary: "The CLI.",
        entries: [],
        commands: ["stackra"],
      },
    ]);
  });

  it("refuses a published package with no summary, naming its package.json", () => {
    const root = repository({ "commerce/money": { name: "@stackra/money", private: false } });
    expect(() => collectPackageIndex(root)).toThrow(
      /commerce\/money\/package\.json has no stackra\.summary/,
    );
  });

  it("refuses a package.json that is not valid JSON, naming it", () => {
    const root = repository({ "commerce/money": "{ not json" });
    expect(() => collectPackageIndex(root)).toThrow(
      /commerce\/money\/package\.json is not valid JSON/,
    );
  });
});

describe("writePackageIndex and checkPackageIndex", () => {
  it("writes the page, then reports it current until a package changes", () => {
    const root = repository({
      "commerce/money": {
        name: "@stackra/money",
        exports: { ".": "./x" },
        stackra: { summary: "Money." },
      },
    });
    const page = join(root, "packages.mdx");
    expect(checkPackageIndex(root, page)).toBe(false);
    expect(writePackageIndex(root, page)).toBe(1);
    expect(checkPackageIndex(root, page)).toBe(true);
    expect(readFileSync(page, "utf8")).toContain("`@stackra/money`");
    writeFileSync(
      join(root, "packages", "commerce", "money", "package.json"),
      JSON.stringify({
        name: "@stackra/money",
        exports: { ".": "./x" },
        stackra: { summary: "Changed." },
      }),
    );
    expect(checkPackageIndex(root, page)).toBe(false);
  });
});

describe("the committed customers/packages.mdx", () => {
  it("is exactly what the writer produces from this repository's packages", () => {
    expect(
      checkPackageIndex(),
      `${PACKAGE_INDEX_PAGE} is stale: run node apps/docs/scripts/package-index/write-package-index.ts and commit it`,
    ).toBe(true);
  });
});
