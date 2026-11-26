/**
 * Stackra file contract:
 * Purpose: tests of the API reference over a throwaway repository: `listPackages` reads `package.json` (private
 *          packages left out, code and file entries, the source link); `ApiReader` prints classes (no private,
 *          `#private` or `@internal` member), overloads, inferred types, interfaces, a `const` merged with a `type`,
 *          and names re-exported from another package; the renderers write the index and a page per package; and
 *          `writeApiReference` writes the pages, removes a stale one, and in check mode fails on a missing, changed or
 *          stale page (the drift check `pnpm validate` runs).
 * Boundary: test only; every file lives in a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0007 (docblock standard); STA-2857.
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { beforeAll, describe, expect, it } from "@stackra/testing";

import type { ApiPackage } from "../api-package.type";
import { ApiReader } from "../api.reader";
import { driftOf } from "../drift-of.function";
import { listPackages } from "../list-packages.function";
import { readPackageApis } from "../read-package-apis.function";
import { renderPackageIndex } from "../render-package-index.function";
import { renderReferencePages } from "../render-reference-pages.function";
import { writeApiReference } from "../write-api-reference";

/** Writes `files` (path → content) under `root`. */
function writeAll(root: string, files: Readonly<Record<string, string>>): void {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
}

/** A manifest of a published package. */
function manifest(
  name: string,
  exportsField: unknown,
  extra: Record<string, unknown> = {},
): string {
  return JSON.stringify({
    name,
    version: "1.2.3",
    repository: { type: "git", url: "git+https://github.com/acme/repo.git" },
    exports: exportsField,
    stackra: {
      category: "commerce",
      summary: `Use ${name} for {coins}.`,
      runtimes: ["isomorphic"],
    },
    ...extra,
  });
}

const COIN = `/** A coin of one value. */
export class Coin {
  /** The face value. */
  readonly value: number;
  private secret = 1;
  #hidden = 2;
  /**
   * A coin.
   * @param value - the face value.
   */
  constructor(value: number) {
    this.value = value + this.secret + this.#hidden;
  }
  /** A coin of \`value\`. */
  static of(value: number) {
    return new Coin(value);
  }
  /** Twice the value. */
  get doubled() {
    return this.value * 2;
  }
  /** For subclasses. */
  protected guard(): void {}
  /** @internal */
  internalThing(): void {}
}
`;

const MINT = `import { Coin } from "./coin";
/** Mints from a number. */
export function mint(value: number): Coin;
/** Mints from a decimal string. */
export function mint(value: string): Coin;
export function mint(value: number | string): Coin {
  return new Coin(Number(value));
}
/**
 * Parses digits.
 * @param text - the digits.
 * @param radix - the base.
 * @returns the number.
 * @example
 * parse("ff", 16); // 255
 */
export function parse(text: string, radix = 10) {
  return Number.parseInt(text, radix);
}
/** @internal */
export const secretInternal = 1;
`;

const FILES: Readonly<Record<string, string>> = {
  "packages/commerce/coins/package.json": manifest("@stackra/coins", {
    ".": { "@stackra/source": "./src/core/index.ts", types: "./dist/index.d.mts" },
    "./contracts": { "@stackra/source": "./src/contracts/index.ts" },
    "./assets/*": "./assets/*",
  }),
  "packages/commerce/coins/src/core/coin.ts": COIN,
  "packages/commerce/coins/src/core/mint.ts": MINT,
  "packages/commerce/coins/src/core/types.ts": `/** The shape of a coin. */
export interface CoinShape {
  /** The face value. */
  readonly value: number;
  /** A label for people. */
  describe(): string;
}
`,
  "packages/commerce/coins/src/core/kinds.ts": `/** The coin kinds. */
export const Kinds = {
  /** Gold. */
  Gold: "gold",
  Silver: "silver",
} as const;
/** One coin kind. */
export type Kinds = (typeof Kinds)[keyof typeof Kinds];
`,
  "packages/commerce/coins/src/core/index.ts": `export { Coin } from "./coin";
export { mint, parse, secretInternal } from "./mint";
export type { CoinShape } from "./types";
export { Kinds } from "./kinds";
export { helper } from "@stackra/other";
`,
  "packages/commerce/coins/src/contracts/index.ts":
    "/** A port. */\nexport interface Port {\n  /** Runs. */\n  run(): void;\n}\n",
  "packages/commerce/other/package.json": manifest("@stackra/other", {
    ".": { "@stackra/source": "./src/index.ts" },
  }),
  "packages/commerce/other/src/index.ts":
    "/** Helps. */\nexport function helper(): number {\n  return 1;\n}\n",
  "packages/commerce/hidden/package.json": manifest("@stackra/hidden", {}, { private: true }),
};

/** A fresh throwaway repository holding `FILES`. */
function fixtureRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "api-reference-"));
  writeAll(root, FILES);
  // the workspace link pnpm makes, so `@stackra/other` resolves to its folder as in the real repository
  mkdirSync(join(root, "node_modules/@stackra"), { recursive: true });
  symlinkSync(
    join(root, "packages/commerce/other"),
    join(root, "node_modules/@stackra/other"),
    "dir",
  );
  return root;
}

describe("listPackages", () => {
  it("lists published packages with their entries and source link", () => {
    const packages = listPackages(fixtureRepo());
    expect(packages.map((pkg) => pkg.name)).toEqual(["@stackra/coins", "@stackra/other"]);
    const coins = packages[0];
    expect(coins?.sourceUrl).toBe("https://github.com/acme/repo/tree/main/packages/commerce/coins");
    expect(coins?.entries.map((entry) => [entry.subpath, entry.kind, entry.target])).toEqual([
      [".", "code", "./src/core/index.ts"],
      ["./assets/*", "file", "./assets/*"],
      ["./contracts", "code", "./src/contracts/index.ts"],
    ]);
  });
});

describe("ApiReader and the renderers", () => {
  let root = "";
  let coins: ApiPackage;
  let packages: ApiPackage[] = [];

  beforeAll(() => {
    root = fixtureRepo();
    packages = readPackageApis(root, listPackages(root));
    coins = packages[0] as ApiPackage;
  }, 60_000);

  it("reads every exported name, sorted, without @internal ones", () => {
    expect(coins.entries[0]?.symbols.map((symbol) => [symbol.name, symbol.kind])).toEqual([
      ["Coin", "class"],
      ["CoinShape", "interface"],
      ["Kinds", "variable"],
      ["helper", "reexport"],
      ["mint", "function"],
      ["parse", "function"],
    ]);
  });

  it("prints a class without private, #private or @internal members, with inferred types", () => {
    const coin = coins.entries[0]?.symbols.find((symbol) => symbol.name === "Coin");
    expect(coin?.file).toBe("src/core/coin.ts");
    expect(coin?.signature).toContain("static of(value: number): Coin;");
    expect(coin?.signature).toContain("get doubled(): number;");
    expect(coin?.signature).toContain("protected guard(): void;");
    expect(coin?.signature).not.toMatch(/secret|hidden|internalThing|return/);
    expect(coin?.members.map((member) => [member.name, member.kind, member.isStatic])).toEqual([
      ["value", "property", false],
      ["constructor", "constructor", false],
      ["of", "method", true],
      ["doubled", "accessor", false],
      ["guard", "method", false],
    ]);
    expect(coin?.members[1]?.doc.params).toEqual([{ name: "value", text: "the face value." }]);
  });

  it("prints overloads without the implementation, and optional defaults", () => {
    const symbols = coins.entries[0]?.symbols ?? [];
    expect(symbols.find((symbol) => symbol.name === "mint")?.signature).toBe(
      "function mint(value: number): Coin;\n\nfunction mint(value: string): Coin;",
    );
    const parse = symbols.find((symbol) => symbol.name === "parse");
    expect(parse?.signature).toBe("function parse(text: string, radix?: number): number;");
    expect(parse?.doc.examples).toEqual(['parse("ff", 16); // 255']);
  });

  it("merges a const and a type of one name, with the object's keys as members", () => {
    const kinds = coins.entries[0]?.symbols.find((symbol) => symbol.name === "Kinds");
    expect(kinds?.signature).toContain("const Kinds:");
    expect(kinds?.signature).toContain("type Kinds = (typeof Kinds)[keyof typeof Kinds];");
    expect(kinds?.doc.summary).toBe("The coin kinds.");
    expect(kinds?.members.map((member) => [member.name, member.doc.summary])).toEqual([
      ["Gold", "Gold."],
      ["Silver", ""],
    ]);
  });

  it("names the package a re-exported name comes from", () => {
    const helper = coins.entries[0]?.symbols.find((symbol) => symbol.name === "helper");
    expect(helper?.from).toBe("@stackra/other");
  });

  it("renders a reference page with entries, declarations, members, re-exports and file entries", () => {
    const pages = renderReferencePages(coins);
    expect(pages.map((candidate) => candidate.path)).toEqual(["customers/reference/coins.mdx"]);
    const page = pages[0]?.content ?? "";
    expect(page.startsWith('---\ntitle: "@stackra/coins"\n')).toBe(true);
    expect(page).toContain("Use @stackra/coins for \\{coins\\}.");
    expect(page).toContain("## `@stackra/coins`\n");
    expect(page).toContain(
      "### `Coin`\n\nClass · declared in `src/core/coin.ts`\n\n```ts\nclass Coin {",
    );
    expect(page).toContain("| `static of(value: number): Coin;` | A coin of `value`. |");
    expect(page).toContain(
      "Re-exported from [`@stackra/other`](/customers/reference/other) (1): `helper`.",
    );
    expect(page).toContain("## `@stackra/coins/assets/*`\n\nA file entry");
    expect(page).toContain("## `@stackra/coins/contracts`");
    expect(page).toContain('**Example**\n\n```ts\nparse("ff", 16); // 255\n```');
    expect(renderReferencePages(coins)[0]?.content).toBe(page);
  });

  it("splits a package past the name budget into a page per entry point besides `.`", () => {
    const pages = renderReferencePages(coins, 3);
    expect(pages.map((candidate) => candidate.path)).toEqual([
      "customers/reference/coins.mdx",
      "customers/reference/coins--contracts.mdx",
    ]);
    const [main, contracts] = pages.map((candidate) => candidate.content);
    expect(main).toContain(
      "@stackra/coins exports 6 names, so each of these entry points has its own page:",
    );
    expect(main).toContain(
      "| [`@stackra/coins/contracts`](/customers/reference/coins--contracts) | 1 |",
    );
    expect(main).toContain("### `Coin`");
    expect(main).toContain("## `@stackra/coins/assets/*`");
    expect(main).not.toContain("### `Port`");
    expect(contracts?.startsWith('---\ntitle: "@stackra/coins/contracts"\n')).toBe(true);
    expect(contracts).toContain(
      "An entry point of [`@stackra/coins`](/customers/reference/coins) 1.2.3",
    );
    expect(contracts).toContain("### `Port`");
  });

  it("renders the package index from package.json facts, linking each reference page", () => {
    const index = renderPackageIndex(packages);
    expect(index).toContain("Every published `@stackra` package (2) by category.");
    expect(index).toContain("## `commerce`");
    expect(index).toContain(
      "| [`@stackra/coins`](/customers/reference/coins) | 1.2.3 | Use @stackra/coins for \\{coins\\}. | `.`, `./assets/*`, `./contracts` | [README](https://github.com/acme/repo/tree/main/packages/commerce/coins#readme) · [CHANGELOG](https://github.com/acme/repo/blob/main/packages/commerce/coins/CHANGELOG.md) |",
    );
    expect(index).not.toContain("@stackra/hidden");
  });
});

describe("ApiReader", () => {
  it("refuses a file outside its program", () => {
    expect(() => new ApiReader([]).read("/nowhere.ts", "/")).toThrow(/not in the program/);
  });
});

describe("driftOf", () => {
  it("names missing, changed and stale pages in path order", () => {
    expect(
      driftOf(
        new Map([
          ["b.mdx", "new"],
          ["c.mdx", "same"],
          ["d.mdx", "x"],
        ]),
        new Map([
          ["a.mdx", "old"],
          ["b.mdx", "old"],
          ["c.mdx", "same"],
        ]),
      ),
    ).toEqual(["stale a.mdx", "changed b.mdx", "missing d.mdx"]);
  });
});

describe("writeApiReference", () => {
  it("writes the pages, then its check passes until a package changes, and a write removes stale pages", () => {
    const root = fixtureRepo();
    const docsDir = join(root, "docs");
    expect(writeApiReference({ root, docsDir, check: true })).toEqual({
      ok: false,
      lines: [
        "missing customers/packages.mdx",
        "missing customers/reference/coins.mdx",
        "missing customers/reference/other.mdx",
      ],
    });
    expect(writeApiReference({ root, docsDir }).lines).toEqual([
      "customers/packages.mdx",
      "customers/reference/coins.mdx",
      "customers/reference/other.mdx",
    ]);
    expect(readFileSync(join(docsDir, "customers/reference/coins.mdx"), "utf8")).toBe(
      renderReferencePages(readPackageApis(root, listPackages(root))[0] as ApiPackage)[0]?.content,
    );
    expect(writeApiReference({ root, docsDir, check: true })).toEqual({ ok: true, lines: [] });

    // an exported signature changes: the committed page is stale until the script runs again
    const coin = join(root, "packages/commerce/coins/src/core/coin.ts");
    writeFileSync(
      coin,
      readFileSync(coin, "utf8").replace(
        "static of(value: number)",
        "static of(value: number, note?: string)",
      ),
    );
    writeAll(docsDir, { "customers/reference/gone.mdx": "old page\n" });
    expect(writeApiReference({ root, docsDir, check: true })).toEqual({
      ok: false,
      lines: ["changed customers/reference/coins.mdx", "stale customers/reference/gone.mdx"],
    });
    expect(writeApiReference({ root, docsDir }).lines).toEqual(["customers/reference/coins.mdx"]);
    expect(existsSync(join(docsDir, "customers/reference/gone.mdx"))).toBe(false);
    expect(writeApiReference({ root, docsDir, check: true }).ok).toBe(true);
  }, 120_000);
});
